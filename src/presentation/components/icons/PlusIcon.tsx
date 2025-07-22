import React from 'react';
import { Svg, Path } from 'react-native-svg';

interface PlusIconProps {
  width?: number;
  height?: number;
  color?: string;
}

const PlusIcon: React.FC<PlusIconProps> = ({ 
  width = 24, 
  height = 24, 
  color = '#1C274C' 
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 1C12.8284 1 13.5 1.67157 13.5 2.5V10.5H21.5C22.3284 10.5 23 11.1716 23 12C23 12.8284 22.3284 13.5 21.5 13.5H13.5V21.5C13.5 22.3284 12.8284 23 12 23C11.1716 23 10.5 22.3284 10.5 21.5V13.5H2.5C1.67157 13.5 1 12.8284 1 12C1 11.1716 1.67157 10.5 2.5 10.5H10.5V2.5C10.5 1.67157 11.1716 1 12 1Z"
        fill={color}
      />
    </Svg>
  );
};

export default PlusIcon; 