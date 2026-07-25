import * as React from 'react';
import { Button, Heading, Hr, Section, Text } from '@react-email/components';
import { BaseEmail } from './components/base-email';

export interface BookingJoinRequestApprovedEmailProps {
  courtName: string;
  branchName: string;
  branchAddress?: string;
  date: string;
  startTime: string;
  endTime: string;
  sportType: string;
  bookingId: string;
}

export function BookingJoinRequestApprovedEmail({
  courtName,
  branchName,
  branchAddress,
  date,
  startTime,
  endTime,
  sportType,
  bookingId,
}: BookingJoinRequestApprovedEmailProps) {
  return (
    <BaseEmail preview="Your join request has been approved!">
      <Heading className="text-[24px] font-bold text-center text-green-600 my-[16px]">
        Request Approved!
      </Heading>

      <Text className="text-[16px] text-gray-700 mb-[24px]">
        Great news! Your request to join the {sportType} session has been approved.
        See you on the court!
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
        {branchAddress && (
          <Text className="text-[14px] text-gray-700 my-[4px]">
            <strong>Address:</strong> {branchAddress}
          </Text>
        )}
        <Text className="text-[14px] text-gray-700 my-[4px]">
          <strong>Date:</strong> {date}
        </Text>
        <Text className="text-[14px] text-gray-700 my-[4px]">
          <strong>Time:</strong> {startTime} - {endTime}
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

export default BookingJoinRequestApprovedEmail;
