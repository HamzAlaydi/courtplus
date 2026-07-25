import * as React from 'react';
import { Button, Heading, Hr, Section, Text } from '@react-email/components';
import { BaseEmail } from './components/base-email';

export function BookingCancellationEmail({
  bookingId,
  courtName,
  branchName,
  originalDate,
  originalTime,
  cancelledBy,
  cancellationReason,
  refundStatus,
  contactPerson,
  contactPhone,
  contactEmail,
}: {
  bookingId: string;
  courtName: string;
  branchName: string;
  originalDate: string;
  originalTime: string;
  cancelledBy: string;
  cancellationReason: string;
  refundStatus: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
}) {
  return (
    <BaseEmail preview={`A booking has been cancelled`}>
      <Heading className="text-[24px] font-bold text-center text-red-600 my-[16px]">
        BOOKING CANCELLATION NOTICE
      </Heading>

      <Text className="text-[16px] text-gray-700 mb-[24px]">
        A booking scheduled at your branch has been cancelled. Please take
        appropriate actions to notify staff and prepare for any necessary
        adjustments.
      </Text>

      <Section className="bg-gray-50 rounded-[8px] p-[16px] mb-[24px]">
        <Heading className="text-[18px] font-bold text-gray-800 mt-0 mb-[16px]">
          Cancelled Booking Details
        </Heading>

        <Text className="text-[14px] text-gray-700 my-[4px]">
          <strong>Court:</strong> {courtName}
        </Text>
        <Text className="text-[14px] text-gray-700 my-[4px]">
          <strong>Branch:</strong> {branchName}
        </Text>
        <Text className="text-[14px] text-gray-700 my-[4px]">
          <strong>Original Date:</strong> {originalDate}
        </Text>
        <Text className="text-[14px] text-gray-700 my-[4px]">
          <strong>Original Time:</strong> {originalTime}
        </Text>
        <Text className="text-[14px] text-gray-700 my-[4px]">
          <strong>Cancelled By:</strong> {cancelledBy}
        </Text>
        <Text className="text-[14px] text-gray-700 my-[4px]">
          <strong>Reason:</strong> {cancellationReason}
        </Text>
        <Text className="text-[14px] text-gray-700 my-[4px]">
          <strong>Refund Status:</strong> {refundStatus}
        </Text>
      </Section>

      <Section className="bg-yellow-50 rounded-[8px] p-[16px] mb-[24px]">
        <Heading className="text-[18px] font-bold text-gray-800 mt-0 mb-[16px]">
          Required Actions
        </Heading>

        <Text className="text-[14px] text-gray-700 my-[4px]">
          1. Notify any on-site staff about the cancellation
        </Text>
        <Text className="text-[14px] text-gray-700 my-[4px]">
          3. Remove any booking-specific equipment or signage
        </Text>
        <Text className="text-[14px] text-gray-700 my-[4px]">
          4. Direct any player inquiries to the contact person below
        </Text>
      </Section>

      <Section className="bg-gray-50 rounded-[8px] p-[16px] mb-[24px]">
        <Heading className="text-[18px] font-bold text-gray-800 mt-0 mb-[16px]">
          Contact Information
        </Heading>

        <Text className="text-[14px] text-gray-700 my-[4px]">
          <strong>Contact Person:</strong> {contactPerson}
        </Text>
        <Text className="text-[14px] text-gray-700 my-[4px]">
          <strong>Phone:</strong> {contactPhone}
        </Text>
        <Text className="text-[14px] text-gray-700 my-[4px]">
          <strong>Email:</strong> {contactEmail}
        </Text>
      </Section>

      <Text className="text-[16px] text-gray-700 mb-[24px]">
        The court is now available for rebooking.
      </Text>

      <Button
        className="bg-blue-600 text-white font-bold py-[12px] px-[20px] rounded-[4px] no-underline text-center block box-border"
        href={`https://dashboard.courtplusapp.com/bookings/${bookingId}`}
      >
        View Booking Details
      </Button>

      <Hr className="border border-solid border-gray-200 my-[24px]" />

      <Text className="text-[12px] text-gray-500 text-center m-0">
        This is an urgent notification from Court+.
      </Text>
      <Text className="text-[12px] text-gray-500 text-center m-0">
        © 2025 Court+. All rights reserved.
      </Text>
      <Text className="text-[12px] text-gray-500 text-center m-0">
        Address: to be added
      </Text>
    </BaseEmail>
  );
}
