import { FlashListProps } from "@shopify/flash-list";
import { EmptyStateProps } from "molecules/EmptyState/EmptyState.types";
import { StyleProp, ViewStyle } from "react-native";

export type ListProps<T> = FlashListProps<T> & {
  isLoading?: boolean;
  overrideContainerStyle?: StyleProp<ViewStyle>;
  overrideLoaderContainerStyle?: StyleProp<ViewStyle>;
  isFetchingNextPage?: boolean;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  emptyConfig?: EmptyStateProps;
};
