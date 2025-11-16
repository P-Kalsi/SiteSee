import React, { useEffect, useRef, useState } from "react";

function WebGazerHeatmap() {
  const heatmapInstanceRef = useRef(null);
  const heatmapDataRef = useRef(new Map()); // Store points with accumulation
  const renderIntervalRef = useRef(null);
  const decayIntervalRef = useRef(null);
  const maxValueRef = useRef(1);
  const currentActiveKeyRef = useRef(null);
  const lastGazeTimeRef = useRef(0);
  const [started, setStarted] = useState(false);   // whether tracking started
  const [snapshotURL, setSnapshotURL] = useState(null); // saved PNG

  // Configuration
  const ACCUMULATION_RATE = 0.3; // How much value to add per gaze detection
  const PROXIMITY_THRESHOLD = 40; // Pixels - how close to consider same spot
  const RENDER_INTERVAL_MS = 50; // How often to update display
  const DECAY_INTERVAL_MS = 10000; // How often to apply decay (3x slower - every 10000ms)
  const DECAY_RATE = 0.9; // How much to reduce value each decay cycle (0.3% decay - very slow)
  const MIN_VALUE = 0.1; // Minimum value before removing point
  const GAZE_TIMEOUT_MS = 200; // If no gaze for this long, clear active spot

  // Get key for a point (rounded for proximity matching)
  const getKey = (x, y) => {
    const roundedX = Math.round(x / PROXIMITY_THRESHOLD) * PROXIMITY_THRESHOLD;
    const roundedY = Math.round(y / PROXIMITY_THRESHOLD) * PROXIMITY_THRESHOLD;
    return `${roundedX},${roundedY}`;
  };

  // Update heatmap display
  const updateHeatmapDisplay = () => {
    if (!heatmapInstanceRef.current || heatmapDataRef.current.size === 0) {
      return;
    }

    // Find current max
    let currentMax = 0;
    for (let point of heatmapDataRef.current.values()) {
      if (point.value > currentMax) {
        currentMax = point.value;
      }
    }

    if (currentMax > maxValueRef.current) {
      maxValueRef.current = currentMax;
    }

    // Convert to array and update
    const dataArray = Array.from(heatmapDataRef.current.values());
    heatmapInstanceRef.current.setData({
      max: Math.max(maxValueRef.current, 1),
      data: dataArray
    });
  };

  // Decay function - reduces intensity of inactive points
  const applyDecay = () => {
    if (!heatmapInstanceRef.current || !started || heatmapDataRef.current.size === 0) {
      return;
    }
    
    // Check if current active spot is still active
    const timeSinceLastGaze = Date.now() - lastGazeTimeRef.current;
    if (timeSinceLastGaze > GAZE_TIMEOUT_MS) {
      currentActiveKeyRef.current = null; // Clear active spot if no recent gaze
    }
    
    // Apply decay to all inactive points
    const keysToDelete = [];
    for (let [key, point] of heatmapDataRef.current.entries()) {
      // Skip decay for the currently active spot
      if (key === currentActiveKeyRef.current) {
        continue;
      }
      
      // Decay inactive points
      point.value *= DECAY_RATE;
      
      // Remove points that are too faint
      if (point.value < MIN_VALUE) {
        keysToDelete.push(key);
      }
    }
    
    // Remove faded points
    keysToDelete.forEach(key => heatmapDataRef.current.delete(key));
  };

  // Render loop
  const renderLoop = () => {
    if (started) {
      updateHeatmapDisplay();
    }
  };

  const startTracking = () => {
    const webgazer = window.webgazer;
    const h337 = window.h337;

    const container = document.getElementById("heatmapContainer");

    // Create heatmap
    heatmapInstanceRef.current = h337.create({
      container,
      radius: 40,
      maxOpacity: 0.6,
      minOpacity: 0,
      blur: 0.85,
      backgroundColor: "rgba(0,0,0,0.05)"
    });

    // Start listening to gaze data with accumulation
    webgazer.setGazeListener((data) => {
      if (!data) return;

      const x = Math.round(data.x);
      const y = Math.round(data.y);
      const key = getKey(x, y);
      const existing = heatmapDataRef.current.get(key);

      // Mark this as the currently active spot
      currentActiveKeyRef.current = key;
      lastGazeTimeRef.current = Date.now();

      if (existing) {
        // Accumulate value when staring at same spot
        existing.value += ACCUMULATION_RATE;
        existing.x = x;
        existing.y = y;
        
        if (existing.value > maxValueRef.current) {
          maxValueRef.current = existing.value;
        }
      } else {
        // Create new point
        heatmapDataRef.current.set(key, {
          x: x,
          y: y,
          value: 1
        });
      }
    });

    webgazer.begin();
    setStarted(true);

    // Start render loop
    renderIntervalRef.current = setInterval(renderLoop, RENDER_INTERVAL_MS);
    
    // Start decay loop
    decayIntervalRef.current = setInterval(applyDecay, DECAY_INTERVAL_MS);
  };

  const finishAndSave = () => {
    const webgazer = window.webgazer;
    webgazer.end();

    // Stop render and decay loops
    if (renderIntervalRef.current) {
      clearInterval(renderIntervalRef.current);
      renderIntervalRef.current = null;
    }
    if (decayIntervalRef.current) {
      clearInterval(decayIntervalRef.current);
      decayIntervalRef.current = null;
    }

    // Final update before saving
    updateHeatmapDisplay();

    const dataURL = heatmapInstanceRef.current.getDataURL();
    setSnapshotURL(dataURL);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (renderIntervalRef.current) {
        clearInterval(renderIntervalRef.current);
      }
      if (decayIntervalRef.current) {
        clearInterval(decayIntervalRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* HEATMAP CONTAINER */}
      <div
        id="heatmapContainer"
        style={{
          width: "100vw",
          height: "100vh",
          position: "fixed",
          top: 0,
          left: 0,
          pointerEvents: "none",
          zIndex: 9998
        }}
      ></div>

      {/* START BUTTON */}
      {!started && !snapshotURL && (
        <button
          onClick={startTracking}
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            padding: "14px 24px",
            fontSize: "18px",
            zIndex: 9999
          }}
        >
          Start Tracking
        </button>
      )}

      {/* DONE BUTTON */}
      {started && !snapshotURL && (
        <button
          onClick={finishAndSave}
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            padding: "14px 24px",
            fontSize: "18px",
            zIndex: 9999
          }}
        >
          DONE
        </button>
      )}

      {/* SHOW PNG AFTER DONE */}
      {snapshotURL && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            height: "100vh",
            width: "100vw",
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10000
          }}
        >
          <div style={{ textAlign: "center" }}>
            <h2 style={{ color: "white" }}>Your Heatmap</h2>
            <img
              src={snapshotURL}
              alt="Heatmap Snapshot"
              style={{
                border: "4px solid white",
                maxWidth: "90vw",
                maxHeight: "90vh"
              }}
            />
            <br />
            <a
              href={snapshotURL}
              download="heatmap.png"
              style={{
                display: "inline-block",
                marginTop: "15px",
                padding: "8px 16px",
                background: "white"
              }}
            >
              ⬇ Download PNG
            </a>
          </div>
        </div>
      )}
    </>
  );
}

export default WebGazerHeatmap;