import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Tailwind,
} from '@react-email/components';
import * as React from 'react';
import { Header, HeaderProps } from './header';
import { Footer } from './footer';

export type BaseEmailProps = React.PropsWithChildren<{
  preview?: string;
  title?: string;
  header?: HeaderProps;
}>;

export const BaseEmail = ({
  preview,
  header = {},
  children,
}: BaseEmailProps) => {
  return (
    <Tailwind>
      <Html>
        <Head />
        <Preview>{preview || ''}</Preview>
        <Body className="bg-gray-100 font-sans py-[40px]">
          <Container className="bg-white rounded-[8px] mx-auto p-[20px] max-w-[600px]">
            <Header {...header} />
            {children}
            <Footer />
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
};
