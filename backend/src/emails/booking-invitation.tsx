import * as React from 'react';
import { Button, Heading, Hr, Section, Text } from '@react-email/components';
import { BaseEmail } from './components/base-email';

export interface BookingInvitationEmailProps {
  inviterName: string;
  courtName: string;
  branchName: string;
  date: string;
  startTime: string;
  endTime: string;
  sportType: string;
  bookingId: string;
}

export function BookingInvitationEmail({
  inviterName,
  courtName,
  branchName,
  date,
  startTime,
  endTime,
  sportType,
  bookingId,
}: BookingInvitationEmailProps) {
  return (
    <BaseEmail preview={`${inviterName} invited you to join a booking`}>
      <Heading className="text-[24px] font-bold text-center text-gray-800 my-[16px]">
        You've Been Invited!
      </Heading>

      <Text className="text-[16px] text-gray-700 mb-[24px]">
        <strong>{inviterName}</strong> has invited you to join a {sportType} session.
        Check out the details below and respond to the invitation.
      </Text>

      <Section className="bg-blue-50 border-l-[4px] border-blue-500 rounded-[8px] p-[16px] mb-[24px]">
        <Text className="text-[16px] font-bold text-blue-600 my-[4px]">
          Booking Details
        </Text>
        <Text className="text-[14px] text-gray-700 my-[4px]">
          <strong>Court:</strong> {courtName}
        </Text>
        <Text className="text-[14px] text-gray-700 my-[4px]">
          <strong>Location:</strong> {branchName}
        </Text>
        <Text className="text-[14px] text-gray-700 my-[4px]">
          <strong>Date:</strong> {date}
        </Text>
        <Text className="text-[14px] text-gray-700 my-[4px]">
          <strong>Time:</strong> {startTime} - {endTime}
        </Text>
        <Text className="text-[14px] text-gray-700 my-[4px]">
          <strong>Sport:</strong> {sportType}
        </Text>
      </Section>

      <Text className="text-[16px] text-gray-700 mb-[24px]">
        Open the app to accept or decline this invitation.
      </Text>

      <Button
        className="bg-blue-600 text-white font-bold py-[12px] px-[20px] rounded-[4px] no-underline text-center block box-border"
        href={`courtplus://bookings/${bookingId}`}
      >
        View Invitation
      </Button>

      <Hr className="border border-solid border-gray-200 my-[24px]" />

      <Text className="text-[12px] text-gray-500 text-center m-0">
        This is an automated notification from Court+.
      </Text>
      <Text className="text-[12px] text-gray-500 text-center m-0">
        © 2025 Court+. All rights reserved.
      </Text>
    </BaseEmail>
  );
}

export default BookingInvitationEmail;
