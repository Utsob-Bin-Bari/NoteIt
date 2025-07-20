import React from 'react';
import { Svg, Path } from 'react-native-svg';

interface EyeOffIconProps {
  width?: number;
  height?: number;
  color?: string;
}

const EyeOffIcon: React.FC<EyeOffIconProps> = ({ 
  width = 14, 
  height = 15, 
  color = '#A2A2A2' 
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 14 15" fill="none">
      <Path
        d="M6.05671 6.55794C5.8067 6.80804 5.66628 7.14721 5.66634 7.50085C5.6664 7.85448 5.80694 8.1936 6.05704 8.44361C6.30714 8.69362 6.64631 8.83404 6.99994 8.83398C7.35358 8.83392 7.6927 8.69338 7.94271 8.44328M10.1207 10.6154C9.18549 11.2005 8.1031 11.5073 7 11.5C4.6 11.5 2.6 10.1667 1 7.50002C1.848 6.08669 2.808 5.04802 3.88 4.38402M5.78667 3.62002C6.18603 3.53917 6.59254 3.49897 7 3.50002C9.4 3.50002 11.4 4.83335 13 7.50002C12.556 8.24002 12.0807 8.87802 11.5747 9.41335M1 1.5L13 13.5"
        stroke={color}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default EyeOffIcon; 