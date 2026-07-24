import assetsService from "../service/assets.service";

export const uploadAssets = async (assetsData) =>
  await assetsService.uploadAssets(assetsData);
