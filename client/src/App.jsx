import { useCallback, useState, useEffect } from 'react'
import WebGazer from './components/WebGazer'
import GazeHeatmap from './components/GazeHeatmap'
import WebsiteUI from './components/WebsiteUI' 

function App() {

  // State for the Heatmap visualization (raw coordinates)
  const[gazeCoords,setGazeCoords] = useState([])
  // State to control tracking
  const [isTracking, setIsTracking] = useState(true)
  // State to control heatmap visibility
  const [isHeatmapVisible, setIsHeatmapVisible] = useState(false)
  // Snapshot of gaze data when tracking stops
  const [heatmapSnapshot, setHeatmapSnapshot] = useState([])
  // State for website URL
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [currentUrl, setCurrentUrl] = useState('')
  const [iframeError, setIframeError] = useState(false)
  const [useProxy, setUseProxy] = useState(false)
  
  const handleGazeUpdate = useCallback((gazeX,gazeY) => { 
    // Only update if tracking is active
    if (isTracking) {
      setGazeCoords(prevHistory => [ 
        ...prevHistory, 
        { 
          x: gazeX,
          y: gazeY,
          value: 1
        }
      ]);
    }
  }, [isTracking]);

  useEffect(() => {
    // Logging logic for debugging
    if (gazeCoords.length === 1 || gazeCoords.length % 100 === 0) {
        console.groupCollapsed(`Gaze Coords Array: Total Points ${gazeCoords.length}`);
        console.table(gazeCoords.slice(-10));
        console.log("Full Array:", gazeCoords);
        console.groupEnd();
    }
  }, [gazeCoords]);

  // Handle showing heatmap and stopping tracking
  const handleShowHeatmap = () => {
    // Stop tracking
    setIsTracking(false)
    // Take a snapshot of current gaze data
    setHeatmapSnapshot([...gazeCoords])
    // Show the heatmap
    setIsHeatmapVisible(true)
  }

  // Handle toggling heatmap visibility
  const handleToggleHeatmap = () => {
    setIsHeatmapVisible(prev => !prev)
  }

  // Handle resetting and starting tracking again
  const handleReset = () => {
    setIsTracking(true)
    setGazeCoords([])
    setHeatmapSnapshot([])
    setIsHeatmapVisible(false)
  }

  // Handle loading a website URL
  const handleLoadWebsite = () => {
    if (websiteUrl.trim()) {
      // Add https:// if no protocol is specified
      let url = websiteUrl.trim()
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url
      }
      
      // Use proxy if enabled
      let finalUrl = url
      if (useProxy) {
        // Use a CORS proxy service that supports iframe embedding
        finalUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
      }
      
      setCurrentUrl(finalUrl)
      setIframeError(false) // Reset error state
      // Reset tracking when loading new website
      setIsTracking(true)
      setGazeCoords([])
      setHeatmapSnapshot([])
      setIsHeatmapVisible(false)
    }
  }

  // Handle opening website in new window
  const handleOpenInNewWindow = () => {
    if (websiteUrl.trim()) {
      let url = websiteUrl.trim()
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url
      }
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  // Detect iframe loading errors
  useEffect(() => {
    if (!currentUrl) return

    const iframe = document.querySelector('iframe[title="Website to track"]')
    if (!iframe) return

    const checkIframeError = () => {
      try {
        // Try to access iframe content - will throw if blocked
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
        if (!iframeDoc) {
          // If we can't access the document, it might be blocked
          setTimeout(() => {
            try {
              const test = iframe.contentWindow?.location
              if (!test) {
                setIframeError(true)
              }
            } catch (e) {
              setIframeError(true)
            }
          }, 2000)
        }
      } catch (e) {
        // Cross-origin error means iframe loaded but we can't access it (this is normal)
        // Only set error if we can't even detect the iframe window
        setTimeout(() => {
          try {
            const test = iframe.contentWindow
            if (!test) {
              setIframeError(true)
            }
          } catch (err) {
            // This is expected for cross-origin iframes, don't set error
          }
        }, 2000)
      }
    }

    const timeout = setTimeout(checkIframeError, 3000)
    return () => clearTimeout(timeout)
  }, [currentUrl])

  // Note: Many websites block iframe embedding via X-Frame-Options
  // This is a browser security feature and cannot be bypassed
  // Users should try localhost or websites that allow embedding
  
  return (
    <div>
      {/* Website URL Input - always visible at top */}
      <div style={{
        position: 'fixed',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1002,
        backgroundColor: 'white',
        padding: '16px 24px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        minWidth: '500px'
      }}>
        <input
          type="text"
          placeholder="Enter website URL (e.g., google.com or https://example.com)"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleLoadWebsite()}
          style={{
            flex: 1,
            padding: '10px 16px',
            border: '2px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none'
          }}
        />
        <button
          onClick={handleLoadWebsite}
          style={{
            padding: '10px 24px',
            backgroundColor: '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            whiteSpace: 'nowrap'
          }}
        >
          Load Website
        </button>
        <button
          onClick={handleOpenInNewWindow}
          disabled={!websiteUrl.trim()}
          style={{
            padding: '10px 16px',
            backgroundColor: websiteUrl.trim() ? '#10b981' : '#9ca3af',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: websiteUrl.trim() ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: '600',
            whiteSpace: 'nowrap'
          }}
          title="Open in new window (gaze tracking won't work across windows)"
        >
          Open New Window
        </button>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          color: '#64748b',
          cursor: 'pointer',
          whiteSpace: 'nowrap'
        }}>
          <input
            type="checkbox"
            checked={useProxy}
            onChange={(e) => setUseProxy(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          Use Proxy
        </label>
      </div>

      {/* Website iframe - only show when heatmap is not visible and URL is set */}
      {!isHeatmapVisible && currentUrl && (
        <>
          <iframe
            src={currentUrl}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              border: 'none',
              zIndex: 1
            }}
            title="Website to track"
            allow="camera; microphone"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
            onLoad={() => {
              setIframeError(false)
            }}
            onError={() => {
              setIframeError(true)
            }}
          />
          {iframeError && (
            <div style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 1003,
              backgroundColor: 'white',
              padding: '40px',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              maxWidth: '600px',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#dc2626', fontSize: '24px' }}>
                ⚠️ Cannot Load Website
              </h3>
              <p style={{ margin: '0 0 20px 0', color: '#475569', fontSize: '16px', lineHeight: '1.6' }}>
                This website cannot be displayed in an iframe because it has security restrictions (X-Frame-Options or Content-Security-Policy) that prevent embedding.
              </p>
              <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '14px' }}>
                Many popular websites (Google, Facebook, Twitter, GitHub, etc.) block iframe embedding for security reasons. This is a browser security feature that cannot be bypassed.
              </p>
              <div style={{ marginBottom: '20px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 12px 0', color: '#1e293b', fontWeight: '600' }}>
                  ✅ Try These Solutions:
                </p>
                <ul style={{ textAlign: 'left', color: '#475569', fontSize: '14px', lineHeight: '1.8', margin: 0, paddingLeft: '20px' }}>
                  <li><strong>Enable Proxy</strong> - Check the "Use Proxy" checkbox and try loading again</li>
                  <li><strong>Open in New Window</strong> - Use the "Open New Window" button (note: gaze tracking won't work)</li>
                  <li><strong>localhost</strong> - Use your own local development server</li>
                  <li><strong>Your own websites</strong> - Sites you control can allow iframe embedding</li>
                  <li><strong>Demo UI</strong> - Use the default demo interface below for testing</li>
                </ul>
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  onClick={() => {
                    setUseProxy(true)
                    handleLoadWebsite()
                  }}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}
                >
                  Try with Proxy
                </button>
                <button
                  onClick={handleOpenInNewWindow}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#6366f1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}
                >
                  Open in New Window
                </button>
                <button
                  onClick={() => {
                    setCurrentUrl('')
                    setWebsiteUrl('')
                    setIframeError(false)
                    setUseProxy(false)
                  }}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}
                >
                  Close & Use Demo UI
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Default UI if no URL is loaded - only show when heatmap is not visible */}
      {!isHeatmapVisible && !currentUrl && <WebsiteUI />}
      
      {/* WebGazer Component */}
      <WebGazer onGazeUpdate={handleGazeUpdate} isTracking={isTracking}/>

      {/* Heatmap Overlay - full screen when visible */}
      <GazeHeatmap data={heatmapSnapshot} isVisible={isHeatmapVisible} /> 
      

      <div 
        style={{ 
          position: 'fixed', 
          top: 10, 
          right: 10, 
          zIndex: 1001, 
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        {isTracking ? (
          <button
            onClick={handleShowHeatmap}
            style={{
              padding: '12px 24px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              transition: 'background-color 0.3s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
          >
            Show Heatmap & Stop Tracking
          </button>
        ) : (
          <>
            <button
              onClick={handleToggleHeatmap}
              style={{
                padding: '12px 24px',
                backgroundColor: isHeatmapVisible ? '#2196F3' : '#757575',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                transition: 'background-color 0.3s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = isHeatmapVisible ? '#1976D2' : '#616161'}
              onMouseOut={(e) => e.target.style.backgroundColor = isHeatmapVisible ? '#2196F3' : '#757575'}
            >
              {isHeatmapVisible ? 'Hide Heatmap' : 'Show Heatmap'}
            </button>
            <button
              onClick={handleReset}
              style={{
                padding: '12px 24px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                transition: 'background-color 0.3s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#da190b'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#f44336'}
            >
              Reset & Start Tracking
            </button>
          </>
        )}
      </div>
  
    </div>
  )
}

export default App