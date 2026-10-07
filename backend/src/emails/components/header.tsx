import { Img, Section, Text } from '@react-email/components';
import * as React from 'react';
import { brand, getLogoUrl } from './brand';

export type HeaderProps = {
  alt?: string;
  src?: string;
  /** Small line under the wordmark, e.g. "Vendor registration". */
  eyebrow?: string;
};

/**
 * Branded masthead: dark band, logo, and a lime rule underneath.
 *
 * This used to be a bare 48px logo on white with no framing at all, which read
 * as a system notice rather than as Court+. Styles are inlined because Gmail,
 * Outlook and most mobile clients drop <style> blocks and class-based CSS.
 */
export function Header({ alt, src, eyebrow }: HeaderProps) {
  return (
    <Section
      style={{
        backgroundColor: brand.black,
        padding: '28px 32px 24px',
        textAlign: 'center',
      }}
    >
      <Img
        src={src ?? getLogoUrl()}
        width="44"
        height="44"
        alt={alt ?? `${brand.appName} logo`}
        style={{
          display: 'block',
          margin: '0 auto 12px',
          borderRadius: '10px',
        }}
      />
      <Text
        style={{
          margin: 0,
          color: brand.white,
          fontSize: '20px',
          lineHeight: '24px',
          fontWeight: 700,
          letterSpacing: '-0.3px',
        }}
      >
        {brand.appName}
      </Text>
      {eyebrow ? (
        <Text
          style={{
            margin: '6px 0 0',
            color: brand.primary,
            fontSize: '11px',
            lineHeight: '16px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '1.4px',
          }}
        >
          {eyebrow}
        </Text>
      ) : null}
    </Section>
  );
}
