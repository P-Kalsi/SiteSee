import { useCallback, useState, useEffect } from 'react'
import WebGazer from './components/WebGazer'
import GazeHeatmap from './components/GazeHeatmap'
import WebsiteUI from './components/WebsiteUI'
import AIInsights from './components/AIInsights'
import FaceCam from './components/FaceCam' 

// Reliable proxy service for CORS bypass
// Note: Proxies may strip CSS/JS, so websites may appear unstyled
const getProxyUrl = (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`

function App() {
  // Debug: Log App mount
  useEffect(() => {
    console.log('App component mounted');
  }, []);

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
  const [isLoading, setIsLoading] = useState(false)
  const [loadTimeout, setLoadTimeout] = useState(null)
  const [isTimeoutError, setIsTimeoutError] = useState(false)
  // State to track if calibration is complete
  const [isCalibrationComplete, setIsCalibrationComplete] = useState(false)
  // State for draggable URL box position
  const [urlBoxPosition, setUrlBoxPosition] = useState({ x: 0, y: 20 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  // State for recalibration button position
  const [recalibrateButtonPosition, setRecalibrateButtonPosition] = useState({ x: 20, y: 100 })
  const [isDraggingRecalibrate, setIsDraggingRecalibrate] = useState(false)
  const [recalibrateDragOffset, setRecalibrateDragOffset] = useState({ x: 0, y: 0 })
  const [recalibrateTrigger, setRecalibrateTrigger] = useState(0)
  
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
    // Prevent multiple rapid clicks
    if (isLoading) {
      console.log('Already loading, ignoring click')
      return
    }

    if (websiteUrl.trim()) {
      setIsLoading(true)
      setIframeError(false) // Reset error state
      
      // Clear any existing timeout
      if (loadTimeout) {
        clearTimeout(loadTimeout)
        setLoadTimeout(null)
      }
      
      // Add https:// if no protocol is specified
      let url = websiteUrl.trim()
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url
      }
      
      // Use proxy if enabled
      let finalUrl = url
      if (useProxy) {
        try {
          finalUrl = getProxyUrl(url)
        } catch (e) {
          console.error('Proxy URL generation error:', e)
          finalUrl = url // Fallback to direct URL
        }
      }
      
      setCurrentUrl(finalUrl)
      // Reset tracking when loading new website
      setIsTracking(true)
      setGazeCoords([])
      setHeatmapSnapshot([])
      setIsHeatmapVisible(false)
      
      // Set a shorter timeout for faster feedback (15 seconds)
      setIsTimeoutError(false)
      const timeout = setTimeout(() => {
        console.log('Website load timeout after 15 seconds')
        setIsLoading(false)
        setIsTimeoutError(true)
        setIframeError(true)
        setLoadTimeout(null)
      }, 15000)
      setLoadTimeout(timeout)
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

    let errorDetected = false

    const checkIframeError = () => {
      // Check if iframe shows blocked/error content
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
        if (iframeDoc) {
          const bodyText = iframeDoc.body?.innerText?.toLowerCase() || ''
          const titleText = iframeDoc.title?.toLowerCase() || ''
          const headText = iframeDoc.head?.innerText?.toLowerCase() || ''
          const allText = bodyText + ' ' + titleText + ' ' + headText
          
          // Check for common error messages including server errors and timeouts
          if (allText.includes('500') || 
              allText.includes('internal server error') ||
              allText.includes('502') ||
              allText.includes('503') ||
              allText.includes('504') ||
              allText.includes('bad gateway') ||
              allText.includes('service unavailable') ||
              allText.includes('gateway timeout') ||
              allText.includes('timeout') ||
              allText.includes('request timeout') ||
              allText.includes('connection timeout') ||
              allText.includes('timed out') ||
              allText.includes('blocked') || 
              allText.includes('access denied') || 
              allText.includes('you are unable to access') ||
              (allText.includes('cors') && allText.includes('error')) ||
              allText.includes('nginx') && (allText.includes('error') || allText.includes('500'))) {
            if (!errorDetected) {
              errorDetected = true
              setIsLoading(false)
              setIframeError(true)
              if (loadTimeout) {
                clearTimeout(loadTimeout)
                setLoadTimeout(null)
              }
            }
          }
        }
      } catch (e) {
        // Cross-origin - can't access, which is normal for most sites
        // Don't treat this as an error
      }
    }

    // Check after iframe loads - faster checks for quicker error detection
    const timeout1 = setTimeout(checkIframeError, 1000)
    const timeout2 = setTimeout(checkIframeError, 2500)
    const timeout3 = setTimeout(checkIframeError, 4000)
    
    // Also listen for iframe load events
    const handleLoad = () => {
      setTimeout(checkIframeError, 500)
      setTimeout(checkIframeError, 2000) // Check again after load
    }
    
    const handleError = () => {
      if (!errorDetected) {
        errorDetected = true
        setIsLoading(false)
        setIframeError(true)
        if (loadTimeout) {
          clearTimeout(loadTimeout)
          setLoadTimeout(null)
        }
      }
    }

    iframe.addEventListener('load', handleLoad)
    iframe.addEventListener('error', handleError)

    return () => {
      clearTimeout(timeout1)
      clearTimeout(timeout2)
      clearTimeout(timeout3)
      iframe.removeEventListener('load', handleLoad)
      iframe.removeEventListener('error', handleError)
    }
  }, [currentUrl, useProxy, websiteUrl])

  // Handle calibration completion
  const handleCalibrationComplete = () => {
    console.log('App: Calibration complete callback received');
    setIsCalibrationComplete(true);
  };

  // Handle dragging for URL box
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) {
        setUrlBoxPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset])

  // Handle dragging for recalibrate button
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingRecalibrate) {
        setRecalibrateButtonPosition({
          x: e.clientX - recalibrateDragOffset.x,
          y: e.clientY - recalibrateDragOffset.y
        })
      }
    }

    const handleMouseUp = () => {
      setIsDraggingRecalibrate(false)
    }

    if (isDraggingRecalibrate) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDraggingRecalibrate, recalibrateDragOffset])

  // Handle recalibration
  const handleRecalibrate = () => {
    setIsCalibrationComplete(false)
    setRecalibrateTrigger(prev => prev + 1)
  }


  // Note: Many websites block iframe embedding via X-Frame-Options
  // This is a browser security feature and cannot be bypassed
  // Users should try localhost or websites that allow embedding

  return (
    <div style={{ margin: 0, padding: 0, width: '100vw', height: '100vh', position: 'relative' }}>
      {/* WebGazer Component - MUST be first so it's on top */}
      <WebGazer 
        onGazeUpdate={handleGazeUpdate} 
        isTracking={isTracking}
        onCalibrationComplete={handleCalibrationComplete}
        recalibrate={recalibrateTrigger}
      />
      
      {/* Only show other content after calibration is complete */}
      {isCalibrationComplete && (
        <>
      {/* Website URL Input - Draggable */}
      <div 
        style={{
          position: 'fixed',
          top: `${urlBoxPosition.y}px`,
          left: urlBoxPosition.x === 0 ? '50%' : `${urlBoxPosition.x}px`,
          transform: urlBoxPosition.x === 0 ? 'translateX(-50%)' : 'none',
          zIndex: 1002,
          backgroundColor: 'white',
          padding: '20px 28px',
          borderRadius: '16px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '14px',
          alignItems: 'center',
          minWidth: '520px',
          maxWidth: '90vw',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          border: '1px solid #e2e8f0',
          transition: 'box-shadow 0.2s ease'
        }}
        onMouseDown={(e) => {
          // Only start dragging if clicking on the header area or empty space
          if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'LABEL' && e.target.tagName !== 'INPUT') {
            setIsDragging(true)
            const rect = e.currentTarget.getBoundingClientRect()
            setDragOffset({
              x: e.clientX - rect.left,
              y: e.clientY - rect.top
            })
            e.preventDefault()
          }
        }}
      >
        {/* Drag handle indicator */}
        <div style={{
          position: 'absolute',
          top: '6px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '48px',
          height: '5px',
          backgroundColor: '#cbd5e1',
          borderRadius: '3px',
          cursor: 'grab',
          transition: 'background-color 0.2s ease'
        }} 
        onMouseEnter={(e) => e.target.style.backgroundColor = '#94a3b8'}
        onMouseLeave={(e) => e.target.style.backgroundColor = '#cbd5e1'}
        />
        <input
          type="text"
          placeholder="Enter website URL (e.g., google.com or https://example.com)"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleLoadWebsite()}
          style={{
            flex: 1,
            padding: '12px 18px',
            border: '2px solid #e2e8f0',
            borderRadius: '10px',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            minWidth: '200px'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#6366f1'
            e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e2e8f0'
            e.target.style.boxShadow = 'none'
          }}
        />
        <button
          onClick={handleLoadWebsite}
          disabled={isLoading || !websiteUrl.trim()}
          style={{
            padding: '12px 28px',
            backgroundColor: isLoading || !websiteUrl.trim() ? '#9ca3af' : '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: isLoading || !websiteUrl.trim() ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            whiteSpace: 'nowrap',
            boxShadow: isLoading || !websiteUrl.trim() ? 'none' : '0 2px 8px rgba(99, 102, 241, 0.3)',
            transition: 'all 0.2s ease',
            position: 'relative',
            opacity: isLoading ? 0.7 : 1
          }}
          onMouseOver={(e) => {
            if (!isLoading && websiteUrl.trim()) {
              e.target.style.backgroundColor = '#4f46e5'
              e.target.style.transform = 'translateY(-1px)'
              e.target.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.4)'
            }
          }}
          onMouseOut={(e) => {
            if (!isLoading && websiteUrl.trim()) {
              e.target.style.backgroundColor = '#6366f1'
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 2px 8px rgba(99, 102, 241, 0.3)'
            }
          }}
        >
          {isLoading ? (
            <>
              <span style={{ display: 'inline-block', marginRight: '8px' }}>⏳</span>
              Loading...
            </>
          ) : (
            'Load Website'
          )}
        </button>
        <button
          onClick={handleOpenInNewWindow}
          disabled={!websiteUrl.trim()}
          style={{
            padding: '12px 20px',
            backgroundColor: websiteUrl.trim() ? '#6366f1' : '#9ca3af',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: websiteUrl.trim() ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: '600',
            whiteSpace: 'nowrap',
            boxShadow: websiteUrl.trim() ? '0 2px 8px rgba(99, 102, 241, 0.3)' : 'none',
            transition: 'all 0.2s ease'
          }}
          title="Open in new window (gaze tracking won't work across windows)"
          onMouseOver={(e) => {
            if (websiteUrl.trim()) {
              e.target.style.backgroundColor = '#4f46e5'
              e.target.style.transform = 'translateY(-1px)'
              e.target.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.4)'
            }
          }}
          onMouseOut={(e) => {
            if (websiteUrl.trim()) {
              e.target.style.backgroundColor = '#6366f1'
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 2px 8px rgba(99, 102, 241, 0.3)'
            }
          }}
        >
          Open New Window
        </button>
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          color: '#475569',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          padding: '8px 12px',
          borderRadius: '8px',
          backgroundColor: useProxy ? '#eef2ff' : 'transparent',
          border: `2px solid ${useProxy ? '#6366f1' : '#e2e8f0'}`,
          transition: 'all 0.2s ease',
          fontWeight: useProxy ? '600' : '500'
        }}>
          <input
            type="checkbox"
            checked={useProxy}
            onChange={(e) => {
              setUseProxy(e.target.checked)
            }}
            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
          />
          <span>Use Proxy</span>
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
            allow="camera; microphone; fullscreen"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-top-navigation allow-downloads allow-presentation"
            referrerPolicy="no-referrer-when-downgrade"
            onLoad={() => {
              console.log('Iframe loaded successfully')
              setIsLoading(false)
              setIsTimeoutError(false)
              setIframeError(false)
              if (loadTimeout) {
                clearTimeout(loadTimeout)
                setLoadTimeout(null)
              }
            }}
            onError={() => {
              console.log('Iframe error event')
              setIsLoading(false)
              setIsTimeoutError(false)
              setIframeError(true)
              if (loadTimeout) {
                clearTimeout(loadTimeout)
                setLoadTimeout(null)
              }
            }}
          />
          {/* Note about proxy limitations */}
          {useProxy && (
            <div style={{
              position: 'fixed',
              bottom: 20,
              right: 20,
              zIndex: 1003,
              backgroundColor: 'rgba(255, 193, 7, 0.95)',
              padding: '12px 16px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              maxWidth: '300px',
              fontSize: '12px',
              color: '#000'
            }}>
              <strong>⚠️ Proxy Note:</strong>
              <p style={{ margin: '4px 0 0 0', lineHeight: '1.4' }}>
                Some websites may appear unstyled when using a proxy. This is normal - proxies strip CSS/JS for security.
              </p>
              <button
                onClick={() => {
                  const note = document.querySelector('[data-proxy-note]')
                  if (note) note.style.display = 'none'
                }}
                style={{
                  marginTop: '8px',
                  padding: '4px 8px',
                  fontSize: '10px',
                  background: '#000',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Dismiss
              </button>
            </div>
          )}
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
                {isTimeoutError ? (
                  <>
                    The website took too long to load (timeout after 15 seconds). This could be due to:
                    <ul style={{ textAlign: 'left', marginTop: '12px', paddingLeft: '20px', lineHeight: '1.8' }}>
                      <li>Slow proxy server response</li>
                      <li>Network connectivity issues</li>
                      <li>Website server being down or slow</li>
                    </ul>
                    <p style={{ marginTop: '12px', fontSize: '14px', color: '#64748b' }}>
                      Try clicking "Load Website" again, or try without the proxy.
                    </p>
                  </>
                ) : (
                  <>
                    This website cannot be displayed in an iframe because it has security restrictions (X-Frame-Options or Content-Security-Policy) that prevent embedding.
                  </>
                )}
              </p>
              {!isTimeoutError && (
                <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '14px' }}>
                  Many popular websites (Google, Facebook, Twitter, GitHub, etc.) block iframe embedding for security reasons. This is a browser security feature that cannot be bypassed.
                </p>
              )}
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
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
                {!useProxy && (
                  <button
                    onClick={() => {
                      setUseProxy(true)
                      handleLoadWebsite()
                    }}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#6366f1',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: '600',
                      boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = '#4f46e5'
                      e.target.style.transform = 'translateY(-1px)'
                      e.target.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.4)'
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = '#6366f1'
                      e.target.style.transform = 'translateY(0)'
                      e.target.style.boxShadow = '0 2px 8px rgba(99, 102, 241, 0.3)'
                    }}
                  >
                    Try with Proxy
                  </button>
                )}
                <button
                  onClick={handleOpenInNewWindow}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#6366f1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#4f46e5'
                    e.target.style.transform = 'translateY(-1px)'
                    e.target.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.4)'
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = '#6366f1'
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = '0 2px 8px rgba(99, 102, 241, 0.3)'
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
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    boxShadow: '0 2px 8px rgba(107, 114, 128, 0.3)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#4b5563'
                    e.target.style.transform = 'translateY(-1px)'
                    e.target.style.boxShadow = '0 4px 12px rgba(107, 114, 128, 0.4)'
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = '#6b7280'
                    e.target.style.transform = 'translateY(0)'
                    e.target.style.boxShadow = '0 2px 8px rgba(107, 114, 128, 0.3)'
                  }}
                >
                  Close & Use Demo UI
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Default UI if no URL is loaded - only show when heatmap is not visible and calibration complete */}
      {isCalibrationComplete && !isHeatmapVisible && !currentUrl && <WebsiteUI />}
        </>
      )}

      {/* Heatmap Overlay - full screen when visible */}
      <GazeHeatmap data={heatmapSnapshot} isVisible={isHeatmapVisible} />
      
      {/* AI Insights Panel */}
      <AIInsights heatmapData={heatmapSnapshot} isVisible={isHeatmapVisible} />
      
      {/* Face Cam - Toggleable and Draggable */}
      {isCalibrationComplete && <FaceCam />}
      
      {/* Recalibrate Button - Draggable - only show after calibration is complete */}
      {isCalibrationComplete && (
        <div
          style={{
            position: 'fixed',
            top: `${recalibrateButtonPosition.y}px`,
            left: `${recalibrateButtonPosition.x}px`,
            zIndex: 1001,
            cursor: isDraggingRecalibrate ? 'grabbing' : 'grab',
            userSelect: 'none'
          }}
          onMouseDown={(e) => {
            setIsDraggingRecalibrate(true)
            const rect = e.currentTarget.getBoundingClientRect()
            setRecalibrateDragOffset({
              x: e.clientX - rect.left,
              y: e.clientY - rect.top
            })
            e.preventDefault()
          }}
        >
          <button
            onClick={handleRecalibrate}
            style={{
              padding: '12px 24px',
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#7c3aed'
              e.target.style.transform = 'translateY(-1px)'
              e.target.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.4)'
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#8b5cf6'
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 2px 8px rgba(139, 92, 246, 0.3)'
            }}
          >
            <span>🔄</span>
            Recalibrate
          </button>
        </div>
      )}

      {/* Control buttons - only show after calibration is complete */}
      {isCalibrationComplete && (
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
              backgroundColor: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              boxShadow: '0 2px 4px rgba(99, 102, 241, 0.3)',
              transition: 'background-color 0.3s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#4f46e5'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#6366f1'}
          >
            Show Heatmap & Stop Tracking
          </button>
        ) : (
          <>
            <button
              onClick={handleToggleHeatmap}
              style={{
                padding: '12px 24px',
                backgroundColor: isHeatmapVisible ? '#6366f1' : '#8b5cf6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                boxShadow: '0 2px 4px rgba(99, 102, 241, 0.3)',
                transition: 'background-color 0.3s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = isHeatmapVisible ? '#4f46e5' : '#7c3aed'}
              onMouseOut={(e) => e.target.style.backgroundColor = isHeatmapVisible ? '#6366f1' : '#8b5cf6'}
            >
              {isHeatmapVisible ? 'Hide Heatmap' : 'Show Heatmap'}
            </button>
            <button
              onClick={handleReset}
              style={{
                padding: '12px 24px',
                backgroundColor: '#6366f1',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                boxShadow: '0 2px 4px rgba(99, 102, 241, 0.3)',
                transition: 'background-color 0.3s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#4f46e5'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#6366f1'}
            >
              Reset & Start Tracking
            </button>
          </>
        )}
      </div>
      )}

    </div>
  )
}

export default App