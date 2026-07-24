import { Img } from '@react-email/components';
import * as React from 'react';
export type HeaderProps = {
  alt?: string;
  src?: string;
};

export function Header({ alt, src }: HeaderProps) {
  return (
    <div className="p-1 py-2 w-[40px] rounded-md border">
      <Img
        src={src ?? `${process.env.APP_LOGO_URL}`}
        width="36"
        height="28"
        className="mx-auto"
        alt={alt ?? `${process.env.APP_NAME} Logo`}
      />
    </div>
  );
}
