import { Court } from "./Court";
import { Branch } from "./Branch";

// court/branch can be null at runtime when the bookmarked target was
// deleted but the bookmark row still exists.
type BranchBookmark = {
  type: "branch";
  branch?: Branch | null;
};

type CourtBookmark = {
  type: "court";
  court?: Court | null;
};

export type Bookmark = (BranchBookmark | CourtBookmark) & {
  id: string;
  userId: string;
  resourceId: string;
};
