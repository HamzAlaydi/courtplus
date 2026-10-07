import * as React from 'react';
import { Button, Heading, Hr, Section, Text } from '@react-email/components';
import { BaseEmail } from './components/base-email';

export interface SubscriptionPaymentFailedEmailProps {
  tenantName: string;
  amount: string;
  currency: string;
  /** Stripe's hosted invoice page, where the card can be updated and retried. */
  invoiceUrl?: string;
  /** Formatted date Stripe will retry, when it has scheduled one. */
  nextAttempt?: string;
}

/**
 * Until this existed there was no billing email in the product at all. A
 * vendor whose card expired got an in-app row and nothing else: the
 * subscription lapsed, their courts sat in `pending_payment`, and the first
 * they heard of it was a customer asking why a court had disappeared.
 */
export function SubscriptionPaymentFailedEmail({
  tenantName,
  amount,
  currency,
  invoiceUrl,
  nextAttempt,
}: SubscriptionPaymentFailedEmailProps) {
  return (
    <BaseEmail preview={`We could not take payment for ${tenantName}`}>
      <Heading className="text-[24px] font-bold text-center text-gray-800 my-[16px]">
        We couldn't take your payment
      </Heading>

      <Text className="text-[16px] text-gray-700 mb-[24px]">
        The payment for <strong>{tenantName}</strong>'s Court+ subscription did
        not go through.
      </Text>

      <Section className="bg-red-50 border-l-[4px] border-red-500 rounded-[8px] p-[16px] mb-[24px]">
        <Text className="text-[14px] text-gray-700 my-[4px]">
          <strong>Amount due:</strong> {amount} {currency}
        </Text>
        {nextAttempt ? (
          <Text className="text-[14px] text-gray-700 my-[4px]">
            <strong>We'll try again:</strong> {nextAttempt}
          </Text>
        ) : null}
      </Section>

      <Text className="text-[16px] text-gray-700 mb-[24px]">
        While the subscription is unpaid, new courts stay pending and cannot be
        booked. Updating your card clears this straight away.
      </Text>

      {invoiceUrl ? (
        <Button
          className="bg-blue-600 text-white font-bold py-[12px] px-[20px] rounded-[4px] no-underline text-center block box-border"
          href={invoiceUrl}
        >
          Update Payment Method
        </Button>
      ) : null}

      <Hr className="border border-solid border-gray-200 my-[24px]" />

      <Text className="text-[12px] text-gray-500 text-center m-0">
        This is an automated notification from Court+.
      </Text>
    </BaseEmail>
  );
}

export default SubscriptionPaymentFailedEmail;
