import * as React from 'react';
import { Heading, Hr, Section, Text } from '@react-email/components';
import { BaseEmail } from './components/base-email';

export interface BookingJoinRequestRejectedEmailProps {
  courtName: string;
  branchName: string;
  date: string;
  startTime: string;
  endTime: string;
  sportType: string;
  rejectionReason?: string;
}

export function BookingJoinRequestRejectedEmail({
  courtName,
  branchName,
  date,
  startTime,
  endTime,
  sportType,
  rejectionReason,
}: BookingJoinRequestRejectedEmailProps) {
  return (
    <BaseEmail preview="Your join request was not approved">
      <Heading className="text-[24px] font-bold text-center text-gray-800 my-[16px]">
        Join Request Not Approved
      </Heading>

      <Text className="text-[16px] text-gray-700 mb-[24px]">
        Unfortunately, your request to join the {sportType} session was not approved.
        Don't worry - there are plenty of other games to join!
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

      {rejectionReason && (
        <Section className="bg-yellow-50 rounded-[8px] p-[16px] mb-[24px]">
          <Text className="text-[14px] text-gray-700 my-[4px]">
            <strong>Reason:</strong> {rejectionReason}
          </Text>
        </Section>
      )}

      <Text className="text-[16px] text-gray-700 mb-[24px]">
        Browse open bookings in the app to find another game to join.
      </Text>

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

export default BookingJoinRequestRejectedEmail;
