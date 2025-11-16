import { useCallback, useState, useEffect } from 'react'
import WebGazer from './components/WebGazer'
import GazeHeatmap from './components/GazeHeatmap' 

function App() {

  // State for the Heatmap visualization (raw coordinates)
  const[gazeCoords,setGazeCoords] = useState([])
  // State to control tracking
  const [isTracking, setIsTracking] = useState(true)
  // State to control heatmap visibility
  const [isHeatmapVisible, setIsHeatmapVisible] = useState(false)
  // Snapshot of gaze data when tracking stops
  const [heatmapSnapshot, setHeatmapSnapshot] = useState([])
  
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
  
  return (
    <div>
      <WebGazer onGazeUpdate={handleGazeUpdate} isTracking={isTracking}/>

      {/* 🚨 CHANGE 2: Render the GazeHeatmap component and pass the data */}
      <GazeHeatmap data={isHeatmapVisible ? heatmapSnapshot : []} isVisible={isHeatmapVisible} /> 
      
      {/* Control buttons */}
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
      
      {/* UI counter for debugging */}
      <div 
        style={{ 
          position: 'fixed', 
          top: 10, 
          left: 10, 
          zIndex: 1000, 
          backgroundColor: 'lightyellow', 
          padding: '8px', 
          border: '1px solid #ccc',
          borderRadius: '4px' 
        }}
      >
        <p style={{ margin: 0, fontWeight: 'bold' }}>
          Tracking Status: {isTracking ? (gazeCoords.length > 0 ? 'ACTIVE' : 'Waiting for Gaze...') : 'STOPPED'}
        </p>
        <p style={{ margin: 0 }}>
          Total Gaze Points: {isTracking ? gazeCoords.length : heatmapSnapshot.length}
        </p>
      </div>

    </div>
  )
}

export default App