import * as React from "react";
import Svg, { SvgProps, Path } from "react-native-svg";
const CourtIcon = (props: SvgProps) => (
  <Svg width={24} height={24} fill="none" {...props}>
    <Path
      stroke="#BCC4D1"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeMiterlimit={10}
      strokeWidth={1.5}
      d="M17 20.5H7c-3 0-5-1.5-5-5v-7c0-3.5 2-5 5-5h10c3 0 5 1.5 5 5v7c0 3.5-2 5-5 5Z"
    />
    <Path
      stroke="#BCC4D1"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeMiterlimit={10}
      strokeWidth={1.5}
      d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 9.5h1a2.5 2.5 0 0 1 0 5H2M22 14.5h-1a2.5 2.5 0 0 1 0-5h1M12 18v2M12 4v2"
    />
  </Svg>
);
export default CourtIcon;
