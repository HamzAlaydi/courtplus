import * as React from 'react';
import { Hr, Section, Text } from '@react-email/components';
import { BaseEmail } from './components/base-email';

export function CourtChangesRequestedEmail({
  courtName,
  branchName,
  reason,
}: {
  courtName: string;
  branchName: string;
  reason: string;
}) {
  return (
    <BaseEmail
      preview={`Changes were requested for ${courtName}`}
      title="Changes Requested for Your Court"
    >
      <Text>Hello,</Text>

      <Text className="text-[16px] text-gray-700 mb-[16px]">
        Our team reviewed your court and requested a few changes before it can
        go live. Please review the feedback below, update your court, and
        resubmit it for approval.
      </Text>

      <Section className="bg-gray-50 rounded-[8px] p-[16px] mb-[24px]">
        <Text className="text-[16px] font-bold text-gray-800 m-0">
          Review Details
        </Text>
        <Hr className="border-gray-200 my-[12px]" />

        <Text className="text-[15px] text-gray-700 m-0">
          <strong>Branch:</strong> {branchName}
        </Text>
        <Text className="text-[15px] text-gray-700 m-0">
          <strong>Court:</strong> {courtName}
        </Text>
        <Text className="text-[15px] text-gray-700 mt-[12px] mb-0">
          <strong>Requested changes:</strong>
        </Text>
        <Text className="text-[15px] text-gray-700 italic bg-white p-[12px] rounded-[4px] border-l-[4px] border-blue-500 m-0">
          "{reason}"
        </Text>
      </Section>

      <Text className="text-[15px] text-gray-700">
        Once you have made the requested changes, use the Resubmit action on
        the court page to send it back for review.
      </Text>

      <Hr className="border-gray-200 my-[24px]" />

      <Text className="text-[12px] text-gray-500 m-0">
        © 2025 Court+. All rights reserved.
      </Text>
    </BaseEmail>
  );
}
