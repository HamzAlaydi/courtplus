import React from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";

type IconProps = {
  color: string;
  size?: number;
};

export const CourtTileIcon = ({ color, size = 24 }: IconProps) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Rect x={3} y={4} width={18} height={16} rx={2} />
    <Path d="M12 4v16M3 12h18" />
  </Svg>
);

export const BookingsTileIcon = ({ color, size = 24 }: IconProps) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4Z" />
    <Path d="M13 5v2M13 11v2M13 17v2" />
  </Svg>
);

export const OpenMatchTileIcon = ({ color, size = 24 }: IconProps) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Circle cx={9} cy={8} r={3.5} />
    <Path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <Path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5c2 .8 3.5 2.8 3.5 5.5" />
  </Svg>
);

export const CoachTileIcon = ({ color, size = 24 }: IconProps) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Circle cx={12} cy={9} r={5} />
    <Path d="m8.5 13.5-1.5 7.5 5-3 5 3-1.5-7.5" />
  </Svg>
);

export const SearchIcon = ({ color, size = 20 }: IconProps) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
  >
    <Circle cx={11} cy={11} r={7} />
    <Path d="m20 20-3.5-3.5" />
  </Svg>
);

export const FilterIcon = ({ color, size = 20 }: IconProps) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
  >
    <Path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12" />
    <Circle cx={16} cy={6} r={2} />
    <Circle cx={10} cy={12} r={2} />
    <Circle cx={18} cy={18} r={2} />
  </Svg>
);
