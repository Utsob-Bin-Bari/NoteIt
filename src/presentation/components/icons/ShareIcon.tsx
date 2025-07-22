import React, { useContext } from 'react';
import { Svg, Path } from 'react-native-svg';
import { AppContext } from '../../../application/context/AppContext';
import { ThemeType } from '../../../domain/types/theme/theme';
import { getColors } from '../../constants/Colors';

interface ShareIconProps {
  width?: number;
  height?: number;
  color?: string;
}

const ShareIcon: React.FC<ShareIconProps> = ({ width = 20, height = 20, color }) => {
  const { theme } = useContext(AppContext) as { theme: ThemeType };
  const colors = getColors(theme);
  const iconColor = color || colors.iconGrey;

  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path 
        d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 5.18727 15.0129 5.37127 15.0375 5.55084L8.8418 9.20227C8.32247 8.53227 7.53235 8.12497 6.64807 8.12497C4.99122 8.12497 3.64807 9.46812 3.64807 11.125C3.64807 12.7819 4.99122 14.125 6.64807 14.125C7.53235 14.125 8.32247 13.7177 8.8418 13.0477L15.0375 16.6992C15.0129 16.8787 15 17.0627 15 17.25C15 18.9069 16.3431 20.25 18 20.25C19.6569 20.25 21 18.9069 21 17.25C21 15.5931 19.6569 14.25 18 14.25C17.1157 14.25 16.3256 14.6573 15.8063 15.3273L9.61056 11.6758C9.63514 11.4963 9.64807 11.3123 9.64807 11.125C9.64807 10.9377 9.63514 10.7537 9.61056 10.5742L15.8063 6.92273C16.3256 7.59273 17.1157 8 18 8Z" 
        fill={iconColor}
      />
    </Svg>
  );
};

export default ShareIcon; 