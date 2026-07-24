import * as React from 'react';
import { Hr, Section, Text } from '@react-email/components';
import { BaseEmail } from './components/base-email';

export function CourtPaymentPendingEmail({
  courtName,
  branchName,
}: {
  courtName: string;
  branchName: string;
}) {
  return (
    <BaseEmail
      preview={`Payment is pending for ${courtName}`}
      title="Payment Pending for Your Court"
    >
      <Text>Hello,</Text>

      <Text className="text-[16px] text-gray-700 mb-[16px]">
        Your new court was created and is waiting for the subscription charge
        to be paid. As soon as the payment is confirmed, the court will be sent
        to our team for approval.
      </Text>

      <Section className="bg-gray-50 rounded-[8px] p-[16px] mb-[24px]">
        <Text className="text-[16px] font-bold text-gray-800 m-0">
          Court Details
        </Text>
        <Hr className="border-gray-200 my-[12px]" />

        <Text className="text-[15px] text-gray-700 m-0">
          <strong>Branch:</strong> {branchName}
        </Text>
        <Text className="text-[15px] text-gray-700 m-0">
          <strong>Court:</strong> {courtName}
        </Text>
        <Text className="text-[15px] text-gray-700 m-0">
          <strong>Status:</strong> Pending payment
        </Text>
      </Section>

      <Text className="text-[15px] text-gray-700">
        If the charge did not go through, please update your payment method
        from the Billing page in your dashboard.
      </Text>

      <Hr className="border-gray-200 my-[24px]" />

      <Text className="text-[12px] text-gray-500 m-0">
        © 2025 CourtPlus. All rights reserved.
      </Text>
    </BaseEmail>
  );
}
