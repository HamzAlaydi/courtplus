import { Img } from '@react-email/components';
import * as React from 'react';

const DEFAULT_LOGO_URL = 'https://courtplusapp.com/logo512.png';

export type HeaderProps = {
  alt?: string;
  src?: string;
};

export function Header({ alt, src }: HeaderProps) {
  return (
    <div className="py-2">
      <Img
        src={src ?? (process.env.APP_LOGO_URL || DEFAULT_LOGO_URL)}
        width="48"
        height="48"
        className="rounded-md"
        alt={alt ?? 'Court+ Logo'}
      />
    </div>
  );
}
