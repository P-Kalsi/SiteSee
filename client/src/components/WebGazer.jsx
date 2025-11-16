// components/WebGazer.jsx

import React, { useEffect, useRef } from 'react'; // <-- Import useRef!

function WebGazer({ onGazeUpdate, isTracking = true }) {
  // Use a ref to track if WebGazer has been initialized
  const initializedRef = useRef(false); 
  // Use a ref to always have the latest isTracking value in the callback
  const isTrackingRef = useRef(isTracking);

  // Update the ref whenever isTracking changes
  useEffect(() => {
    isTrackingRef.current = isTracking;
  }, [isTracking]);

  useEffect(() => {
    if (window.webgazer && !initializedRef.current) { // <-- Check the ref
      
      const webgazer = window.webgazer;
      
      // ... (Rest of the setup code) ...
      
      webgazer.setGazeListener((data, elapsedTime) => {
        // Use ref to get the latest isTracking value
        if (data && onGazeUpdate && isTrackingRef.current) { 
          onGazeUpdate(data.x, data.y); 
        }
      }).begin();

      // Mark as initialized
      initializedRef.current = true; // <-- Set the ref to true after initialization

      // ... (Cleanup function remains the same) ...
    }
  }, [onGazeUpdate]);
  
  return null; 
}

export default WebGazer;