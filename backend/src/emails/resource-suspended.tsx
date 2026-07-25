import * as React from 'react';
import { Hr, Section, Text } from '@react-email/components';
import { BaseEmail } from './components/base-email';

export function ResourceSuspendedEmail({
  resourceType,
  resourceName,
  reason,
}: {
  resourceType: string;
  resourceName: string;
  reason: string;
}) {
  return (
    <BaseEmail
      preview={`${resourceType} ${resourceName} has been suspended`}
      title={`${resourceType} Suspended`}
    >
      <Text>Hello,</Text>

      <Text className="text-[16px] text-gray-700 mb-[16px]">
        Your {resourceType.toLowerCase()} has been suspended by our team and is
        no longer visible to customers. Please review the reason below.
      </Text>

      <Section className="bg-gray-50 rounded-[8px] p-[16px] mb-[24px]">
        <Text className="text-[16px] font-bold text-gray-800 m-0">
          Suspension Details
        </Text>
        <Hr className="border-gray-200 my-[12px]" />

        <Text className="text-[15px] text-gray-700 m-0">
          <strong>{resourceType}:</strong> {resourceName}
        </Text>
        <Text className="text-[15px] text-gray-700 mt-[12px] mb-0">
          <strong>Reason:</strong>
        </Text>
        <Text className="text-[15px] text-gray-700 italic bg-white p-[12px] rounded-[4px] border-l-[4px] border-red-500 m-0">
          "{reason}"
        </Text>
      </Section>

      <Text className="text-[15px] text-gray-700">
        You can still log in to your dashboard to resolve the issue. Once
        resolved, contact support or request an unsuspension from your
        dashboard.
      </Text>

      <Hr className="border-gray-200 my-[24px]" />

      <Text className="text-[12px] text-gray-500 m-0">
        © 2025 Court+. All rights reserved.
      </Text>
    </BaseEmail>
  );
}
