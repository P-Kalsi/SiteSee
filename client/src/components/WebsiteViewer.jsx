import React, { useState, useRef, useEffect } from 'react';
import './WebsiteViewer.css';

function WebsiteViewer({ gazePosition, showLaser, onGazeData }) {
  const [url, setUrl] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [iframeError, setIframeError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [useProxyForThisQuery, setUseProxyForThisQuery] = useState(true);
  const [proxyError, setProxyError] = useState(null);
  const [currentProxyIndex, setCurrentProxyIndex] = useState(0);
  const iframeRef = useRef(null);
  const gazeDataRef = useRef([]);

  // Public CORS proxy services (no server setup required!)
  // These proxies fetch and return the HTML content
  const CORS_PROXY_SERVICES = [
    {
      name: 'AllOrigins',
      url: (targetUrl) => `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
    },
    {
      name: 'CORS Proxy',
      url: (targetUrl) => `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
    },
    {
      name: 'Proxy CORS',
      url: (targetUrl) => `https://proxy.cors.sh/${encodeURIComponent(targetUrl)}`,
    },
    {
      name: 'CORS Anywhere',
      url: (targetUrl) => `https://cors-anywhere.herokuapp.com/${encodeURIComponent(targetUrl)}`,
    },
  ];
  
  // Alternative: Use a service that embeds pages (better for iframes)
  const EMBED_PROXY_SERVICES = [
    {
      name: 'Embedly',
      url: (targetUrl) => `https://embed.ly/1/display/resize?url=${encodeURIComponent(targetUrl)}&key=internal`,
    },
  ];

  // Track gaze data continuously for heatmap
  useEffect(() => {
    if (!gazePosition || !currentUrl) return;

    // Get iframe position and dimensions
    const iframe = iframeRef.current;
    if (!iframe) return;

    const iframeRect = iframe.getBoundingClientRect();
    
    // Check if gaze is within iframe bounds
    const isInsideIframe = 
      gazePosition.x >= iframeRect.left &&
      gazePosition.x <= iframeRect.right &&
      gazePosition.y >= iframeRect.top &&
      gazePosition.y <= iframeRect.bottom;

    if (isInsideIframe) {
      // Calculate relative position within iframe
      const relativeX = gazePosition.x - iframeRect.left;
      const relativeY = gazePosition.y - iframeRect.top;
      
      // Store gaze data point for heatmap
      const gazeDataPoint = {
        x: relativeX,
        y: relativeY,
        timestamp: Date.now(),
        url: currentUrl,
        absoluteX: gazePosition.x,
        absoluteY: gazePosition.y,
      };

      gazeDataRef.current.push(gazeDataPoint);
      
      // Notify parent component of new gaze data (for heatmap)
      if (onGazeData) {
        onGazeData(gazeDataPoint);
      }

      // Limit stored data to prevent memory issues (keep last 10000 points)
      if (gazeDataRef.current.length > 10000) {
        gazeDataRef.current = gazeDataRef.current.slice(-10000);
      }
    }
  }, [gazePosition, currentUrl, onGazeData]);

  const handleUrlSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    setIsLoading(true);
    setIframeError(false);
    setProxyError(null);
    
    // Determine final URL based on proxy settings
    let finalUrl = formattedUrl;
    
    if (useProxyForThisQuery) {
      // Use public CORS proxy (no server setup required)
      // Reset proxy index when loading a new URL
      setCurrentProxyIndex(0);
      // Use the first proxy service (will fallback if it fails)
      finalUrl = CORS_PROXY_SERVICES[0].url(formattedUrl);
    } else {
      // Reset proxy index when not using proxy
      setCurrentProxyIndex(0);
    }
    
    setCurrentUrl(finalUrl);
    
    // Clear previous gaze data when loading new URL
    gazeDataRef.current = [];
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
    setIframeError(false);
  };

  const handleIframeError = () => {
    // If using proxy and we haven't tried all proxies yet, try the next one
    if (useProxyForThisQuery && currentProxyIndex < CORS_PROXY_SERVICES.length - 1) {
      const nextIndex = currentProxyIndex + 1;
      setCurrentProxyIndex(nextIndex);
      
      // Get the original URL (remove current proxy)
      const originalUrl = url.trim();
      let formattedUrl = originalUrl;
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = 'https://' + formattedUrl;
      }
      
      // Try next proxy
      const nextProxyUrl = CORS_PROXY_SERVICES[nextIndex].url(formattedUrl);
      setCurrentUrl(nextProxyUrl);
      console.log(`Trying proxy ${nextIndex + 1}/${CORS_PROXY_SERVICES.length}: ${CORS_PROXY_SERVICES[nextIndex].name}`);
    } else {
      setIsLoading(false);
      setIframeError(true);
      if (useProxyForThisQuery) {
        setProxyError('All proxy services failed. The website may be blocking proxy access.');
      }
    }
  };

  // Detect iframe load errors (X-Frame-Options blocking)
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !currentUrl) return;

    const timeout = setTimeout(() => {
      // If iframe hasn't loaded after 5 seconds, it might be blocked
      try {
        // Try to access iframe content (will fail if blocked by CORS)
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) {
          setIframeError(true);
          setIsLoading(false);
        }
      } catch (e) {
        // CORS error - site is blocking iframe access
        // This is expected for many sites, but the iframe might still display
        // We'll check if the iframe actually loaded content
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [currentUrl]);

  return (
    <div className="website-viewer-container">
      <div className="website-viewer-header">
        <form onSubmit={handleUrlSubmit} className="url-form">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter website URL (e.g., google.com or https://example.com)"
            className="url-input"
          />
          <div className="proxy-checkbox-container">
            <label className="proxy-checkbox-label">
              <input
                type="checkbox"
                checked={useProxyForThisQuery}
                onChange={(e) => setUseProxyForThisQuery(e.target.checked)}
                className="proxy-checkbox"
              />
              <span>Use proxy for this query</span>
            </label>
          </div>
          <button type="submit" className="load-button" disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Load Website'}
          </button>
        </form>
        {proxyError && (
          <div className="error-message" style={{ backgroundColor: 'rgba(255, 68, 68, 0.2)', borderColor: 'rgba(255, 68, 68, 0.5)' }}>
            <p style={{ fontWeight: 'bold', color: '#ff6b6b' }}>
              ⚠️ {proxyError}
            </p>
            <p className="error-suggestion">
              The proxy service may be temporarily unavailable. Try again in a moment, or try a different website.
            </p>
          </div>
        )}
        {iframeError && !proxyError && (
          <div className="error-message">
            <p>
              ⚠️ This website cannot be embedded due to security restrictions (X-Frame-Options).
              Many websites block iframe embedding for security reasons.
            </p>
            <p className="error-suggestion">
              Try opening the site in a new tab, or use a different website that allows embedding.
            </p>
          </div>
        )}
      </div>

      <div className="iframe-wrapper">
        {currentUrl ? (
          <>
            {isLoading && (
              <div className="loading-overlay">
                <p>Loading website...</p>
              </div>
            )}
            <iframe
              ref={iframeRef}
              src={currentUrl}
              className="website-iframe"
              title="Website Viewer"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation allow-downloads allow-modals"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            />
          </>
        ) : (
          <div className="placeholder-message">
            <h2>Enter a URL to view a website</h2>
            <p>Eye tracking is active and will record gaze data for heatmap generation.</p>
          </div>
        )}

        {/* Laser pointer overlay - positioned absolutely over iframe */}
        {showLaser && gazePosition && (
          <div
            className="laser-pointer-overlay"
            style={{
              left: `${gazePosition.x}px`,
              top: `${gazePosition.y}px`,
            }}
          />
        )}
      </div>
    </div>
  );
}

export default WebsiteViewer;

