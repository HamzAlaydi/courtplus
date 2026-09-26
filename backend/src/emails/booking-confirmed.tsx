import * as React from 'react';
import { Button, Heading, Hr, Section, Text } from '@react-email/components';
import { BaseEmail } from './components/base-email';

export interface BookingConfirmedEmailProps {
  customerName: string;
  courtName: string;
  branchName: string;
  branchAddress?: string;
  date: string;
  startTime: string;
  endTime: string;
  sportType: string;
  paymentAmount: string;
  currency: string;
  bookingId: string;
  mapsUrl?: string;
  /** True while the court is split across seats that are not all paid yet. */
  isSplit?: boolean;
  /** Seats the court price is divided by, shown so the split is explicable. */
  seats?: number;
}

/**
 * The receipt the paying customer gets. Until this existed only the venue was
 * emailed when a booking was made: the person who paid had an in-app
 * notification and nothing else — nothing to show at the gate, and no record
 * at all if they reinstalled the app.
 */
export function BookingConfirmedEmail({
  customerName,
  courtName,
  branchName,
  branchAddress,
  date,
  startTime,
  endTime,
  sportType,
  paymentAmount,
  currency,
  bookingId,
  mapsUrl,
  isSplit = false,
  seats,
}: BookingConfirmedEmailProps) {
  return (
    <BaseEmail
      preview={
        isSplit
          ? `Your seat at ${courtName} on ${date} is reserved`
          : `Your booking at ${courtName} on ${date} is confirmed`
      }
    >
      <Heading className="text-[24px] font-bold text-center text-gray-800 my-[16px]">
        {isSplit ? 'Your seat is reserved' : 'Your booking is confirmed'}
      </Heading>

      {isSplit ? (
        <Text className="text-[16px] text-gray-700 mb-[24px]">
          Thanks {customerName} — your seat in this {sportType} session is
          held. You are charged only your own share; the court is confirmed
          once every seat is paid.
        </Text>
      ) : (
        <Text className="text-[16px] text-gray-700 mb-[24px]">
          Thanks {customerName} — your {sportType} session is booked and paid.
          Keep this email; you can show it when you arrive.
        </Text>
      )}

      <Section className="bg-blue-50 border-l-[4px] border-blue-500 rounded-[8px] p-[16px] mb-[24px]">
        <Text className="text-[16px] font-bold text-blue-600 my-[4px]">
          Booking Details
        </Text>
        <Text className="text-[14px] text-gray-700 my-[4px]">
          <strong>Court:</strong> {courtName}
        </Text>
        <Text className="text-[14px] text-gray-700 my-[4px]">
          <strong>Venue:</strong> {branchName}
        </Text>
        {branchAddress ? (
          <Text className="text-[14px] text-gray-700 my-[4px]">
            <strong>Address:</strong> {branchAddress}
          </Text>
        ) : null}
        <Text className="text-[14px] text-gray-700 my-[4px]">
          <strong>Date:</strong> {date}
        </Text>
        <Text className="text-[14px] text-gray-700 my-[4px]">
          <strong>Time:</strong> {startTime} - {endTime}
        </Text>
        <Text className="text-[14px] text-gray-700 my-[4px]">
          <strong>{isSplit ? 'Your share' : 'Paid'}:</strong> {paymentAmount}{' '}
          {currency}
          {isSplit && seats ? ` (1 of ${seats} seats)` : ''}
        </Text>
        <Text className="text-[14px] text-gray-500 my-[4px]">
          <strong>Reference:</strong> {bookingId}
        </Text>
      </Section>

      {mapsUrl ? (
        <Button
          className="bg-gray-700 text-white font-bold py-[12px] px-[20px] rounded-[4px] no-underline text-center block box-border mb-[12px]"
          href={mapsUrl}
        >
          Get Directions
        </Button>
      ) : null}

      <Button
        className="bg-blue-600 text-white font-bold py-[12px] px-[20px] rounded-[4px] no-underline text-center block box-border"
        href={`courtplus://bookings/${bookingId}`}
      >
        View Booking
      </Button>

      <Text className="text-[14px] text-gray-600 mt-[24px] mb-[0px]">
        Need to cancel? You can do that in the app up to 12 hours before the
        start time.
      </Text>

      <Hr className="border border-solid border-gray-200 my-[24px]" />

      <Text className="text-[12px] text-gray-500 text-center m-0">
        This is an automated notification from Court+.
      </Text>
    </BaseEmail>
  );
}

export default BookingConfirmedEmail;
