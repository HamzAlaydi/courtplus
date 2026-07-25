import { useNavigation } from "@react-navigation/native";
import {
  initPaymentSheet,
  presentPaymentSheet,
  initStripe,
} from "@stripe/stripe-react-native";
import { Payment } from "apis";
import { showSnackbar } from "atoms/Snackbar/SnackBar.utils";
import { t } from "i18next";
import {
  AuthenticatedStackNavigationProp,
  CourtStackNavigationProp,
} from "navigation/types";

// Guards against presenting the PaymentSheet twice (e.g. double-tap on Pay):
// a second presentPaymentSheet call while one is open fails natively and
// would wrongly be treated as a payment failure.
let isPaymentSheetPresenting = false;

export const useStripePayment = () => {
  const { navigate } = useNavigation<AuthenticatedStackNavigationProp>();

  const initPayment = async (paymentConfig: Payment) => {
    try {
      if (!paymentConfig?.clientSecret) {
        return false;
      }
      await initStripe({
        publishableKey: paymentConfig.publishableKey,
      });
      // The Stripe SDK signals failures by RESOLVING `{ error }`, not by
      // throwing — without this check a failed (re-)init is treated as
      // success and presentPaymentSheet then never opens the sheet.
      const { error } = await initPaymentSheet({
        merchantDisplayName: "Court+",
        customerEphemeralKeySecret: paymentConfig?.ephemeralKey,
        customerId: paymentConfig?.customerId,
        paymentIntentClientSecret: paymentConfig.clientSecret,
        returnURL: "court-plus://stripe-redirect",
        allowsDelayedPaymentMethods: true,
      });
      if (error) {
        showSnackbar({ message: error.message || t("general.error") });
        return false;
      }
      return true;
    } catch (error) {
      showSnackbar({ message: (error as Error).message });
      return false;
    }
  };

  const showPaymentOverlay = async (
    courtImage: string,
    shouldNavigate: boolean = true
  ) => {
    if (isPaymentSheetPresenting) {
      return;
    }
    isPaymentSheetPresenting = true;
    try {
      const { error, didCancel } = await presentPaymentSheet();
      // A voluntary cancel is not a failure: stay on the current screen so
      // pressing Pay again re-initializes and re-presents a fresh sheet.
      const isCancelled = didCancel || error?.code === "Canceled";
      if (isCancelled) {
        return;
      }
      if (error) {
        showSnackbar({ message: error.message || t("general.error") });
        if (shouldNavigate) {
          navigate("CourtStack", { screen: "BookingFailed" });
        }
        return;
      }
      if (shouldNavigate) {
        navigate("CourtStack", { screen: "BookingSuccess" });
      }
    } finally {
      isPaymentSheetPresenting = false;
    }
  };

  return {
    initPayment,
    showPaymentOverlay,
  };
};
