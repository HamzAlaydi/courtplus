import { Button, Heading, Hr, Link, Section, Text } from '@react-email/components';
import * as React from 'react';
import { BaseEmail } from './components/base-email';
import { brand } from './components/brand';

/**
 * Sent when someone registers a facility using an address that already has a
 * Court+ account.
 *
 * The registration endpoint cannot say "that email is taken" in its response —
 * that would turn a public form into a way to discover which addresses have
 * accounts. But staying silent meant the person was told to check an inbox
 * that would never receive anything. Sending a sign-in email instead keeps the
 * response identical for every address while making the promise true: only the
 * real mailbox owner learns that an account exists.
 */
export function VendorAccountExistsEmail({
  firstName,
  facilityName,
  signInLink,
  resetPasswordLink,
}: {
  firstName: string;
  facilityName: string;
  signInLink: string;
  resetPasswordLink: string;
}) {
  return (
    <BaseEmail
      preview={`You already have a ${brand.appName} account`}
      header={{ eyebrow: 'Account already exists' }}
    >
      <Heading
        style={{
          margin: '0 0 12px',
          color: brand.text,
          fontSize: '26px',
          lineHeight: '32px',
          fontWeight: 700,
          letterSpacing: '-0.4px',
        }}
      >
        You're already with us, {firstName}.
      </Heading>

      <Text
        style={{
          margin: '0 0 24px',
          color: brand.textMuted,
          fontSize: '16px',
          lineHeight: '25px',
        }}
      >
        We received a request to register{' '}
        <strong style={{ color: brand.text }}>{facilityName}</strong>, but this
        email address already has a {brand.appName} account. Sign in and you can
        manage everything from your portal — no new registration needed.
      </Text>

      <Section style={{ margin: '0 0 12px' }}>
        <Button
          href={signInLink}
          style={{
            backgroundColor: brand.primary,
            color: brand.black,
            fontSize: '16px',
            fontWeight: 700,
            textDecoration: 'none',
            borderRadius: '999px',
            padding: '15px 34px',
            display: 'inline-block',
          }}
        >
          Sign in to your portal →
        </Button>
      </Section>

      <Text
        style={{
          margin: '0 0 28px',
          color: brand.textMuted,
          fontSize: '14px',
          lineHeight: '21px',
        }}
      >
        Forgotten your password?{' '}
        <Link
          href={resetPasswordLink}
          style={{ color: brand.primaryDark, textDecoration: 'none' }}
        >
          Reset it here
        </Link>
        .
      </Text>

      <Hr
        style={{
          borderColor: brand.border,
          borderWidth: '1px 0 0',
          margin: '0 0 20px',
        }}
      />

      <Text
        style={{
          margin: 0,
          color: '#9aa4a1',
          fontSize: '12px',
          lineHeight: '18px',
        }}
      >
        Adding a second facility? You can add more branches and courts from
        inside the portal. Didn't make this request? Nothing has changed on your
        account — you can safely ignore this email.
      </Text>
    </BaseEmail>
  );
}

export default VendorAccountExistsEmail;
