import { axiosInstance } from "apis";
import { ApiResponse, endPoints } from "utils";
import { CreateReportRequest } from "./report.types";

export const createReport = async (data: CreateReportRequest) => {
  const response = await axiosInstance.post<ApiResponse>(
    endPoints.createReport,
    data
  );
  return response.data.OK;
};
