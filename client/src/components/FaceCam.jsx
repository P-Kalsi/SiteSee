import React, { useState, useEffect } from 'react';

const FaceCam = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Use WebGazer's built-in showVideo() method
  useEffect(() => {
    if (!window.webgazer) return;

    const webgazer = window.webgazer;

    if (isVisible) {
      // Show WebGazer's video with face overlay (green tracking dots)
      webgazer.showVideo(true);
      webgazer.showFaceOverlay(true); // Enable green face tracking overlays
      webgazer.showFaceFeedbackBox(true); // Show face detection feedback
      
      // Style and position the video container that WebGazer creates
      const styleVideo = () => {
        const videoContainer = document.querySelector('#webgazerVideoContainer');
        if (videoContainer) {
          videoContainer.style.position = 'fixed';
          videoContainer.style.left = `${position.x}px`;
          videoContainer.style.top = `${position.y}px`;
          videoContainer.style.zIndex = '1001';
          videoContainer.style.cursor = 'grab';
          videoContainer.style.borderRadius = '8px';
          videoContainer.style.overflow = 'hidden';
          videoContainer.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          videoContainer.style.border = '2px solid #6366f1';
          
          const video = videoContainer.querySelector('video');
          if (video) {
            video.style.width = '240px';
            video.style.height = '180px';
            video.style.objectFit = 'cover';
          }
        }
      };

      // Style immediately and keep updating
      styleVideo();
      const interval = setInterval(styleVideo, 100);

      return () => clearInterval(interval);
    } else {
      // Hide WebGazer's video and overlays
      webgazer.showVideo(false);
      webgazer.showFaceOverlay(false);
      webgazer.showFaceFeedbackBox(false);
    }
  }, [isVisible, position]);

  // Handle dragging the WebGazer video container
  useEffect(() => {
    if (!isVisible) return;

    const videoContainer = document.querySelector('#webgazerVideoContainer');
    if (!videoContainer) return;

    const handleMouseDown = (e) => {
      setIsDragging(true);
      const rect = videoContainer.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    };

    const handleMouseMove = (e) => {
      if (isDragging) {
        const newX = Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - 260));
        const newY = Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - 200));
        setPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    videoContainer.addEventListener('mousedown', handleMouseDown);
    videoContainer.style.cursor = isDragging ? 'grabbing' : 'grab';
    
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      videoContainer.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isVisible, isDragging, dragOffset]);

  return (
    <>
      {!isVisible ? (
        <button
          onClick={() => setIsVisible(true)}
          style={{
            position: 'fixed',
            top: 20,
            left: 20,
            zIndex: 1001,
            padding: '10px 16px',
            backgroundColor: '#6366f1',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '600',
            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>📹</span>
          Show Face Cam
        </button>
      ) : (
        <div
          style={{
            position: 'fixed',
            left: `${position.x}px`,
            top: `${position.y}px`,
            zIndex: 1002,
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '2px solid #6366f1',
            userSelect: 'none',
            pointerEvents: 'none' // Let clicks pass through to WebGazer video
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
            pointerEvents: 'auto' // But allow clicks on controls
          }}>
            <span style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#1e293b'
            }}>
              Face Cam
            </span>
            <button
              onClick={() => setIsVisible(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                color: '#64748b',
                padding: '0 4px',
                lineHeight: '1'
              }}
            >
              ×
            </button>
          </div>
          <div style={{
            fontSize: '10px',
            color: '#64748b',
            textAlign: 'center',
            marginTop: '4px',
            pointerEvents: 'auto'
          }}>
            Drag video to move
          </div>
        </div>
      )}
    </>
  );
};

export default FaceCam;

