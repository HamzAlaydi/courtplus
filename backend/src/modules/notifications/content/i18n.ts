import i18next from 'i18next';

i18next.init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: {
      translation: {
        emails: {
          forgot_password: 'Password Reset for Court+',
          account_verification: 'Complete your Court+ account now',
          email_verification: 'Verify your email for Court+',
          staff_booking_created: 'New booking has been created',
          staff_booking_reminder: 'A booking is starting soon',
          staff_booking_cancelled: 'A booking has been cancelled',
          review_added: 'New review for your court',
          staff_invitation: 'Court+ Staff Invitation',
          booking_invitation: "You've been invited to join a booking",
          booking_reminder_participant: 'Your booking is starting soon',
          booking_cancelled_participant: 'Your booking has been cancelled',
          booking_join_request_submitted: 'New join request for your booking',
          booking_join_request_approved: 'Your join request was approved',
          booking_join_request_rejected: 'Your join request was not approved',
          booking_invitation_accepted: 'Your invitation was accepted',
          booking_invitation_rejected: 'Your invitation was declined',
          court_approved: 'Your court has been approved',
          court_changes_requested: 'Changes requested for your court',
          resource_suspended: 'A resource has been suspended',
          court_pending_payment: 'Payment pending for your court',
        },
        notifications: {
          booking_cancelled: {
            title: 'Booking Cancelled',
            content: 'Your booking has been cancelled',
          },
          follow: {
            title: 'New Follower',
            content:
              '{{firstName}} {{lastName}} started following you',
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
            content: '{{firstName}} {{lastName}} liked your post',
          },
          booking_created: {
            title: 'New Booking',
            content: 'New booking created at {{courtName}}',
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
          court_pending_payment: {
            title: 'Payment Pending',
            content:
              '{{courtName}} is waiting for the subscription charge to be paid',
          },
          court_pending_approval: {
            title: 'New Court Pending Approval',
            content: '{{courtName}} at {{branchName}} is waiting for review',
          },
          court_approved: {
            title: 'Court Approved',
            content: '{{courtName}} has been approved and is now live',
          },
          court_changes_requested: {
            title: 'Changes Requested',
            content: 'Changes were requested for {{courtName}}: {{reason}}',
          },
          court_resubmitted: {
            title: 'Court Resubmitted',
            content: '{{courtName}} was resubmitted for review',
          },
          court_suspended: {
            title: 'Court Suspended',
            content: '{{courtName}} has been suspended: {{reason}}',
          },
          court_unsuspended: {
            title: 'Court Unsuspended',
            content: '{{courtName}} is live again',
          },
          branch_suspended: {
            title: 'Branch Suspended',
            content: '{{branchName}} has been suspended: {{reason}}',
          },
          branch_unsuspended: {
            title: 'Branch Unsuspended',
            content: '{{branchName}} is active again',
          },
          tenant_suspended: {
            title: 'Account Suspended',
            content: 'Your account has been suspended: {{reason}}',
          },
          tenant_unsuspended: {
            title: 'Account Unsuspended',
            content: 'Your account suspension has been lifted',
          },
          tenant_unsuspend_requested: {
            title: 'Unsuspend Requested',
            content: '{{tenantName}} requested to be unsuspended',
          },
          subscription_payment_failed: {
            title: 'Subscription Payment Failed',
            content: 'Your subscription payment could not be processed',
          },
          subscription_payment_succeeded: {
            title: 'Subscription Payment Successful',
            content: 'Your subscription payment was processed successfully',
          },
        },
      },
    },
    ar: {
      translation: {
        emails: {
          forgot_password: 'إعادة تعيين كلمة المرور لـ Court+',
          account_verification: 'أكمل حسابك في Court+ الآن',
          email_verification: 'تحقق من بريدك الإلكتروني لـ Court+',
          staff_booking_created: 'تم إنشاء حجز جديد',
          staff_booking_reminder: 'حجز سيبدأ قريباً',
          staff_booking_cancelled: 'تم إلغاء حجز',
          review_added: 'تقييم جديد لملعبك',
          staff_invitation: 'دعوة موظف Court+',
          booking_invitation: 'تمت دعوتك للانضمام إلى حجز',
          booking_reminder_participant: 'حجزك سيبدأ قريباً',
          booking_cancelled_participant: 'تم إلغاء حجزك',
          booking_join_request_submitted: 'طلب انضمام جديد لحجزك',
          booking_join_request_approved: 'تم قبول طلب انضمامك',
          booking_join_request_rejected: 'لم يتم قبول طلب انضمامك',
          booking_invitation_accepted: 'تم قبول دعوتك',
          booking_invitation_rejected: 'تم رفض دعوتك',
          court_approved: 'تمت الموافقة على ملعبك',
          court_changes_requested: 'تم طلب تعديلات على ملعبك',
          resource_suspended: 'تم تعليق أحد الموارد',
          court_pending_payment: 'الدفع معلق لملعبك',
        },
        notifications: {
          booking_cancelled: {
            title: 'إلغاء الحجز',
            content: 'تم إلغاء حجزك',
          },
          follow: {
            title: 'متابع جديد',
            content: '{{firstName}} {{lastName}} بدأ بمتابعتك',
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
            content: '{{firstName}} {{lastName}} أعجب بمنشورك',
          },
          booking_created: {
            title: 'حجز جديد',
            content: 'تم إنشاء حجز جديد في {{courtName}}',
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
          court_pending_payment: {
            title: 'الدفع معلق',
            content: '{{courtName}} بانتظار سداد رسوم الاشتراك',
          },
          court_pending_approval: {
            title: 'ملعب جديد بانتظار الموافقة',
            content: '{{courtName}} في {{branchName}} بانتظار المراجعة',
          },
          court_approved: {
            title: 'تمت الموافقة على الملعب',
            content: 'تمت الموافقة على {{courtName}} وأصبح متاحاً الآن',
          },
          court_changes_requested: {
            title: 'تم طلب تعديلات',
            content: 'تم طلب تعديلات على {{courtName}}: {{reason}}',
          },
          court_resubmitted: {
            title: 'تمت إعادة تقديم الملعب',
            content: 'تمت إعادة تقديم {{courtName}} للمراجعة',
          },
          court_suspended: {
            title: 'تم تعليق الملعب',
            content: 'تم تعليق {{courtName}}: {{reason}}',
          },
          court_unsuspended: {
            title: 'تم إلغاء تعليق الملعب',
            content: '{{courtName}} متاح مرة أخرى',
          },
          branch_suspended: {
            title: 'تم تعليق الفرع',
            content: 'تم تعليق {{branchName}}: {{reason}}',
          },
          branch_unsuspended: {
            title: 'تم إلغاء تعليق الفرع',
            content: '{{branchName}} نشط مرة أخرى',
          },
          tenant_suspended: {
            title: 'تم تعليق الحساب',
            content: 'تم تعليق حسابك: {{reason}}',
          },
          tenant_unsuspended: {
            title: 'تم إلغاء تعليق الحساب',
            content: 'تم رفع تعليق حسابك',
          },
          tenant_unsuspend_requested: {
            title: 'طلب إلغاء تعليق',
            content: '{{tenantName}} طلب إلغاء تعليق حسابه',
          },
          subscription_payment_failed: {
            title: 'فشل دفع الاشتراك',
            content: 'تعذر معالجة دفعة اشتراكك',
          },
          subscription_payment_succeeded: {
            title: 'دفع الاشتراك ناجح',
            content: 'تمت معالجة دفعة اشتراكك بنجاح',
          },
        },
      },
    },
  },
});

export { i18next };
