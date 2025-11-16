// components/WebGazer.jsx

import React, { useEffect, useRef, useState } from 'react';

function WebGazer({ onGazeUpdate, isTracking = true, onCalibrationComplete, recalibrate }) {
  // Debug: Log component mount
  useEffect(() => {
    console.log('WebGazer component mounted');
  }, []);

  // Use a ref to track if WebGazer has been initialized
  const initializedRef = useRef(false); 
  // Use a ref to always have the latest isTracking value in the callback
  const isTrackingRef = useRef(isTracking);
  const webgazerRef = useRef(null);
  const calibrationClickHandlerRef = useRef(null);
  const trackingStartedRef = useRef(false);
  const lastRecalibrateRef = useRef(0);

  // Calibration state - start with false so popup shows
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationStep, setCalibrationStep] = useState(0);
  const [isCalibrationComplete, setIsCalibrationComplete] = useState(false);
  const [clicksRemaining, setClicksRemaining] = useState(5);
  const [gazePosition, setGazePosition] = useState(null);
  const [calibrationPoints, setCalibrationPoints] = useState([]);
  
  // Use refs to track current values for click handler
  const currentIndexRef = useRef(0);
  const clicksRemainingRef = useRef(5);
  
  // Force show popup on mount
  useEffect(() => {
    console.log('WebGazer state:', { isCalibrationComplete, isCalibrating });
  }, [isCalibrationComplete, isCalibrating]);

  // Generate 16 calibration points in a 4x4 grid, evenly spread across the screen
  useEffect(() => {
    if (!isCalibrating) return;

    const points = [];
    const rows = 4; // 4 rows
    const cols = 4; // 4 columns = 16 points total
    const padding = 100; // padding from edges in pixels

    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Calculate even spacing: divide available space by (cols-1) and (rows-1)
    const cellWidth = (width - padding * 2) / (cols - 1);
    const cellHeight = (height - padding * 2) / (rows - 1);

    // Generate 16 points in a 4x4 grid
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        points.push({
          x: padding + col * cellWidth,
          y: padding + row * cellHeight,
          id: row * cols + col,
        });
      }
    }

    setCalibrationPoints(points);
    setCalibrationStep(0);
    setClicksRemaining(5);
    // Update refs to match state
    currentIndexRef.current = 0;
    clicksRemainingRef.current = 5;
  }, [isCalibrating]);

  // Update the ref whenever isTracking changes
  useEffect(() => {
    isTrackingRef.current = isTracking;
  }, [isTracking]);

  // Initialize WebGazer configuration
  useEffect(() => {
    if (window.webgazer && !initializedRef.current) {
      const webgazer = window.webgazer;
      webgazerRef.current = webgazer;

      // Configure WebGazer - don't set tracker explicitly, let it use default
      try {
        webgazer
          .setRegression('ridge')
          .showPredictionPoints(false) // Hide prediction points to avoid extra red dots
          .showVideo(false)
          .showFaceOverlay(false)
          .showFaceFeedbackBox(false);
      } catch (error) {
        console.warn('WebGazer configuration error:', error);
        // Continue anyway - WebGazer might still work
      }

      initializedRef.current = true;
    }

    return () => {
      // Cleanup: safely remove event listeners and stop WebGazer
      try {
        if (calibrationClickHandlerRef.current) {
          document.removeEventListener('click', calibrationClickHandlerRef.current);
          calibrationClickHandlerRef.current = null;
        }
      } catch (e) {
        console.warn('Error removing click listener:', e);
      }
      
      try {
        if (webgazerRef.current) {
          webgazerRef.current.end();
        }
      } catch (e) {
        console.warn('Error ending WebGazer:', e);
      }
    };
  }, []);

  // Start calibration
  const startCalibration = async () => {
    // Ensure WebGazer is initialized first
    if (!initializedRef.current && window.webgazer) {
      const webgazer = window.webgazer;
      webgazerRef.current = webgazer;

      // Configure WebGazer - don't set tracker, use default
      try {
        webgazer
          .setRegression('ridge')
          .showPredictionPoints(false) // Hide prediction points during calibration
          .showVideo(false)
          .showFaceOverlay(false)
          .showFaceFeedbackBox(false);
      } catch (error) {
        console.warn('WebGazer configuration error in startCalibration:', error);
      }

      initializedRef.current = true;
    }

    const webgazer = webgazerRef.current || window.webgazer;
    if (!webgazer) {
      alert("WebGazer is not loaded. Please check that the script is included in your HTML.");
      return;
    }

    try {
      await webgazer.begin();
      // Hide prediction points during calibration to avoid showing extra red dots
      try {
        webgazer.showPredictionPoints(false);
      } catch (e) {
        console.warn('Error hiding prediction points:', e);
      }
      setIsCalibrating(true);
      setCalibrationStep(0);
      setClicksRemaining(5);
      currentIndexRef.current = 0;
      clicksRemainingRef.current = 5;
      
      // Clear any previous calibration data
      try {
        if (webgazer.clearData) {
          webgazer.clearData();
        }
      } catch (e) {
        console.warn('Error clearing data:', e);
      }
    } catch (error) {
      console.error("Error starting WebGazer:", error);
      alert("Failed to start WebGazer. Please allow camera access.");
    }
  };

  // Set up gaze tracking during calibration
  useEffect(() => {
    if (!isCalibrating || !initializedRef.current || !window.webgazer) return;

    const webgazer = webgazerRef.current || window.webgazer;
    
    // Set gaze listener to show laser pointer during calibration
    webgazer.setGazeListener((data, time) => {
      if (data && data.x !== null && data.y !== null) {
        setGazePosition({ x: data.x, y: data.y });
      }
    });

    return () => {
      try {
        if (webgazer && webgazer.clearGazeListener) {
          webgazer.clearGazeListener();
        }
      } catch (e) {
        console.warn('Error clearing gaze listener:', e);
      }
    };
  }, [isCalibrating]);

  // Handle calibration clicks - 5 clicks per dot
  useEffect(() => {
    if (!isCalibrating || !initializedRef.current || calibrationPoints.length === 0) return;

    const handleCalibrationClick = (e) => {
      const webgazer = webgazerRef.current;
      if (!webgazer) return;

      // Get current values from refs (always up-to-date)
      const currentIndex = currentIndexRef.current;
      const currentClicks = clicksRemainingRef.current;

      // Guard: check if we're done with all points
      if (currentIndex >= calibrationPoints.length) {
        return;
      }

      const currentPoint = calibrationPoints[currentIndex];
      
      // Calculate distance from click to current point
      const clickX = e.clientX;
      const clickY = e.clientY;
      const distance = Math.sqrt(
        Math.pow(clickX - currentPoint.x, 2) + Math.pow(clickY - currentPoint.y, 2)
      );

      // Only process clicks within 100px of the current point
      if (distance > 100) {
        return;
      }

      // Guard: don't process if we've already completed this point
      if (currentClicks <= 0) {
        return;
      }

      // Record the click for calibration
      webgazer.recordScreenPosition(currentPoint.x, currentPoint.y, 'click');

      const newClicksRemaining = currentClicks - 1;
      
      // Update refs immediately
      clicksRemainingRef.current = newClicksRemaining;
      
      // Update state
      setClicksRemaining(newClicksRemaining);

      // If this was the last click for this point, move to next point
      if (newClicksRemaining === 0) {
        if (currentIndex < calibrationPoints.length - 1) {
          // Move to next point
          const nextIndex = currentIndex + 1;
          currentIndexRef.current = nextIndex;
          clicksRemainingRef.current = 5;
          setCalibrationStep(nextIndex);
          setClicksRemaining(5);
        } else {
          // This was the last point - calibration complete
          finishCalibration();
        }
      }
    };

    calibrationClickHandlerRef.current = handleCalibrationClick;
    document.addEventListener('click', handleCalibrationClick);

    return () => {
      try {
        if (calibrationClickHandlerRef.current) {
          document.removeEventListener('click', calibrationClickHandlerRef.current);
          calibrationClickHandlerRef.current = null;
        }
      } catch (e) {
        console.warn('Error cleaning up calibration click handler:', e);
      }
    };
  }, [isCalibrating, calibrationPoints, onCalibrationComplete]);

  const finishCalibration = () => {
    setIsCalibrating(false);
    const webgazer = webgazerRef.current || window.webgazer;
    if (webgazer) {
      // Ensure data is saved across sessions
      try {
        if (webgazer.saveDataAcrossSessions) {
          webgazer.saveDataAcrossSessions(true);
        }
      } catch (e) {
        console.warn('Error saving data:', e);
      }
    }
    setIsCalibrationComplete(true);
    if (onCalibrationComplete) {
      onCalibrationComplete();
    }
  };

  // Handle recalibration trigger
  useEffect(() => {
    // Only trigger if recalibrate value has changed and is greater than last handled value
    if (recalibrate && recalibrate > lastRecalibrateRef.current && isCalibrationComplete) {
      console.log('WebGazer: Recalibration triggered', recalibrate);
      lastRecalibrateRef.current = recalibrate; // Mark this value as handled
      
      // Stop current tracking and clear WebGazer state first
      const performRecalibration = async () => {
        try {
          const webgazer = webgazerRef.current || window.webgazer;
          if (webgazer) {
            try {
              // Clear any existing gaze listener
              webgazer.clearGazeListener();
            } catch (e) {
              console.warn('Error clearing gaze listener:', e);
            }
            try {
              // Pause WebGazer to stop tracking
              webgazer.pause();
            } catch (e) {
              console.warn('Error pausing WebGazer:', e);
            }
            try {
              // Hide prediction points to clear any visible dots
              webgazer.showPredictionPoints(false);
            } catch (e) {
              console.warn('Error hiding prediction points:', e);
            }
          }
        } catch (error) {
          console.error('Error during recalibration cleanup:', error);
        }
        
        // Reset all calibration state AFTER cleanup
        setIsCalibrationComplete(false);
        setIsCalibrating(false);
        setCalibrationStep(0);
        setClicksRemaining(5);
        setGazePosition(null);
        currentIndexRef.current = 0;
        clicksRemainingRef.current = 5;
        trackingStartedRef.current = false;
        
        // Wait a bit to ensure UI is cleared, then restart calibration
        setTimeout(async () => {
          try {
            const webgazer = webgazerRef.current || window.webgazer;
            if (webgazer) {
              // Keep prediction points hidden during calibration
              // They will be hidden again in startCalibration, but ensure they're off here
              try {
                webgazer.showPredictionPoints(false);
              } catch (e) {
                console.warn('Error hiding prediction points:', e);
              }
              // Restart calibration
              await startCalibration();
            }
          } catch (error) {
            console.error('Error during recalibration restart:', error);
            // Try to start calibration anyway
            try {
              await startCalibration();
            } catch (e) {
              console.error('Failed to restart calibration:', e);
            }
          }
        }, 300);
      };
      
      performRecalibration();
    }
  }, [recalibrate, isCalibrationComplete]);

  // Start tracking after calibration is complete
  useEffect(() => {
    if (window.webgazer && initializedRef.current && isCalibrationComplete && !isCalibrating && !trackingStartedRef.current) {
      const webgazer = webgazerRef.current || window.webgazer;
      
      console.log('WebGazer: Starting tracking after calibration');
      
      // Show prediction points so user can see the tracking red dot
      try {
        webgazer.showPredictionPoints(true);
      } catch (e) {
        console.warn('Error showing prediction points:', e);
      }
      
      webgazer.setGazeListener((data, elapsedTime) => {
        // Use ref to get the latest isTracking value
        if (data && onGazeUpdate && isTrackingRef.current) { 
          onGazeUpdate(data.x, data.y); 
        }
      });

      trackingStartedRef.current = true;
    }
  }, [isCalibrationComplete, isCalibrating, onGazeUpdate]);

  // Calibration UI
  if (isCalibrating && calibrationPoints.length > 0) {
    const currentPoint = calibrationPoints[calibrationStep];

    return (
      <div style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <div style={{ textAlign: "center", padding: "20px", marginBottom: "40px" }}>
          <h2 style={{ marginBottom: "20px", fontSize: "28px" }}>Calibration in Progress</h2>
          <p style={{ fontSize: "18px", marginBottom: "10px" }}>
            Point {calibrationStep + 1} of {calibrationPoints.length}
          </p>
          <p style={{ fontSize: "16px", marginBottom: "10px", fontWeight: "bold", color: "#4CAF50" }}>
            Clicks remaining: {clicksRemaining} / 5
          </p>
          <p style={{ fontSize: "14px", marginBottom: "20px", color: "#ccc" }}>
            Look at the red dot and click it {clicksRemaining} more time{clicksRemaining !== 1 ? 's' : ''}
          </p>
        </div>

        {currentPoint && (
          <div
            style={{
              position: "fixed",
              left: `${currentPoint.x}px`,
              top: `${currentPoint.y}px`,
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "radial-gradient(circle, #ff0000 0%, #cc0000 100%)",
              transform: "translate(-50%, -50%)",
              cursor: "pointer",
              zIndex: 10001,
              boxShadow: "0 0 20px rgba(255, 0, 0, 0.8)",
              border: "3px solid white",
              transition: "all 0.2s ease"
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (calibrationClickHandlerRef.current) {
                calibrationClickHandlerRef.current(e);
              }
            }}
          />
        )}

        {/* Laser pointer showing gaze position */}
        {gazePosition && (
          <div
            style={{
              position: "fixed",
              left: `${gazePosition.x}px`,
              top: `${gazePosition.y}px`,
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "rgba(255, 0, 0, 0.6)",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
              zIndex: 10002,
              boxShadow: "0 0 10px rgba(255, 0, 0, 0.8)",
            }}
          />
        )}

        <button
          onClick={finishCalibration}
          style={{
            marginTop: "40px",
            padding: "12px 24px",
            fontSize: "16px",
            backgroundColor: "#666",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600"
          }}
        >
          Skip Calibration
        </button>
      </div>
    );
  }

  // ALWAYS show popup first - don't check isCalibrationComplete initially
  // Only hide after calibration is actually done
  // Make sure we're not calibrating and calibration is complete before hiding
  if (isCalibrationComplete && !isCalibrating && trackingStartedRef.current) {
    // Tracking is active - return null (invisible component)
    console.log('WebGazer: Hiding popup, calibration complete');
    return null;
  }

  // Show calibration popup - this should always show initially
  const webgazerAvailable = typeof window !== 'undefined' && window.webgazer;
  console.log('WebGazer: Showing popup', { isCalibrationComplete, isCalibrating, webgazerAvailable });
  
  return (
    <div 
      id="webgazer-calibration-popup"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000000',
        zIndex: 2147483647,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: 0,
        padding: 0,
        pointerEvents: 'auto'
      }}
    >
      <div style={{ 
        textAlign: "center",
        backgroundColor: '#ffffff',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(255,255,255,0.3)',
        maxWidth: '500px',
        width: '90%',
        zIndex: 2147483647,
        color: '#000000',
        border: '2px solid #4CAF50',
        pointerEvents: 'auto'
      }}>
        <h2 style={{ marginBottom: "20px", fontSize: "28px", color: "#000000", fontWeight: "bold" }}>Eye Tracking Calibration</h2>
        <p style={{ marginBottom: "15px", fontSize: "16px", color: "#333333" }}>
          To ensure accurate eye tracking, we need to calibrate the system.
          You'll be asked to look at and click on 16 points on the screen,
          clicking each point 5 times.
        </p>
        <p style={{ marginBottom: "10px", fontSize: "14px", color: "#333333", fontWeight: "600" }}>Please make sure:</p>
        <ul style={{ textAlign: "left", marginBottom: "20px", paddingLeft: "20px", color: "#333333", fontSize: "14px", lineHeight: "1.8" }}>
          <li>You're in a well-lit room</li>
          <li>Your face is clearly visible to the camera</li>
          <li>You're sitting at a comfortable distance from the screen</li>
        </ul>
        <p style={{ fontSize: "14px", color: "#666666", marginBottom: "20px" }}>
          You'll need to allow camera access for eye tracking to work
        </p>
        {!webgazerAvailable && (
          <p style={{ fontSize: "14px", color: "#dc2626", marginBottom: "15px", fontWeight: "bold", padding: "10px", backgroundColor: "#fee" }}>
            ⚠️ WebGazer script not loaded. Please check your HTML.
          </p>
        )}
        <button
          onClick={startCalibration}
          disabled={!webgazerAvailable}
          style={{
            padding: "15px 30px",
            borderRadius: "8px",
            background: webgazerAvailable ? "#4CAF50" : "#ccc",
            color: "white",
            fontSize: "20px",
            border: "none",
            cursor: webgazerAvailable ? "pointer" : "not-allowed",
            fontWeight: "bold",
            minWidth: "250px",
            boxShadow: webgazerAvailable ? "0 4px 12px rgba(76, 175, 80, 0.4)" : "none"
          }}
        >
          {!webgazerAvailable ? "Loading WebGazer..." : "Start Calibration"}
        </button>
      </div>
    </div>
  ); 
}

export default WebGazer;