import { Text as EmailText, TextProps } from '@react-email/components';
import * as React from 'react';

export function Text(props: TextProps) {
  return <EmailText style={text} {...props} />;
}

const text = {
  fontSize: '16px',
  fontFamily:
    "'Open Sans', 'HelveticaNeue-Light', 'Helvetica Neue Light', 'Helvetica Neue', Helvetica, Arial, 'Lucida Grande', sans-serif",
  fontWeight: '300',
  color: '#404040',
  lineHeight: '26px',
};
