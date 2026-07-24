import * as React from "react";
import Svg, { SvgProps, Path } from "react-native-svg";
const CourtFilledIcon = (props: SvgProps) => (
  <Svg width={25} height={25} fill="none" {...props}>
    <Path
      fill="#C0FF42"
      stroke="#171717"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeMiterlimit={10}
      strokeWidth={1.5}
      d="M17.5 21.452h-10c-3 0-5-1.5-5-5v-7c0-3.5 2-5 5-5h10c3 0 5 1.5 5 5v7c0 3.5-2 5-5 5Z"
    />
    <Path
      stroke="#171717"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeMiterlimit={10}
      strokeWidth={1.5}
      d="M12.5 15.952a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2.5 10.452h1a2.5 2.5 0 0 1 0 5h-1M22.5 15.452h-1a2.5 2.5 0 1 1 0-5h1M12.5 18.952v2M12.5 4.952v2"
    />
  </Svg>
);
export default CourtFilledIcon;
