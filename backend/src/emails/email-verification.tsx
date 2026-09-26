import * as React from 'react';
import { Container, Heading, Hr, Section, Text } from '@react-email/components';
import { BaseEmail } from './components/base-email';
import { VERIFICATION_CODE_TTL_MINUTES } from 'src/modules/auth/verification.constants';

export function EmailVerificationEmail({
  name,
  otp,
  expiresInMinutes = VERIFICATION_CODE_TTL_MINUTES,
}: {
  name: string;
  otp: string;
  expiresInMinutes?: number;
}) {
  return (
    <BaseEmail preview={`Verify your email with code: ${otp}`}>
      <Heading className="text-[24px] font-bold text-center text-black my-[30px]">
        Verify Your Email Address
      </Heading>

      <Text className="text-[16px] text-gray-700 mb-[24px]">
        Hi {name}, you recently requested to update your email address. To
        verify this email address, please enter the verification code below:
      </Text>

      <Section className="text-center my-[32px]">
        <Container className="bg-gray-50 rounded-[8px] py-[16px] px-[24px] inline-block border-[1px] border-gray-200">
          <Text className="text-[32px] font-bold tracking-[5px] text-black m-0 text-center">
            {otp}
          </Text>
        </Container>
      </Section>

      <Text className="text-[16px] text-gray-700 mb-[12px]">
        This code will expire in {expiresInMinutes} minutes. If you didn't request to update
        your email address, please ignore this email or contact support if you
        have concerns.
      </Text>

      <Text className="text-[16px] text-gray-700 mb-[32px]">
        Need help? Contact our support team at support@courtplusapp.com
      </Text>

      <Hr className="border-gray-200 my-[24px]" />

      <Text className="text-[14px] text-gray-500 text-center m-0">
        © {new Date().getFullYear()} Court+. All rights reserved.
      </Text>
    </BaseEmail>
  );
}
