// GazeHeatmap.jsx (Revised)

import React, { useEffect, useRef, useState } from 'react';

const GazeHeatmap = ({ data, isVisible = false }) => {
  const heatmapContainerRef = useRef(null);
  // State to hold the heatmap instance once it's created
  const [heatmapInstance, setHeatmapInstance] = useState(null); 

  // Effect 1: Load the library and initialize the instance
  useEffect(() => {
    let timeoutId = null;
    let checkInterval = null;
    
    // Wait for the CDN script to load and use window.h337
    const initHeatmap = () => {
      if (window.h337 && heatmapContainerRef.current) {
        const instance = window.h337.create({
          container: heatmapContainerRef.current,
          radius: 25, 
          maxOpacity: .7, 
          minOpacity: 0.1,
        });
        // Store the instance in state
        setHeatmapInstance(instance);
        return true; // Successfully initialized
      }
      return false; // Not ready yet
    };

    // Try to initialize immediately
    if (!initHeatmap()) {
      // If not ready, poll until it's available
      checkInterval = setInterval(() => {
        if (initHeatmap()) {
          clearInterval(checkInterval);
          if (timeoutId) clearTimeout(timeoutId);
        }
      }, 50);
      
      // Also set a timeout to stop trying after 5 seconds
      timeoutId = setTimeout(() => {
        if (checkInterval) clearInterval(checkInterval);
        console.warn('heatmap.js failed to load after 5 seconds');
      }, 5000);
    }

    // Cleanup
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (checkInterval) clearInterval(checkInterval);
    };
  }, []); // Run only on mount

  // Effect 2: Update the heatmap when new data arrives
  useEffect(() => {
    // Only proceed if the instance has been successfully loaded
    if (heatmapInstance) {
      if (data && data.length > 0) {
        const heatmapData = {
          max: 10,
          data: data.map(point => ({
            x: Math.round(point.x),
            y: Math.round(point.y),
            value: point.value || 1
          }))
        };
        // Update the heatmap with new data
        heatmapInstance.setData(heatmapData);
        // Repaint to ensure it's visible
        heatmapInstance.repaint();
        console.log('Heatmap updated with', data.length, 'points');
      }
    }
  }, [heatmapInstance, data]); // Depends on the instance being ready and data changing

  // Effect 3: Repaint when visibility changes
  useEffect(() => {
    if (heatmapInstance && isVisible && data && data.length > 0) {
      // Small delay to ensure DOM has updated
      setTimeout(() => {
        if (heatmapInstance) {
          heatmapInstance.repaint();
          console.log('Heatmap repainted - visible:', isVisible);
        }
      }, 100);
    }
  }, [heatmapInstance, isVisible, data]);

  return (
    <div 
      ref={heatmapContainerRef} 
      style={{
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 1000,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
        backgroundColor: isVisible ? '#1a1a1a' : 'transparent'
      }} 
    />
  );
};

export default GazeHeatmap;