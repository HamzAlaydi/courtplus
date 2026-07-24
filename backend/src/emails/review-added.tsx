import * as React from 'react';
import { Button, Hr, Section, Text } from '@react-email/components';
import { BaseEmail } from './components/base-email';

export function ReviewAddedEmail({
  staffName,
  branchName,
  courtName,
  reviewerName,
  rating,
  reviewDate,
  reviewComment,
  reviewId,
}: {
  staffName: string;
  branchName: string;
  courtName: string;
  reviewerName: string;
  rating: number;
  reviewDate: string;
  reviewComment: string;
  reviewId: string;
}) {
  const starDisplay =
    '★'.repeat(Math.floor(rating)) +
    (rating % 1 ? '½' : '') +
    '☆'.repeat(5 - Math.ceil(rating));

  return (
    <BaseEmail
      preview={`New review for ${courtName} at ${branchName} branch`}
      title="New Court Review Alert"
    >
      <Text>Hello {staffName},</Text>

      <Text className="text-[16px] text-gray-700 mb-[16px]">
        A user has submitted a new review for a sport court at your branch. Here
        are the details:
      </Text>

      <Section className="bg-gray-50 rounded-[8px] p-[16px] mb-[24px]">
        <Text className="text-[16px] font-bold text-gray-800 m-0">
          Review Details
        </Text>
        <Hr className="border-gray-200 my-[12px]" />

        <Text className="text-[15px] text-gray-700 m-0">
          <strong>Branch:</strong> {branchName}
        </Text>
        <Text className="text-[15px] text-gray-700 m-0">
          <strong>Court:</strong> {courtName}
        </Text>
        <Text className="text-[15px] text-gray-700 m-0">
          <strong>Reviewer:</strong> {reviewerName}
        </Text>
        <Text className="text-[15px] text-gray-700 m-0">
          <strong>Rating:</strong> {starDisplay} ({rating}/5)
        </Text>
        <Text className="text-[15px] text-gray-700 m-0">
          <strong>Date:</strong> {reviewDate}
        </Text>
        <Text className="text-[15px] text-gray-700 mt-[12px] mb-0">
          <strong>Comment:</strong>
        </Text>
        <Text className="text-[15px] text-gray-700 italic bg-white p-[12px] rounded-[4px] border-l-[4px] border-blue-500 m-0">
          "{reviewComment}"
        </Text>
      </Section>

      <Button
        className="bg-blue-600 text-white rounded-[4px] py-[12px] px-[20px] text-[14px] font-bold no-underline text-center block box-border"
        href={`https://courtplusapp.com/reviews/${reviewId}`}
      >
        View Review Details
      </Button>

      <Text className="text-[15px] text-gray-700 mt-[24px]">
        Please respond to this review if necessary and address any concerns
        mentioned by the user.
      </Text>

      <Text className="text-[15px] text-gray-700">
        Thank you for maintaining our high standards of service!
      </Text>

      <Hr className="border-gray-200 my-[24px]" />

      <Text className="text-[12px] text-gray-500 m-0">
        © 2025 CourtPlus. All rights reserved.
      </Text>
      <Text className="text-[12px] text-gray-500 m-0">
        Address: to be added
      </Text>
    </BaseEmail>
  );
}
