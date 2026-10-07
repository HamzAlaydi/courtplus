import { useBottomSheetModal } from "@gorhom/bottom-sheet";
import { showSnackbar } from "atoms/Snackbar/SnackBar.utils";
import { useLocation } from "hooks";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useUserStore } from "store";
import { geocodeAddress } from "utils";

const DEFAULT_RADIUS_KM = 5;

/**
 * Location filter (Home / Courts header). The sheet used to be decorative:
 * the search box, the radius slider and both buttons did nothing and the
 * radius sent to the API was a hard-coded constant.
 */
export const useFilterLocationModal = () => {
  const location = useUserStore((store) => store.location);
  const updateLocation = useUserStore((store) => store.updateLocation);
  const { dismiss } = useBottomSheetModal();
  const { getLocationDetails } = useLocation();
  const { t } = useTranslation();

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [pending, setPending] = useState<{
    lat: number;
    long: number;
    address: string;
  } | null>(null);
  const [radius, setRadius] = useState<number>(
    location?.radius && location.radius > 0 ? location.radius : DEFAULT_RADIUS_KM
  );

  const center = pending ?? location;
  const address = pending?.address ?? location?.address ?? "";

  const onValueChange = (value: number) => {
    setRadius(Math.max(1, Math.round(value)));
  };

  const onSearch = async () => {
    const q = query.trim();
    if (!q) return;
    try {
      setSearching(true);
      const [first] = await geocodeAddress(q);
      if (!first) {
        showSnackbar({ message: t("filters.noPlaceFound") });
        return;
      }
      setPending({ lat: first.lat, long: first.lng, address: first.formattedAddress });
    } catch {
      showSnackbar({ message: t("general.error") });
    } finally {
      setSearching(false);
    }
  };

  const onDone = () => {
    const base = pending ?? location;
    if (base) {
      updateLocation({ ...base, radius });
    }
    dismiss();
  };

  const onClear = () => {
    setPending(null);
    setQuery("");
    setRadius(DEFAULT_RADIUS_KM);
    // Back to the device position (or the fallback when denied).
    getLocationDetails();
    dismiss();
  };

  return {
    location: center,
    address,
    query,
    setQuery,
    searching,
    onSearch,
    onValueChange,
    radius,
    onDone,
    onClear,
  };
};
