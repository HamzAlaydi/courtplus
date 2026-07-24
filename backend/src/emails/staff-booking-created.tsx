import * as React from 'react';
import { Button, Heading, Hr, Section, Text } from '@react-email/components';
import { BaseEmail } from './components/base-email';

export interface BookingCreatedEmailProps {
  bookingId: string;
  courtName: string;
  branchName: string;
  date: string;
  startTime: string;
  endTime: string;
  numberOfPeople: number;
  additionalNotes?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  paymentStatus: string;
  paymentAmount: string;
}

export function BookingCreatedEmail({
  bookingId,
  courtName,
  branchName,
  date,
  startTime,
  endTime,
  numberOfPeople,
  additionalNotes,
  customerName,
  customerPhone,
  customerEmail,
  paymentStatus,
  paymentAmount,
}: BookingCreatedEmailProps) {
  return (
    <BaseEmail preview={`A new booking has been created`}>
      <Heading className="text-[24px] font-bold text-center text-gray-800 my-[16px]">
        New Court Booking Notification
      </Heading>

      <Text className="text-[16px] text-gray-700 mb-[24px]">
        A new booking has been made for a court at your branch. Please review
        the details below:
      </Text>

      <Section className="bg-gray-50 rounded-[8px] p-[16px] mb-[24px]">
        <Heading className="text-[18px] font-bold text-gray-800 mt-0 mb-[16px]">
          Booking Details
        </Heading>

        <Text className="text-[14px] text-gray-700 my-[4px]">
          <strong>Booking ID:</strong> {bookingId}
        </Text>
        <Text className="text-[14px] text-gray-700 my-[4px]">
          <strong>Court:</strong> {courtName}
        </Text>
        <Text className="text-[14px] text-gray-700 my-[4px]">
          <strong>Branch:</strong> {branchName}
        </Text>
        <Text className="text-[14px] text-gray-700 my-[4px]">
          <strong>Date:</strong> {date}
        </Text>
        <Text className="text-[14px] text-gray-700 my-[4px]">
          <strong>Time:</strong> {startTime} - {endTime}
        </Text>
        <Text className="text-[14px] text-gray-700 my-[4px]">
          <strong>Number of People:</strong> {numberOfPeople}
        </Text>
        <Text className="text-[14px] text-gray-700 my-[4px]">
          <strong>Payment Status:</strong> {paymentStatus}
        </Text>
        <Text className="text-[14px] text-gray-700 my-[4px]">
          <strong>Amount:</strong> {paymentAmount}
        </Text>
      </Section>

      <Section className="bg-gray-50 rounded-[8px] p-[16px] mb-[24px]">
        <Heading className="text-[18px] font-bold text-gray-800 mt-0 mb-[16px]">
          Customer Information
        </Heading>

        <Text className="text-[14px] text-gray-700 my-[4px]">
          <strong>Name:</strong> {customerName}
        </Text>
        <Text className="text-[14px] text-gray-700 my-[4px]">
          <strong>Phone:</strong> {customerPhone}
        </Text>
        <Text className="text-[14px] text-gray-700 my-[4px]">
          <strong>Email:</strong> {customerEmail}
        </Text>
        <Text className="text-[14px] text-gray-700 my-[4px]">
          <strong>Additional Notes:</strong> {additionalNotes}
        </Text>
      </Section>

      <Text className="text-[16px] text-gray-700 mb-[24px]">
        Please ensure the court is prepared and ready for the customer's
        arrival.
      </Text>

      <Button
        className="bg-blue-600 text-white font-bold py-[12px] px-[20px] rounded-[4px] no-underline text-center block box-border"
        href={`https://dashboard.courtplusapp.com/bookings/${bookingId}`}
      >
        View Booking Details
      </Button>

      <Hr className="border border-solid border-gray-200 my-[24px]" />

      <Text className="text-[12px] text-gray-500 text-center m-0">
        This is an automated notification from CourtPlus System.
      </Text>
      <Text className="text-[12px] text-gray-500 text-center m-0">
        © 2025 CourtPlus. All rights reserved.
      </Text>
      <Text className="text-[12px] text-gray-500 text-center m-0">
        Address: to be added
      </Text>
    </BaseEmail>
  );
}
