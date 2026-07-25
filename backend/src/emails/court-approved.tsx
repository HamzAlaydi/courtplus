import * as React from 'react';
import { Hr, Section, Text } from '@react-email/components';
import { BaseEmail } from './components/base-email';

export function CourtApprovedEmail({
  courtName,
  branchName,
}: {
  courtName: string;
  branchName: string;
}) {
  return (
    <BaseEmail
      preview={`${courtName} has been approved and is now live`}
      title="Court Approved"
    >
      <Text>Hello,</Text>

      <Text className="text-[16px] text-gray-700 mb-[16px]">
        Good news! Your court has been reviewed and approved by our team. It is
        now live and visible to customers.
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
          <strong>Status:</strong> Live
        </Text>
      </Section>

      <Text className="text-[15px] text-gray-700">
        Customers can now discover and book this court. You can manage it at
        any time from your dashboard.
      </Text>

      <Hr className="border-gray-200 my-[24px]" />

      <Text className="text-[12px] text-gray-500 m-0">
        © 2025 Court+. All rights reserved.
      </Text>
    </BaseEmail>
  );
}
