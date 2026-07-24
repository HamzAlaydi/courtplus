import { Asset } from "react-native-image-picker";

export type ImagePickerModalProps = {
  onClose: () => void;
  onImageSelected: (image: Asset) => void;
};
