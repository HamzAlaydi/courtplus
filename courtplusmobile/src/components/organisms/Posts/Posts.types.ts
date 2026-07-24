import { Post } from "models";

export type PostsProps = {
  postsData: Post[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
};
