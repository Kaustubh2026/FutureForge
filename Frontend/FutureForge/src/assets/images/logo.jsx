import React from 'react';

const Logo = (props) => {
  const { width = '200px', height = 'auto', className = '' } = props;
  
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={width} 
      height={height} 
      viewBox="0 0 800 200" 
      className={`future-forge-logo ${className}`}
    >
      {/* White background */}
      <rect width="100%" height="100%" fill="white" rx="10" />
      
      {/* Logo SVG - colored blocks + text */}
      <g transform="translate(500, 25) scale(0.6)">
        {/* Red block */}
        <rect x="424" y="245" width="60" height="120" rx="20" fill="#E74C3C" />
        
        {/* Yellow blocks */}
        <rect x="512" y="207" width="55" height="70" rx="20" fill="#F1C40F" />
        <rect x="512" y="315" width="55" height="50" rx="20" fill="#F1C40F" />
        
        {/* Green blocks */}
        <rect x="599" y="122" width="60" height="60" rx="20" fill="#27AE60" />
        <rect x="599" y="215" width="60" height="50" rx="20" fill="#27AE60" />
        <rect x="599" y="298" width="60" height="67" rx="20" fill="#27AE60" />
        
        {/* Blue blocks */}
        <rect x="687" y="52" width="60" height="95" rx="20" fill="#3498DB" />
        <rect x="687" y="185" width="60" height="80" rx="20" fill="#3498DB" />
        <rect x="687" y="313" width="60" height="57" rx="20" fill="#3498DB" />
      </g>
      
      {/* FutureForge text */}
      <text x="50" y="120" fontFamily="Arial, sans-serif" fontSize="60" fontWeight="bold" fill="#2C3E50">
        FutureForge
      </text>
    </svg>
  );
};

export default Logo; 