import * as React from 'react';
import { Button, Heading, Hr, Section, Text } from '@react-email/components';
import { BaseEmail } from './components/base-email';

export interface BookingInvitationAcceptedEmailProps {
  acceptedByName: string;
  courtName: string;
  branchName: string;
  date: string;
  startTime: string;
  endTime: string;
  sportType: string;
  bookingId: string;
  currentParticipants: number;
  maxParticipants: number;
}

export function BookingInvitationAcceptedEmail({
  acceptedByName,
  courtName,
  branchName,
  date,
  startTime,
  endTime,
  sportType,
  bookingId,
  currentParticipants,
  maxParticipants,
}: BookingInvitationAcceptedEmailProps) {
  return (
    <BaseEmail preview={`${acceptedByName} accepted your booking invitation`}>
      <Heading className="text-[24px] font-bold text-center text-green-600 my-[16px]">
        Invitation Accepted!
      </Heading>

      <Text className="text-[16px] text-gray-700 mb-[24px]">
        <strong>{acceptedByName}</strong> has accepted your invitation to join
        the {sportType} session.
      </Text>

      <Section className="bg-green-50 border-l-[4px] border-green-500 rounded-[8px] p-[16px] mb-[24px]">
        <Text className="text-[16px] font-bold text-green-600 my-[4px]">
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
          <strong>Participants:</strong> {currentParticipants}/{maxParticipants}
        </Text>
      </Section>

      <Button
        className="bg-green-600 text-white font-bold py-[12px] px-[20px] rounded-[4px] no-underline text-center block box-border"
        href={`courtplus://bookings/${bookingId}`}
      >
        View Booking
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

export default BookingInvitationAcceptedEmail;
