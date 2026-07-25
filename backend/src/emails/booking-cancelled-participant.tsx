import * as React from 'react';
import { Heading, Hr, Section, Text } from '@react-email/components';
import { BaseEmail } from './components/base-email';

export interface BookingCancelledParticipantEmailProps {
  courtName: string;
  branchName: string;
  date: string;
  startTime: string;
  endTime: string;
  sportType: string;
  cancelledByName?: string;
  cancellationReason?: string;
}

export function BookingCancelledParticipantEmail({
  courtName,
  branchName,
  date,
  startTime,
  endTime,
  sportType,
  cancelledByName,
  cancellationReason,
}: BookingCancelledParticipantEmailProps) {
  return (
    <BaseEmail preview="Your booking has been cancelled">
      <Heading className="text-[24px] font-bold text-center text-red-600 my-[16px]">
        Booking Cancelled
      </Heading>

      <Text className="text-[16px] text-gray-700 mb-[24px]">
        We're sorry to inform you that the following booking has been cancelled
        {cancelledByName ? ` by ${cancelledByName}` : ''}.
      </Text>

      <Section className="bg-red-50 border-l-[4px] border-red-500 rounded-[8px] p-[16px] mb-[24px]">
        <Text className="text-[16px] font-bold text-red-600 my-[4px]">
          Cancelled Booking Details
        </Text>
        <Text className="text-[14px] text-gray-700 my-[4px]">
          <strong>Sport:</strong> {sportType}
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

      {cancellationReason && (
        <Section className="bg-gray-50 rounded-[8px] p-[16px] mb-[24px]">
          <Text className="text-[14px] text-gray-700 my-[4px]">
            <strong>Reason:</strong> {cancellationReason}
          </Text>
        </Section>
      )}

      <Text className="text-[16px] text-gray-700 mb-[24px]">
        If you made a payment for this booking, a refund will be processed according
        to our refund policy. You can check your payment status in the app.
      </Text>

      <Text className="text-[16px] text-gray-700 mb-[24px]">
        We hope to see you on the court soon!
      </Text>

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

export default BookingCancelledParticipantEmail;
