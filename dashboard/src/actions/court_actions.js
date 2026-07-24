import courtService from "../service/court.service";

export const createCourt = async (courtData) =>
  await courtService.createCourt(courtData);

export const getCourts = async (params) => await courtService.getCourts(params);

export const getCourt = async (courtId) => await courtService.getCourt(courtId);

export const getCourtAvailabilty = async ({ courtId, params }) =>
  await courtService.getCourtAvailabilty({ courtId, params });

export const updateCourt = async (courtId, courtData) =>
  await courtService.updateCourt(courtId, courtData);

export const deleteCourt = async (courtId) =>
  await courtService.deleteCourt(courtId);
