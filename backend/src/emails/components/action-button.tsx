import { Button, ButtonProps } from '@react-email/components';
import * as React from 'react';

export function ActionButton(props: ButtonProps) {
  return <Button className="bg-blue-500 text-white rounded-md" {...props} />;
}
