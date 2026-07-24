import GlobalService from "../service/global.service";

export const getPosts = async (data) => await GlobalService.getPosts(data);
