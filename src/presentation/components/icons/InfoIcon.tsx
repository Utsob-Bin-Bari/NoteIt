import React, { useContext } from 'react';
import { Svg, Circle, Path } from 'react-native-svg';
import { AppContext } from '../../../application/context/AppContext';
import { ThemeType } from '../../../domain/types/theme/theme';
import { getColors } from '../../constants/Colors';

interface InfoIconProps {
  width?: number;
  height?: number;
  color?: string;
}

const InfoIcon: React.FC<InfoIconProps> = ({ width = 20, height = 20, color }) => {
  const { theme } = useContext(AppContext) as { theme: ThemeType };
  const colors = getColors(theme);
  const iconColor = color || colors.iconGrey;

  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Circle 
        cx="12" 
        cy="12" 
        r="10" 
        stroke={iconColor} 
        strokeWidth="2"
      />
      <Path 
        d="M12 16v-4" 
        stroke={iconColor} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <Path 
        d="M12 8h.01" 
        stroke={iconColor} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default InfoIcon; 