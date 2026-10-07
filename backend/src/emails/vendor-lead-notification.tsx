import { Button, Heading, Hr, Link, Section, Text } from '@react-email/components';
import * as React from 'react';
import { BaseEmail } from './components/base-email';
import { brand } from './components/brand';

/**
 * Internal notification to the Court+ team when a facility registers.
 *
 * Audience is sales/ops, not the vendor, so it is built to be scanned: the
 * facility name is the headline, the contact details sit in a labelled table,
 * and the reply action is one tap. It replaced a plain-text body that gave no
 * sender identity and no way to act without retyping the address.
 */
export function VendorLeadNotificationEmail({
  facilityName,
  firstName,
  lastName,
  email,
  phoneNumber,
  city,
  alreadyRegistered,
}: {
  facilityName: string;
  firstName: string;
  lastName?: string;
  email: string;
  phoneNumber?: string;
  city?: string;
  alreadyRegistered?: boolean;
}) {
  const fullName = [firstName, lastName].filter(Boolean).join(' ');

  const row = (label: string, value: React.ReactNode, isLast = false) => (
    <tr>
      <td
        style={{
          padding: '10px 0',
          width: '92px',
          verticalAlign: 'top',
          borderBottom: isLast ? 'none' : `1px solid ${brand.border}`,
          color: brand.textMuted,
          fontSize: '13px',
          lineHeight: '20px',
        }}
      >
        {label}
      </td>
      <td
        style={{
          padding: '10px 0',
          verticalAlign: 'top',
          borderBottom: isLast ? 'none' : `1px solid ${brand.border}`,
          color: brand.text,
          fontSize: '14px',
          lineHeight: '20px',
          fontWeight: 500,
        }}
      >
        {value}
      </td>
    </tr>
  );

  return (
    <BaseEmail
      preview={`New vendor lead: ${facilityName}`}
      header={{ eyebrow: 'New vendor lead' }}
    >
      <Heading
        style={{
          margin: '0 0 6px',
          color: brand.text,
          fontSize: '24px',
          lineHeight: '30px',
          fontWeight: 700,
          letterSpacing: '-0.3px',
        }}
      >
        {facilityName}
      </Heading>

      <Text
        style={{
          margin: '0 0 22px',
          color: brand.textMuted,
          fontSize: '15px',
          lineHeight: '22px',
        }}
      >
        registered through the website.
      </Text>

      {/* Status banner: whether the vendor can actually get in from here
          decides whether sales needs to do anything, so it leads. */}
      <Section
        style={{
          backgroundColor: alreadyRegistered ? '#fff7e6' : '#f2fbe3',
          border: `1px solid ${alreadyRegistered ? '#ffd591' : '#d4f0a0'}`,
          borderRadius: '10px',
          padding: '12px 16px',
          margin: '0 0 24px',
        }}
      >
        <Text
          style={{
            margin: 0,
            color: alreadyRegistered ? '#8c5b00' : '#3d5c00',
            fontSize: '13px',
            lineHeight: '20px',
            fontWeight: 600,
          }}
        >
          {alreadyRegistered
            ? 'No link sent — this address already has a Court+ account.'
            : 'Registration link sent to the vendor.'}
        </Text>
      </Section>

      <table
        role="presentation"
        cellPadding={0}
        cellSpacing={0}
        width="100%"
        style={{ borderCollapse: 'collapse', margin: '0 0 24px' }}
      >
        <tbody>
          {row('Contact', fullName || '—')}
          {row(
            'Email',
            <Link
              href={`mailto:${email}`}
              style={{ color: brand.primaryDark, textDecoration: 'none' }}
            >
              {email}
            </Link>,
          )}
          {row(
            'Phone',
            phoneNumber ? (
              <Link
                href={`tel:${phoneNumber}`}
                style={{ color: brand.primaryDark, textDecoration: 'none' }}
              >
                {phoneNumber}
              </Link>
            ) : (
              '—'
            ),
          )}
          {row('City', city || '—', true)}
        </tbody>
      </table>

      <Section style={{ margin: '0 0 8px' }}>
        <Button
          href={`mailto:${email}?subject=${encodeURIComponent(
            `Court+ — ${facilityName}`,
          )}`}
          style={{
            backgroundColor: brand.black,
            color: brand.primary,
            fontSize: '15px',
            fontWeight: 700,
            textDecoration: 'none',
            borderRadius: '999px',
            padding: '13px 28px',
            display: 'inline-block',
          }}
        >
          Reply to {firstName}
        </Button>
      </Section>

      <Hr
        style={{
          borderColor: brand.border,
          borderWidth: '1px 0 0',
          margin: '24px 0 16px',
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
        Replying to this email goes straight to the vendor. The full lead is
        stored in the Court+ database either way.
      </Text>
    </BaseEmail>
  );
}

export default VendorLeadNotificationEmail;
