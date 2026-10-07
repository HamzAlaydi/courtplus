import { Button, Heading, Hr, Link, Section, Text } from '@react-email/components';
import * as React from 'react';
import { BaseEmail } from './components/base-email';
import { brand } from './components/brand';

/**
 * Sent to a facility owner who registered on the marketing site.
 *
 * Goes to the VENDOR'S own address (not Court+'s inbox) and carries the
 * single-use link that takes them into the vendor portal to set a password and
 * finish their facility profile.
 */
export function VendorRegistrationEmail({
  registrationLink,
  firstName,
  facilityName,
  expiresInDays,
}: {
  registrationLink: string;
  firstName: string;
  facilityName: string;
  expiresInDays: number;
}) {
  const step = (n: string, title: string, body: string) => (
    <Section style={{ marginBottom: '14px' }}>
      <table
        role="presentation"
        cellPadding={0}
        cellSpacing={0}
        style={{ borderCollapse: 'collapse' }}
      >
        <tbody>
          <tr>
            <td
              style={{
                width: '26px',
                verticalAlign: 'top',
                paddingTop: '2px',
              }}
            >
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '11px',
                  backgroundColor: brand.black,
                  color: brand.primary,
                  fontSize: '12px',
                  fontWeight: 700,
                  lineHeight: '22px',
                  textAlign: 'center',
                }}
              >
                {n}
              </div>
            </td>
            <td style={{ paddingLeft: '12px', verticalAlign: 'top' }}>
              <Text
                style={{
                  margin: 0,
                  color: brand.text,
                  fontSize: '15px',
                  lineHeight: '22px',
                  fontWeight: 600,
                }}
              >
                {title}
              </Text>
              <Text
                style={{
                  margin: '2px 0 0',
                  color: brand.textMuted,
                  fontSize: '14px',
                  lineHeight: '21px',
                }}
              >
                {body}
              </Text>
            </td>
          </tr>
        </tbody>
      </table>
    </Section>
  );

  return (
    <BaseEmail
      preview={`Finish setting up ${facilityName} on ${brand.appName}`}
      header={{ eyebrow: 'Vendor registration' }}
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
        Welcome aboard, {firstName}.
      </Heading>

      <Text
        style={{
          margin: '0 0 24px',
          color: brand.textMuted,
          fontSize: '16px',
          lineHeight: '25px',
        }}
      >
        Your request to list{' '}
        <strong style={{ color: brand.text }}>{facilityName}</strong> is in.
        One short step and you can start taking bookings.
      </Text>

      {/* Primary action. Padding sits on the anchor because Outlook ignores
          height on inline-block elements. */}
      <Section style={{ margin: '0 0 12px' }}>
        <Button
          href={registrationLink}
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
          Finish setting up →
        </Button>
      </Section>

      <Text
        style={{
          margin: '0 0 28px',
          color: '#9aa4a1',
          fontSize: '12px',
          lineHeight: '18px',
        }}
      >
        Link expires in {expiresInDays} days · single use
      </Text>

      <Hr
        style={{
          borderColor: brand.border,
          borderWidth: '1px 0 0',
          margin: '0 0 24px',
        }}
      />

      <Text
        style={{
          margin: '0 0 16px',
          color: brand.text,
          fontSize: '13px',
          lineHeight: '18px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}
      >
        What happens next
      </Text>

      {step('1', 'Set your password', 'Takes a few seconds — your email is already confirmed.')}
      {step('2', 'Add branches and courts', 'Opening hours, pricing and photos for each court.')}
      {step('3', 'Go live', 'Once approved, players can find and book you.')}

      <Section
        style={{
          backgroundColor: '#f6f8f7',
          borderRadius: '10px',
          padding: '16px 18px',
          margin: '10px 0 0',
        }}
      >
        <Text
          style={{
            margin: '0 0 6px',
            color: brand.textMuted,
            fontSize: '12px',
            lineHeight: '18px',
          }}
        >
          Button not working? Paste this into your browser:
        </Text>
        <Link
          href={registrationLink}
          style={{
            color: brand.primaryDark,
            fontSize: '12px',
            lineHeight: '18px',
            wordBreak: 'break-all',
            textDecoration: 'none',
          }}
        >
          {registrationLink}
        </Link>
      </Section>

      <Text
        style={{
          margin: '20px 0 0',
          color: '#9aa4a1',
          fontSize: '12px',
          lineHeight: '18px',
        }}
      >
        Didn't request this? You can ignore this email — no account is created
        until the link is used.
      </Text>
    </BaseEmail>
  );
}

export default VendorRegistrationEmail;
