import { useNavigation } from "@react-navigation/native";
import {
  initPaymentSheet,
  presentPaymentSheet,
  initStripe,
} from "@stripe/stripe-react-native";
import { Payment } from "apis";
import {
  AuthenticatedStackNavigationProp,
  CourtStackNavigationProp,
} from "navigation/types";
export const useStripePayment = () => {
  const { navigate } = useNavigation<AuthenticatedStackNavigationProp>();

  const initPayment = async (paymentConfig: Payment) => {
    try {
      await initStripe({
        publishableKey: paymentConfig.publishableKey,
      });
      await initPaymentSheet({
        merchantDisplayName: "Court+",
        customerEphemeralKeySecret: paymentConfig?.ephemeralKey,
        customerId: paymentConfig?.customerId,
        paymentIntentClientSecret: paymentConfig.clientSecret,
        returnURL: "court-plus://stripe-redirect",
        allowsDelayedPaymentMethods: true,
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  const showPaymentOverlay = async (
    courtImage: string,
    shouldNavigate: boolean = true
  ) => {
    const { error } = await presentPaymentSheet();
    if (shouldNavigate) {
      if (error) {
        navigate("CourtStack", { screen: "BookingFailed" });
      } else {
        navigate("CourtStack", { screen: "BookingSuccess" });
      }
    }
  };

  return {
    initPayment,
    showPaymentOverlay,
  };
};
