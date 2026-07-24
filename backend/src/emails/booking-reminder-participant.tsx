import * as React from 'react';
import { Button, Heading, Hr, Section, Text } from '@react-email/components';
import { BaseEmail } from './components/base-email';

export interface BookingReminderParticipantEmailProps {
  courtName: string;
  branchName: string;
  branchAddress?: string;
  date: string;
  startTime: string;
  endTime: string;
  sportType: string;
  bookingId: string;
  reminderTime: string;
}

export function BookingReminderParticipantEmail({
  courtName,
  branchName,
  branchAddress,
  date,
  startTime,
  endTime,
  sportType,
  bookingId,
  reminderTime,
}: BookingReminderParticipantEmailProps) {
  return (
    <BaseEmail preview={`Your booking starts in ${reminderTime}`}>
      <Heading className="text-[24px] font-bold text-center text-blue-600 my-[16px]">
        Booking Reminder
      </Heading>

      <Text className="text-[16px] text-gray-700 mb-[24px]">
        Your {sportType} session is starting in <strong>{reminderTime}</strong>.
        Don't forget to arrive on time!
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

      <Section className="bg-yellow-50 rounded-[8px] p-[16px] mb-[24px]">
        <Heading className="text-[16px] font-bold text-gray-800 mt-0 mb-[8px]">
          Quick Checklist
        </Heading>
        <Text className="text-[14px] text-gray-700 my-[4px]">
          ✓ Sports gear and equipment
        </Text>
        <Text className="text-[14px] text-gray-700 my-[4px]">
          ✓ Water bottle
        </Text>
        <Text className="text-[14px] text-gray-700 my-[4px]">
          ✓ Comfortable sportswear
        </Text>
      </Section>

      <Button
        className="bg-blue-600 text-white font-bold py-[12px] px-[20px] rounded-[4px] no-underline text-center block box-border"
        href={`courtplus://bookings/${bookingId}`}
      >
        View Booking
      </Button>

      <Hr className="border border-solid border-gray-200 my-[24px]" />

      <Text className="text-[12px] text-gray-500 text-center m-0">
        This is an automated reminder from CourtPlus.
      </Text>
      <Text className="text-[12px] text-gray-500 text-center m-0">
        © 2025 CourtPlus. All rights reserved.
      </Text>
    </BaseEmail>
  );
}

export default BookingReminderParticipantEmail;
