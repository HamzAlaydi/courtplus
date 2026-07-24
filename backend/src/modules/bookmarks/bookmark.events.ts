import { Bookmark } from './entities/bookmark.entity';

export enum BookmarkEventType {
  CREATED = 'bookmark.created',
  DELETED = 'bookmark.deleted',
}

export interface BookmarkEvent {
  bookmark: Bookmark;
}
