import { usePayMatch, useRespondMatch } from "apis";
import { showSnackbar } from "atoms/Snackbar/SnackBar.utils";
import { useStripePayment } from "hooks";
import { Booking, Participant, ParticipantStatus } from "models";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "store";
import { invalidateQuery } from "utils";

export const useMatchInvitationCard = ({
  participant,
  booking,
}: {
  participant: Participant;
  booking: Booking;
}) => {
  const { t } = useTranslation();
  const toggleLoading = useAppStore((store) => store.toggleLoading);
  const { mutateAsync: respondMatchMutation } = useRespondMatch();
  const { mutateAsync: payMatchMutation } = usePayMatch();
  const { initPayment, showPaymentOverlay } = useStripePayment();

  const handleAccept = async () => {
    try {
      toggleLoading(true);
      await respondMatchMutation({
        id: booking.id,
        accept: true,
        participantId: participant.id,
      });
      invalidateQuery("getBookings");
    } catch (error) {
      showSnackbar({ message: (error as Error).message });
    } finally {
      toggleLoading(false);
    }
  };
  const handleReject = async () => {
    try {
      toggleLoading(true);
      await respondMatchMutation({
        id: booking.id,
        accept: false,
        participantId: participant.id,
      });
      invalidateQuery("getBookings");
    } catch (error) {
      showSnackbar({ message: (error as Error).message });
    } finally {
      toggleLoading(false);
    }
  };

  const handlePay = async () => {
    try {
      toggleLoading(true);
      const response = await payMatchMutation({
        id: booking.id,
      });
      if (response) {
        const paymentInitialized = await initPayment({
          ephemeralKey: response?.ephemeralKey ?? "",
          customerId: response?.customerId ?? "",
          publishableKey: response?.publishableKey ?? "",
          clientSecret: response?.clientSecret ?? "",
        });
        if (paymentInitialized) {
          await showPaymentOverlay(booking?.court?.mainAsset ?? "", false);
        }
        invalidateQuery("getBookings");
      }
    } catch (error) {
      showSnackbar({ message: (error as Error).message });
    } finally {
      toggleLoading(false);
    }
  };

  const creator = useMemo(() => {
    return booking.participants.find((participant) => participant.isCreator);
  }, [participant]);

  const secondaryButton = useMemo(() => {
    if (participant?.status === ParticipantStatus.PENDING) {
      return {
        title: t("activity.accept"),
        onPress: handleAccept,
      };
    }
    if (participant?.status === ParticipantStatus.PENDING_PAYMENT) {
      return {
        title: t("booking.payPart"),
        onPress: handlePay,
      };
    }
  }, [t]);

  return {
    handleReject,
    secondaryButton,
    creator,
  };
};
