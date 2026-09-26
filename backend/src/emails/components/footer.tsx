import { Hr, Link, Section, Text } from '@react-email/components';
import * as React from 'react';
import { brand } from './brand';

/**
 * Email footer.
 *
 * This component previously returned `null`, so every Court+ email ended
 * abruptly after its last paragraph with no sender identity, no support route
 * and no physical presence — which reads as unfinished and is also the kind of
 * thing spam filters weigh against a sender.
 */
export function Footer() {
  return (
    <Section style={{ padding: '0 32px 32px' }}>
      <Hr
        style={{
          borderColor: brand.border,
          borderWidth: '1px 0 0',
          margin: '0 0 20px',
        }}
      />

      <Text
        style={{
          margin: '0 0 10px',
          color: brand.textMuted,
          fontSize: '13px',
          lineHeight: '20px',
        }}
      >
        Need a hand? Reply to this email or reach us at{' '}
        <Link
          href={`mailto:${brand.supportEmail}`}
          style={{ color: brand.primaryDark, textDecoration: 'none' }}
        >
          {brand.supportEmail}
        </Link>
        .
      </Text>

      <Text
        style={{
          margin: '0 0 4px',
          color: brand.textMuted,
          fontSize: '12px',
          lineHeight: '18px',
        }}
      >
        <Link
          href={brand.siteUrl}
          style={{ color: brand.textMuted, textDecoration: 'underline' }}
        >
          courtplusapp.com
        </Link>
        {'  ·  '}
        <Link
          href={`${brand.siteUrl}/privacy`}
          style={{ color: brand.textMuted, textDecoration: 'underline' }}
        >
          Privacy
        </Link>
        {'  ·  '}
        <Link
          href={`${brand.siteUrl}/terms`}
          style={{ color: brand.textMuted, textDecoration: 'underline' }}
        >
          Terms
        </Link>
      </Text>

      <Text
        style={{
          margin: 0,
          color: '#9aa4a1',
          fontSize: '11px',
          lineHeight: '17px',
        }}
      >
        © {brand.appName}. Sent because you have an account or requested one at
        courtplusapp.com.
      </Text>
    </Section>
  );
}
