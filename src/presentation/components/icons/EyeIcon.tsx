import React from 'react';
import { Svg, Path } from 'react-native-svg';

interface EyeIconProps {
  width?: number;
  height?: number;
  color?: string;
}

const EyeIcon: React.FC<EyeIconProps> = ({ 
  width = 14, 
  height = 15, 
  color = '#A2A2A2' 
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 14 15" fill="none">
      <Path
        d="M1 7.5C2.6 4.83333 4.6 3.5 7 3.5C9.4 3.5 11.4 4.83333 13 7.5C11.4 10.1667 9.4 11.5 7 11.5C4.6 11.5 2.6 10.1667 1 7.5Z"
        stroke={color}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7 9.5C8.10457 9.5 9 8.60457 9 7.5C9 6.39543 8.10457 5.5 7 5.5C5.89543 5.5 5 6.39543 5 7.5C5 8.60457 5.89543 9.5 7 9.5Z"
        stroke={color}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default EyeIcon; 