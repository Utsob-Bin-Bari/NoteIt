import React from 'react';
import Svg, { Defs, ClipPath, Rect, G, Line, Path } from 'react-native-svg';

interface StatsIconProps {
  width?: number;
  height?: number;
  color?: string;
}

const StatsIcon: React.FC<StatsIconProps> = ({ 
  width = 24, 
  height = 24, 
  color = '#58595b' 
}) => {
  return (
    <Svg 
      width={width} 
      height={height} 
      viewBox="0 0 96 96"
    >
      <Defs>
        <ClipPath id="clip-stats">
          <Rect width="96" height="96"/>
        </ClipPath>
      </Defs>
      <G clipPath="url(#clip-stats)">
        <G transform="translate(-232)">
          <Rect 
            width="88" 
            height="88" 
            rx="8" 
            transform="translate(236 4)" 
            fill="none" 
            stroke={color} 
            strokeLinecap="round" 
            strokeMiterlimit="10" 
            strokeWidth="4"
          />
          <G>
            <G>
              <Line 
                y2="34" 
                transform="translate(272 42)" 
                fill="none" 
                stroke={color} 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="4"
              />
              <Line 
                y2="42" 
                transform="translate(305 34)" 
                fill="none" 
                stroke={color} 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="4"
              />
              <Line 
                y2="29" 
                transform="translate(288 47)" 
                fill="none" 
                stroke={color} 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="4"
              />
              <Line 
                y2="23" 
                transform="translate(255 53)" 
                fill="none" 
                stroke={color} 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="4"
              />
            </G>
            <Path 
              d="M255,42l17-14,16,6,17-15" 
              fill="none" 
              stroke={color} 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="4"
            />
          </G>
        </G>
      </G>
    </Svg>
  );
};

export default StatsIcon; 