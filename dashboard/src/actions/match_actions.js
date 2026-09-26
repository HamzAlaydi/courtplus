import matchService from "../service/match.service";

export const createMatch = async (data) => await matchService.createMatch(data);

export const getMatches = async (params) =>
  await matchService.getMatches(params);

export const getMatchById = async (id) => await matchService.getMatchById(id);

export const cancelMatchById = async (id, reason) =>
  await matchService.cancelMatchById(id, reason);
