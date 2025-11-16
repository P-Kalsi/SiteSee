import React, { useEffect, useRef, useState } from "react";

function WebGazerHeatmap() {
  const heatmapInstanceRef = useRef(null);
  const [started, setStarted] = useState(false);   // whether tracking started
  const [snapshotURL, setSnapshotURL] = useState(null); // saved PNG

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

    // Start listening to gaze data
    webgazer.setGazeListener((data) => {
      if (!data) return;

      heatmapInstanceRef.current.addData({
        x: data.x,
        y: data.y,
        value: 1
      });
    });

    webgazer.begin();
    setStarted(true);
  };

  const finishAndSave = () => {
    const webgazer = window.webgazer;
    webgazer.end();

    const dataURL = heatmapInstanceRef.current.getDataURL();
    setSnapshotURL(dataURL);
  };

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