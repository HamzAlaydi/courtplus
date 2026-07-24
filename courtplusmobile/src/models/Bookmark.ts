import { Court } from "./Court";
import { Branch } from "./Branch";

type BranchBookmark = {
  type: "branch";
  branch: Branch;
};

type CourtBookmark = {
  type: "court";
  court: Court;
};

export type Bookmark = (BranchBookmark | CourtBookmark) & {
  id: string;
  userId: string;
  resourceId: string;
};
