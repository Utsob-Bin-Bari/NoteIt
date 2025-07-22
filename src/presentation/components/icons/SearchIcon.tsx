import React, { useContext } from 'react';
import { Svg, G, Rect, Circle, Path, Defs, ClipPath } from 'react-native-svg';
import { AppContext } from '../../../application/context/AppContext';
import { ThemeType } from '../../../domain/types/theme/theme';
import { getColors } from '../../constants/Colors';

interface SearchIconProps {
  width?: number;
  height?: number;
}

const SearchIcon: React.FC<SearchIconProps> = ({ width = 24, height = 24 }) => {
  const { theme } = useContext(AppContext) as { theme: ThemeType };
  const colors = getColors(theme);

  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <G clipPath="url(#clip0_15_152)">
        <Rect width="24" height="24" fill="transparent"/>
        <Circle 
          cx="10.5" 
          cy="10.5" 
          r="6.5" 
          stroke={colors.primary} 
          strokeLinejoin="round"
        />
        <Path 
          d="M19.6464 20.3536C19.8417 20.5488 20.1583 20.5488 20.3536 20.3536C20.5488 20.1583 20.5488 19.8417 20.3536 19.6464L19.6464 20.3536ZM20.3536 19.6464L15.3536 14.6464L14.6464 15.3536L19.6464 20.3536L20.3536 19.6464Z" 
          fill={colors.primary}
        />
      </G>
      <Defs>
        <ClipPath id="clip0_15_152">
          <Rect width="24" height="24" fill="transparent"/>
        </ClipPath>
      </Defs>
    </Svg>
  );
};

export default SearchIcon; 