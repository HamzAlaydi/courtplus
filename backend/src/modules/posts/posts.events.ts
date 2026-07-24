import { Post } from './entities/post.entity';

export enum PostEvent {
  POST_CREATED = 'post.created',
  POST_DELETED = 'post.deleted',
  POST_LIKED = 'post.liked',
  POST_UNLIKED = 'post.unliked',
}

export interface PostCreatedEvent {
  postId: string;
}

export interface PostLikedEvent {
  post: Post;
  likedBy: string;
}

export interface PostDeletedEvent {
  post: Post;
}

export interface PostUnlikedEvent {
  post: Post;
  userId: string;
}
