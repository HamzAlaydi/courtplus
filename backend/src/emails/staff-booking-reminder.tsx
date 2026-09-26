import * as React from 'react';
import { Button, Heading, Hr, Section, Text } from '@react-email/components';
import { BaseEmail } from './components/base-email';

export function BookingReminderEmail({
  bookingId,
  courtName,
  branchName,
  inTime,
  date,
  startTime,
  endTime,
  // The reminder job only sends the booking/court/branch/time fields, so every
  // other prop arrives undefined. Without these defaults the array props were
  // dereferenced (`.join` / `.map`) and rendering the e-mail threw, which meant
  // the staff reminder was never delivered.
  teamsInvolved = [],
  expectedAttendees,
  staffAssigned = [],
  specialRequirements = '',
  contactPerson = '',
  contactPhone = '',
  contactEmail = '',
  setupTime = '',
}: {
  bookingId: string;
  courtName: string;
  branchName: string;
  inTime: string;
  date: string;
  startTime: string;
  endTime: string;
  teamsInvolved?: string[];
  expectedAttendees?: number;
  staffAssigned?: string[];
  specialRequirements?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  setupTime?: string;
}) {
  return (
    <BaseEmail preview={`A booking is coming up in 3 days`}>
      <Heading className="text-[24px] font-bold text-center text-blue-600 my-[16px]">
        UPCOMING BOOKING REMINDER
      </Heading>

      <Text className="text-[16px] text-gray-700 mb-[24px]">
        This is a reminder about an upcoming booking scheduled at your branch in{' '}
        <strong>{inTime}</strong>. Please review the details and ensure all
        preparations are complete.
      </Text>

      <Section className="bg-blue-50 border-l-[4px] border-blue-500 rounded-[8px] p-[16px] mb-[24px]">
        <Text className="text-[16px] font-bold text-blue-600 my-[4px]">
          Booking Details
        </Text>
        <Text className="text-[14px] text-gray-700 my-[4px]">
          <strong>Date:</strong> {date}
        </Text>
        <Text className="text-[14px] text-gray-700 my-[4px]">
          <strong>Time:</strong> {startTime} - {endTime}
        </Text>
      </Section>

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
        {teamsInvolved.length > 0 && (
          <Text className="text-[14px] text-gray-700 my-[4px]">
            <strong>Teams:</strong> {teamsInvolved.join(' vs ')}
          </Text>
        )}
        {expectedAttendees !== undefined && (
          <Text className="text-[14px] text-gray-700 my-[4px]">
            <strong>Expected Attendees:</strong> {expectedAttendees}
          </Text>
        )}
        {setupTime && (
          <Text className="text-[14px] text-gray-700 my-[4px]">
            <strong>Setup Time:</strong> {setupTime} (Please ensure court is
            ready by this time)
          </Text>
        )}
      </Section>

      {staffAssigned.length > 0 && (
        <Section className="bg-green-50 rounded-[8px] p-[16px] mb-[24px]">
          <Heading className="text-[18px] font-bold text-gray-800 mt-0 mb-[16px]">
            Staff Assigned
          </Heading>

          {staffAssigned.map((staff, index) => (
            <Text key={index} className="text-[14px] text-gray-700 my-[4px]">
              • {staff}
            </Text>
          ))}
        </Section>
      )}

      <Section className="bg-yellow-50 rounded-[8px] p-[16px] mb-[24px]">
        <Heading className="text-[18px] font-bold text-gray-800 mt-0 mb-[16px]">
          Preparation Checklist
        </Heading>

        <Text className="text-[14px] text-gray-700 my-[4px]">
          □ Court cleaned and marked properly
        </Text>
        <Text className="text-[14px] text-gray-700 my-[4px]">
          □ Equipment checked and ready
        </Text>
        <Text className="text-[14px] text-gray-700 my-[4px]">
          □ Staff briefed on their roles
        </Text>
        <Text className="text-[14px] text-gray-700 my-[4px]">
          □ Changing rooms prepared
        </Text>
        <Text className="text-[14px] text-gray-700 my-[4px]">
          □ Refreshment arrangements confirmed
        </Text>
        <Text className="text-[14px] text-gray-700 my-[4px]">
          □ First aid kit checked and available
        </Text>
      </Section>

      {specialRequirements && (
        <Section className="bg-gray-50 rounded-[8px] p-[16px] mb-[24px]">
          <Heading className="text-[18px] font-bold text-gray-800 mt-0 mb-[16px]">
            Special Requirements
          </Heading>

          <Text className="text-[14px] text-gray-700 my-[8px]">
            {specialRequirements}
          </Text>
        </Section>
      )}

      {(contactPerson || contactPhone || contactEmail) && (
        <Section className="bg-gray-50 rounded-[8px] p-[16px] mb-[24px]">
          <Heading className="text-[18px] font-bold text-gray-800 mt-0 mb-[16px]">
            Contact Information
          </Heading>

          {contactPerson && (
            <Text className="text-[14px] text-gray-700 my-[4px]">
              <strong>Event Coordinator:</strong> {contactPerson}
            </Text>
          )}
          {contactPhone && (
            <Text className="text-[14px] text-gray-700 my-[4px]">
              <strong>Phone:</strong> {contactPhone}
            </Text>
          )}
          {contactEmail && (
            <Text className="text-[14px] text-gray-700 my-[4px]">
              <strong>Email:</strong> {contactEmail}
            </Text>
          )}
        </Section>
      )}

      <Text className="text-[16px] text-gray-700 mb-[24px]">
        Please confirm that all preparations are on track by responding to this
        email or updating the booking status in the system.
      </Text>

      <Button
        className="bg-blue-600 text-white font-bold py-[12px] px-[20px] rounded-[4px] no-underline text-center block box-border"
        href={`https://dashboard.courtplusapp.com/bookings/${bookingId}`}
      >
        View Booking Details
      </Button>

      <Hr className="border border-solid border-gray-200 my-[24px]" />

      <Text className="text-[12px] text-gray-500 text-center m-0">
        This is an automated reminder from Court+.
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

export default BookingReminderEmail;
