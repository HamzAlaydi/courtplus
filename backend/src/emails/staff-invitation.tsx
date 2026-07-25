import * as React from 'react';
import { Button, Heading, Hr, Section, Text } from '@react-email/components';
import { BaseEmail } from './components/base-email';

export function StaffInvitationEmail({
  invitationLink,
  tenantName,
}: {
  invitationLink: string;
  tenantName: string;
}) {
  return (
    <BaseEmail preview={`You're invited to join ${tenantName}`}>
      <Heading className="text-[24px] font-bold text-gray-800 m-0 mb-[24px]">
        You're invited to join {tenantName}
      </Heading>

      <Text className="text-[16px] leading-[24px] text-gray-600 mb-[24px]">
        Hello,
      </Text>

      <Text className="text-[16px] leading-[24px] text-gray-600 mb-[24px]">
        We're excited to invite you to join our team as a staff member in our
        sports courts management platform. Your expertise will be valuable in
        helping us deliver exceptional service to our clients.
      </Text>

      <Text className="text-[16px] leading-[24px] text-gray-600 mb-[32px]">
        With our platform, you'll be able to:
      </Text>

      <ul className="list-disc pl-[24px] mb-[32px]">
        <li className="text-[16px] leading-[24px] text-gray-600 m-0">
          Manage court bookings and schedules
        </li>

        <li className="text-[16px] leading-[24px] text-gray-600 m-0">
          Handle customer inquiries and payments
        </li>
        <li className="text-[16px] leading-[24px] text-gray-600 m-0">
          Generate reports and analytics
        </li>
      </ul>

      <Section className="text-center mb-[32px]">
        <Button
          className="bg-blue-600 rounded-[4px] text-white font-bold text-[16px] px-[24px] py-[12px] no-underline text-center box-border"
          href={invitationLink}
        >
          Accept Invitation
        </Button>
      </Section>

      <Text className="text-[16px] leading-[24px] text-gray-600 mb-[24px]">
        This invitation link will expire in 7 days. If you have any questions,
        please don't hesitate to reach out.
      </Text>

      <Text className="text-[16px] leading-[24px] text-gray-600 mb-[32px]">
        We look forward to having you on our team!
      </Text>

      <Text className="text-[16px] leading-[24px] text-gray-600">
        Best regards,
        <br />
        The {tenantName} Team
      </Text>

      <Hr className="border-gray-200 my-[32px]" />

      <Text className="text-[14px] leading-[20px] text-gray-500 m-0">
        If you weren't expecting this invitation, you can safely ignore this
        email.
      </Text>

      <Text className="text-[14px] leading-[20px] text-gray-400 m-0">
        © {new Date().getFullYear()} Court+. All rights reserved.
      </Text>

      <Text className="text-[14px] leading-[20px] text-gray-400 m-0">
        Jeddah, Saudi Arabia
      </Text>
    </BaseEmail>
  );
}
