import i18next from 'i18next';

i18next.init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: {
      translation: {
        emails: {
          forgot_password: 'Password Reset for CourtPlus',
          account_verification: 'Complete your CourtPlus account now',
          email_verification: 'Verify your email for CourtPlus',
          staff_booking_created: 'New booking has been created',
          staff_booking_reminder: 'A booking is starting soon',
          staff_booking_cancelled: 'A booking has been cancelled',
          review_added: 'New review for your court',
          staff_invitation: 'CourtPlus Staff Invitation',
          booking_invitation: "You've been invited to join a booking",
          booking_reminder_participant: 'Your booking is starting soon',
          booking_cancelled_participant: 'Your booking has been cancelled',
          booking_join_request_submitted: 'New join request for your booking',
          booking_join_request_approved: 'Your join request was approved',
          booking_join_request_rejected: 'Your join request was not approved',
          booking_invitation_accepted: 'Your invitation was accepted',
          booking_invitation_rejected: 'Your invitation was declined',
        },
        notifications: {
          booking_cancelled: {
            title: 'Booking Cancelled',
            content: 'Your booking has been cancelled',
          },
          follow: {
            title: 'New Follower',
            content:
              '{{user.firstName}} {{user.lastName}} started following you',
          },
          review_added: {
            title: 'New Review',
            content: 'A new review has been added for your court',
          },
          booking_reminder: {
            title: 'Booking Reminder',
            content: 'Your booking starts in {{time}}',
          },
          booking_invitation_accepted: {
            title: 'Invitation Accepted',
            content: '{{name}} accepted your booking invitation',
          },
          booking_invitation_rejected: {
            title: 'Invitation Declined',
            content: '{{name}} declined your booking invitation',
          },
          booking_invitation: {
            title: 'Booking Invitation',
            content: '{{name}} invited you to join a booking',
          },
          booking_entered: {
            title: 'Booking Started',
            content: '{{name}} entered the booking',
          },
          booking_joined: {
            title: 'Someone Joined',
            content: '{{name}} joined your booking',
          },
          post_like: {
            title: 'Post Liked',
            content: '{{user.firstName}} {{user.lastName}} liked your post',
          },
          booking_created: {
            title: 'New Booking',
            content: 'New booking created at {{court}}',
          },
          moment_posted: {
            title: 'Moment Posted',
            content: '{{name}} posted a moment from your booking',
          },
          report_created: {
            title: 'Report Submitted',
            content: 'A report has been submitted for review',
          },
          payment_failed: {
            title: 'Payment Failed',
            content: 'Your payment could not be processed',
          },
          payment_succeeded: {
            title: 'Payment Successful',
            content: 'Your payment has been processed successfully',
          },
          refund_succeeded: {
            title: 'Refund Processed',
            content: 'Your refund has been processed',
          },
          refund_failed: {
            title: 'Refund Failed',
            content: 'Your refund could not be processed',
          },
          payment_released: {
            title: 'Payment Released',
            content: 'Your payment has been released',
          },
          booking_join_request_submitted: {
            title: 'Join Request Submitted',
            content: 'Your request to join the booking has been submitted',
          },
          booking_join_request_approved: {
            title: 'Join Request Approved',
            content: 'Your request to join the booking has been approved',
          },
          booking_join_request_rejected: {
            title: 'Join Request Rejected',
            content: 'Your request to join the booking has been rejected',
          },
          booking_participant_removed: {
            title: 'Removed from Booking',
            content: 'You have been removed from the booking',
          },
          booking_participant_added: {
            title: 'Added to Booking',
            content: 'You have been added to a booking',
          },
          booking_participant_cancelled: {
            title: 'Participant Cancelled',
            content: '{{name}} cancelled their participation in your booking',
          },
          booking_started: {
            title: 'Booking Started',
            content: 'Your booking has started',
          },
          booking_ended: {
            title: 'Booking Ended',
            content: 'Your booking has ended',
          },
        },
      },
    },
    ar: {
      translation: {
        emails: {
          forgot_password: 'إعادة تعيين كلمة المرور لـ CourtPlus',
          account_verification: 'أكمل حسابك في CourtPlus الآن',
          email_verification: 'تحقق من بريدك الإلكتروني لـ CourtPlus',
          staff_booking_created: 'تم إنشاء حجز جديد',
          staff_booking_reminder: 'حجز سيبدأ قريباً',
          staff_booking_cancelled: 'تم إلغاء حجز',
          review_added: 'تقييم جديد لملعبك',
          staff_invitation: 'دعوة موظف CourtPlus',
          booking_invitation: 'تمت دعوتك للانضمام إلى حجز',
          booking_reminder_participant: 'حجزك سيبدأ قريباً',
          booking_cancelled_participant: 'تم إلغاء حجزك',
          booking_join_request_submitted: 'طلب انضمام جديد لحجزك',
          booking_join_request_approved: 'تم قبول طلب انضمامك',
          booking_join_request_rejected: 'لم يتم قبول طلب انضمامك',
          booking_invitation_accepted: 'تم قبول دعوتك',
          booking_invitation_rejected: 'تم رفض دعوتك',
        },
        notifications: {
          booking_cancelled: {
            title: 'إلغاء الحجز',
            content: 'تم إلغاء حجزك',
          },
          follow: {
            title: 'متابع جديد',
            content: '{{user.firstName}} {{user.lastName}} بدأ بمتابعتك',
          },
          review_added: {
            title: 'تقييم جديد',
            content: 'تم إضافة تقييم جديد لملعبك',
          },
          booking_reminder: {
            title: 'تذكير الحجز',
            content: 'يبدأ حجزك خلال {{time}}',
          },
          booking_invitation_accepted: {
            title: 'قبول الدعوة',
            content: '{{name}} قبل دعوة الحجز الخاصة بك',
          },
          booking_invitation_rejected: {
            title: 'رفض الدعوة',
            content: '{{name}} رفض دعوة الحجز الخاصة بك',
          },
          booking_invitation: {
            title: 'دعوة الحجز',
            content: '{{name}} دعاك للانضمام إلى حجز',
          },
          booking_entered: {
            title: 'بدء الحجز',
            content: '{{name}} دخل إلى الحجز',
          },
          booking_joined: {
            title: 'انضمام شخص',
            content: '{{name}} انضم إلى حجزك',
          },
          post_like: {
            title: 'إعجاب بالمنشور',
            content: '{{user.firstName}} {{user.lastName}} أعجب بمنشورك',
          },
          booking_created: {
            title: 'حجز جديد',
            content: 'تم إنشاء حجز جديد في {{court}}',
          },
          moment_posted: {
            title: 'نشر لحظة',
            content: '{{name}} نشر لحظة من حجزك',
          },
          report_created: {
            title: 'تقرير مقدم',
            content: 'تم تقديم تقرير للمراجعة',
          },
          payment_failed: {
            title: 'فشل في الدفع',
            content: 'لا يمكن معالجة دفعتك',
          },
          payment_succeeded: {
            title: 'الدفع ناجح',
            content: 'تم معالجة دفعتك بنجاح',
          },
          refund_succeeded: {
            title: 'تم معالجة الاسترداد',
            content: 'تم معالجة استردادك',
          },
          refund_failed: {
            title: 'فشل الاسترداد',
            content: 'لا يمكن معالجة استردادك',
          },
          payment_released: {
            title: 'تم تحرير الدفعة',
            content: 'تم تحرير دفعتك',
          },
          booking_join_request_submitted: {
            title: 'تم تقديم طلب الانضمام',
            content: 'تم تقديم طلبك للانضمام إلى الحجز',
          },
          booking_join_request_approved: {
            title: 'تم قبول طلب الانضمام',
            content: 'تم قبول طلبك للانضمام إلى الحجز',
          },
          booking_join_request_rejected: {
            title: 'تم رفض طلب الانضمام',
            content: 'تم رفض طلبك للانضمام إلى الحجز',
          },
          booking_participant_removed: {
            title: 'تمت إزالتك من الحجز',
            content: 'تمت إزالتك من الحجز',
          },
          booking_participant_added: {
            title: 'تمت إضافتك إلى حجز',
            content: 'تمت إضافتك إلى حجز',
          },
          booking_participant_cancelled: {
            title: 'إلغاء مشارك',
            content: '{{name}} ألغى مشاركته في حجزك',
          },
          booking_started: {
            title: 'بدأ الحجز',
            content: 'بدأ حجزك',
          },
          booking_ended: {
            title: 'انتهى الحجز',
            content: 'انتهى حجزك',
          },
        },
      },
    },
  },
});

export { i18next };
