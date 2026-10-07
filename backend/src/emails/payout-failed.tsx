import * as React from 'react';
import { Button, Heading, Hr, Section, Text } from '@react-email/components';
import { BaseEmail } from './components/base-email';

export interface PayoutFailedEmailProps {
  vendorName: string;
  amount: string;
  currency: string;
  /** Provider-supplied reason, when there is one worth showing. */
  reason?: string;
}

/**
 * A rejected transfer used to be completely silent: no email, no push, not
 * even an in-app row. The money quietly reappeared on the vendor's balance
 * with no explanation, so they simply retried into the same failure.
 */
export function PayoutFailedEmail({
  vendorName,
  amount,
  currency,
  reason,
}: PayoutFailedEmailProps) {
  return (
    <BaseEmail preview={`Your ${amount} ${currency} withdrawal could not be sent`}>
      <Heading className="text-[24px] font-bold text-center text-gray-800 my-[16px]">
        Your withdrawal didn't go through
      </Heading>

      <Text className="text-[16px] text-gray-700 mb-[24px]">
        Hi {vendorName}, we couldn't send your withdrawal. Nothing has been
        lost — the full amount is back on your Court+ balance and you can
        request it again once the details below are sorted out.
      </Text>

      <Section className="bg-red-50 border-l-[4px] border-red-500 rounded-[8px] p-[16px] mb-[24px]">
        <Text className="text-[14px] text-gray-700 my-[4px]">
          <strong>Amount:</strong> {amount} {currency}
        </Text>
        {reason ? (
          <Text className="text-[14px] text-gray-700 my-[4px]">
            <strong>Reason:</strong> {reason}
          </Text>
        ) : null}
      </Section>

      <Text className="text-[16px] text-gray-700 mb-[24px]">
        This is almost always the bank details on file — a closed account, a
        mistyped IBAN, or a name that doesn't match. Check them in Settings
        before requesting the withdrawal again.
      </Text>

      <Button
        className="bg-blue-600 text-white font-bold py-[12px] px-[20px] rounded-[4px] no-underline text-center block box-border"
        href="https://dashboard.courtplusapp.com/settings"
      >
        Check Payout Details
      </Button>

      <Hr className="border border-solid border-gray-200 my-[24px]" />

      <Text className="text-[12px] text-gray-500 text-center m-0">
        This is an automated notification from Court+.
      </Text>
    </BaseEmail>
  );
}

export default PayoutFailedEmail;
