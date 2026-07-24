import { CountryItem } from "react-native-country-codes-picker";

export type CountryPickerModalProps = {
  show: boolean;
  onSelectCountry: (country: CountryItem) => void;
  onBackdropPress: () => void;
};
