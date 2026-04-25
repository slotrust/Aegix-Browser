import React from 'react';

export function AegixLogo({ size = 24, className = "" }: { size?: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size * 1.2} 
      viewBox="0 0 100 120" 
      className={className}
    >
      {/* Dark Circular Background */}
      <circle cx="50" cy="45" r="45" fill="#11161d" />

      {/* Background/Base Shield Map */}
      <polygon 
        points="50,10 82,25 82,65 50,85 18,65 18,25" 
        fill="none" 
        stroke="#005588" 
        strokeWidth="0.5"
      />
      
      {/* Connecting Inner Lines */}
      <line x1="18" y1="25" x2="82" y2="65" stroke="#005588" strokeWidth="0.5" />
      <line x1="18" y1="65" x2="82" y2="25" stroke="#005588" strokeWidth="0.5" />
      <line x1="50" y1="10" x2="50" y2="85" stroke="#005588" strokeWidth="0.5" />
      
      {/* Hexagon Nodes */}
      <circle cx="50" cy="10" r="1.5" fill="#0077AA" />
      <circle cx="82" cy="25" r="1.5" fill="#0077AA" />
      <circle cx="82" cy="65" r="1.5" fill="#0077AA" />
      <circle cx="18" cy="65" r="1.5" fill="#0077AA" />
      <circle cx="18" cy="25" r="1.5" fill="#0077AA" />
      
      {/* Top Node background circle */}
      <circle cx="50" cy="20" r="4" fill="#040C18" />

      {/* The glowing "A" / Lambda shape */}
      <path 
        d="M32,73 L50,20 L68,73" 
        fill="none" 
        stroke="url(#electric-cyan)" 
        strokeWidth="9" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* Bottom Gem */}
      <polygon 
        points="50,83 52,85 50,87.5 48,85" 
        fill="#44EEFF" 
      />
      
      {/* Text "AEGIX" */}
      <text 
        x="50" 
        y="105" 
        fontSize="12" 
        fontWeight="600" 
        fill="#44EEFF" 
        letterSpacing="4" 
        textAnchor="middle" 
        fontFamily="sans-serif"
      >
        AEGIX
      </text>

      {/* Text "BROWSE FREE" */}
      <text 
        x="50" 
        y="115" 
        fontSize="5" 
        fontWeight="500" 
        fill="#557788" 
        letterSpacing="2" 
        textAnchor="middle" 
        fontFamily="sans-serif"
      >
        BROWSE FREE
      </text>
      
      <defs>
        <linearGradient id="electric-cyan" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#44EEFF" />
          <stop offset="100%" stopColor="#0077AA" />
        </linearGradient>
      </defs>
    </svg>
  );
}
