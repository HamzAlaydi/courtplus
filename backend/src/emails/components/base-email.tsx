import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Tailwind,
} from '@react-email/components';
import * as React from 'react';
import { Header, HeaderProps } from './header';
import { Footer } from './footer';
import { brand } from './brand';

export type BaseEmailProps = React.PropsWithChildren<{
  preview?: string;
  title?: string;
  header?: HeaderProps;
}>;

/**
 * Shared shell for every Court+ email.
 *
 * The card is a framed, branded surface rather than the previous bare white
 * box: dark masthead, lime accent rule, padded body, real footer. Tailwind is
 * kept for the existing templates' utility classes, but the structural styles
 * here are inlined because Outlook and Gmail ignore class-based CSS.
 */
export const BaseEmail = ({
  preview,
  header = {},
  children,
}: BaseEmailProps) => {
  return (
    <Tailwind>
      <Html lang="en">
        <Head>
          <meta name="color-scheme" content="light" />
          <meta name="supported-color-schemes" content="light" />
        </Head>
        <Preview>{preview || ''}</Preview>
        <Body
          style={{
            backgroundColor: brand.canvas,
            margin: 0,
            padding: '32px 12px',
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
          }}
        >
          <Container
            style={{
              backgroundColor: brand.white,
              borderRadius: '14px',
              overflow: 'hidden',
              margin: '0 auto',
              maxWidth: '600px',
              border: `1px solid ${brand.border}`,
            }}
          >
            <Header {...header} />

            {/* Lime rule: the one strong brand cue that survives every client,
                since it is a filled block rather than an image. */}
            <Section
              style={{
                backgroundColor: brand.primary,
                height: '4px',
                lineHeight: '4px',
                fontSize: '4px',
              }}
            >
              &nbsp;
            </Section>

            <Section style={{ padding: '32px 32px 8px' }}>{children}</Section>

            <Footer />
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
};
