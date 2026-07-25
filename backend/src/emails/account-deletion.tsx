import * as React from 'react';
import { Container, Heading, Hr, Section, Text } from '@react-email/components';
import { BaseEmail } from './components/base-email';

export function AccountDeletionEmail({
  name,
  otp,
}: {
  name: string;
  otp: string;
}) {
  return (
    <BaseEmail preview={`Confirm your account deletion with code: ${otp}`}>
      <Heading className="text-[24px] font-bold text-center text-black my-[30px]">
        Confirm Account Deletion
      </Heading>

      <Text className="text-[16px] text-gray-700 mb-[24px]">
        Hi {name}, we received a request to permanently delete your account.
        Please use the code below to confirm the deletion:
      </Text>

      <Section className="text-center my-[32px]">
        <Container className="bg-gray-50 rounded-[8px] py-[16px] px-[24px] inline-block border-[1px] border-gray-200">
          <Text className="text-[32px] font-bold tracking-[5px] text-black m-0 text-center">
            {otp}
          </Text>
        </Container>
      </Section>

      <Text className="text-[16px] text-gray-700 mb-[12px]">
        This code will expire in 10 minutes. If you didn't request this,
        please ignore this email and your account will remain active.
      </Text>

      <Text className="text-[16px] text-gray-700 mb-[32px]">
        Need help? Contact our support team at support@courtplusapp.com
      </Text>

      <Hr className="border-gray-200 my-[24px]" />

      <Text className="text-[14px] text-gray-500 text-center m-0">
        © {new Date().getFullYear()} Court+. All rights reserved.
      </Text>
      <Text className="text-[14px] text-gray-500 text-center m-0">
        Jeddah, Saudi Arabia
      </Text>
    </BaseEmail>
  );
}
