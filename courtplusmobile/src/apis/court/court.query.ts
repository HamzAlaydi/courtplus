import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  getBranchById,
  getCourtAvailability,
  getCourtDetails,
  getCourts,
} from "./court.service";
import {
  BranchRequestIdRequest,
  CourtRequestIdRequest,
  CourtsRequest,
  GetCourtAvailabilityRequest,
} from "./court.types";
import { flattenData, getNextPage, queryKeys } from "utils";
import { Court } from "models";

export const useGetCourts = (
  { page, pageSize, ...request }: CourtsRequest,
  enabled = true
) => {
  const {
    data: courtsData,
    isFetching,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [queryKeys.getCourts, request],
    initialData: { pageParams: [], pages: [] },
    queryFn: ({ pageParam = 1 }) =>
      getCourts({ ...request, page: pageParam, pageSize }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => {
      return lastPage ? getNextPage(lastPage, pages) : undefined;
    },
    enabled,
  });

  const courts = flattenData<Court>(courtsData);

  return {
    data: courts,
    isLoading: isFetching && !isFetchingNextPage,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
};

export const useGetCourtDetails = ({ id }: CourtRequestIdRequest) => {
  const { data, isFetching, error } = useQuery({
    queryKey: [queryKeys.getCourtDetails, id],
    queryFn: () => getCourtDetails({ id }),
  });
  return {
    data,
    isLoading: isFetching,
    error,
  };
};

export const useGetBranchById = ({
  id,
  includeCourts = true,
}: BranchRequestIdRequest) => {
  const { data, isFetching, error } = useQuery({
    queryKey: [queryKeys.getBranchById, id, includeCourts],
    queryFn: () => getBranchById({ id, includeCourts }),
  });
  return {
    data,
    isLoading: isFetching,
    error,
  };
};

export const useGetCourtAvailability = (
  requestData: GetCourtAvailabilityRequest
) => {
  const { data, isFetching, error } = useQuery({
    queryKey: [queryKeys.getCourtDetails, requestData],
    queryFn: () => getCourtAvailability(requestData),
  });
  return {
    data,
    isLoading: isFetching,
    error,
  };
};
