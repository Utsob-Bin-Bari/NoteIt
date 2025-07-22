import React from 'react';
import { Svg, Path } from 'react-native-svg';

interface BookmarkIconProps {
  width?: number;
  height?: number;
  color?: string;
  filled?: boolean;
}

const BookmarkIcon: React.FC<BookmarkIconProps> = ({ 
  width = 24, 
  height = 24, 
  color = '#000000',
  filled = false
}) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 21L12 16L5 21V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V21Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={filled ? color : "none"}
      />
    </Svg>
  );
};

export default BookmarkIcon; 