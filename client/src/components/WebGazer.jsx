import React from 'react'
import { useEffect,} from 'react';
function WebGazer() {
  return (
        useEffect(() =>{
      const webgazer = window.webgazer
      webgazer.setGazeListener((data,time) =>{
        console.log(data,time);
      }).begin()
    })
  )
}

export default WebGazer;
