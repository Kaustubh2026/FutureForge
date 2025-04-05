import React, { useEffect, useRef, useState } from 'react';
import './AICircle.css';

const AICircle = ({ isSpeaking, isProcessing }) => {
  const visualizerRef = useRef(null);
  const [bars, setBars] = useState([]);
  const [isExpanding, setIsExpanding] = useState(false);
  const [hasStabilized, setHasStabilized] = useState(false);
  const expandTimeoutRef = useRef(null);
  const stabilizeTimeoutRef = useRef(null);
  const pulseIntervalRef = useRef(null);

  useEffect(() => {
    // Create visualizer bars
    const newBars = Array(20).fill(null).map((_, index) => (
      <div key={index} className="bar" />
    ));
    setBars(newBars);
  }, []);

  useEffect(() => {
    let animationInterval;
    
    if (isSpeaking) {
      // Start expanding animation
      setIsExpanding(true);
      setHasStabilized(false);
      
      // Clear any existing timeouts
      if (expandTimeoutRef.current) clearTimeout(expandTimeoutRef.current);
      if (stabilizeTimeoutRef.current) clearTimeout(stabilizeTimeoutRef.current);
      if (pulseIntervalRef.current) clearInterval(pulseIntervalRef.current);
      
      // Start pulsing animation for 30 seconds
      let pulseCount = 0;
      const maxPulses = 15; // 15 pulses over 30 seconds (2 seconds each)
      
      pulseIntervalRef.current = setInterval(() => {
        pulseCount++;
        if (pulseCount >= maxPulses) {
          clearInterval(pulseIntervalRef.current);
          setHasStabilized(true);
        }
      }, 2000);
      
      // Set timeout to stabilize after 30 seconds
      stabilizeTimeoutRef.current = setTimeout(() => {
        setHasStabilized(true);
        if (pulseIntervalRef.current) clearInterval(pulseIntervalRef.current);
      }, 30000);
      
      // Start visualizer animation
      animationInterval = setInterval(animateVisualizer, 50);
    } else if (isProcessing) {
      // Just show processing animation without expanding
      setIsExpanding(false);
      setHasStabilized(true);
      animationInterval = setInterval(animateVisualizer, 50);
    } else {
      // Reset states when not speaking or processing
      setIsExpanding(false);
      setHasStabilized(false);
      if (expandTimeoutRef.current) clearTimeout(expandTimeoutRef.current);
      if (stabilizeTimeoutRef.current) clearTimeout(stabilizeTimeoutRef.current);
      if (pulseIntervalRef.current) clearInterval(pulseIntervalRef.current);
    }
    
    return () => {
      if (animationInterval) {
        clearInterval(animationInterval);
      }
      if (expandTimeoutRef.current) clearTimeout(expandTimeoutRef.current);
      if (stabilizeTimeoutRef.current) clearTimeout(stabilizeTimeoutRef.current);
      if (pulseIntervalRef.current) clearInterval(pulseIntervalRef.current);
    };
  }, [isSpeaking, isProcessing]);

  const animateVisualizer = () => {
    if (visualizerRef.current) {
      const bars = visualizerRef.current.querySelectorAll('.bar');
      bars.forEach(bar => {
        const height = Math.floor(Math.random() * 20) + 5;
        bar.style.height = `${height}px`;
      });
    }
  };

  return (
    <div className="ai-circle-container">
      <div 
        className={`ai-circle ${isSpeaking ? 'speaking' : ''} ${isProcessing ? 'processing' : ''} ${isExpanding ? 'expanding' : ''} ${hasStabilized ? 'stabilized' : ''}`}
      >
        <div className="wave"></div>
        <div className="wave"></div>
        <div className="wave"></div>
        <div className="inner-circle">
          <div className="visualizer" ref={visualizerRef}>
            {bars}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AICircle; 