import * as React from 'react';
import { Button, Heading, Hr, Section, Text } from '@react-email/components';
import { BaseEmail } from './components/base-email';

export interface BookingInvitationRejectedEmailProps {
  rejectedByName: string;
  courtName: string;
  branchName: string;
  date: string;
  startTime: string;
  endTime: string;
  sportType: string;
  bookingId: string;
}

export function BookingInvitationRejectedEmail({
  rejectedByName,
  courtName,
  branchName,
  date,
  startTime,
  endTime,
  sportType,
  bookingId,
}: BookingInvitationRejectedEmailProps) {
  return (
    <BaseEmail preview={`${rejectedByName} declined your booking invitation`}>
      <Heading className="text-[24px] font-bold text-center text-gray-800 my-[16px]">
        Invitation Declined
      </Heading>

      <Text className="text-[16px] text-gray-700 mb-[24px]">
        <strong>{rejectedByName}</strong> has declined your invitation to join
        the {sportType} session.
      </Text>

      <Section className="bg-gray-50 border-l-[4px] border-gray-400 rounded-[8px] p-[16px] mb-[24px]">
        <Text className="text-[16px] font-bold text-gray-600 my-[4px]">
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
      </Section>

      <Text className="text-[16px] text-gray-700 mb-[24px]">
        You can invite other players to fill the spot.
      </Text>

      <Button
        className="bg-blue-600 text-white font-bold py-[12px] px-[20px] rounded-[4px] no-underline text-center block box-border"
        href={`courtplus://bookings/${bookingId}`}
      >
        View Booking
      </Button>

      <Hr className="border border-solid border-gray-200 my-[24px]" />

      <Text className="text-[12px] text-gray-500 text-center m-0">
        This is an automated notification from CourtPlus.
      </Text>
      <Text className="text-[12px] text-gray-500 text-center m-0">
        © 2025 CourtPlus. All rights reserved.
      </Text>
    </BaseEmail>
  );
}

export default BookingInvitationRejectedEmail;
