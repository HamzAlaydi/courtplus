import { useMemo, useState } from "react";
import { useUserStore } from "store";

export const useFilterLocationModal = () => {
  const location = useUserStore((store) => store.location);
  const [radius, setRadius] = useState(0);
  const address = useMemo(() => {
    return location?.address;
  }, [location]);

  const onValueChange = (value: number) => {
    setRadius(Number(value.toFixed(1)));
  };

  return {
    location,
    address,
    onValueChange,
    radius,
  };
};
