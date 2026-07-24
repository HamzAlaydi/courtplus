import { Column, Entity, Unique, JoinColumn, ManyToOne } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from 'src/common/base-entity';
import { User } from 'src/modules/users/entities/user.entity';
import { Court } from 'src/modules/courts/entities/court.entity';
import { Branch } from 'src/modules/branches/entities/branch.entity';

export enum BookmarkType {
  COURT = 'court',
  USER = 'user',
  BRANCH = 'branch',
}

@Entity('bookmarks')
@Unique('idx_bookmark_userId_type_resourceId', ['userId', 'type', 'resourceId'])
export class Bookmark extends BaseEntity {
  @Column('uuid')
  @ApiProperty({
    description: 'The ID of the user who created the bookmark',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @Column('uuid')
  @ApiProperty({
    description: 'The ID of the bookmarked resource (court, user, or branch)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  resourceId: string;

  @Column({
    type: 'enum',
    enum: BookmarkType,
    enumName: 'BookmarkType',
  })
  @ApiProperty({
    description: 'The type of the bookmarked resource',
    enum: BookmarkType,
    enumName: 'BookmarkType',
    example: BookmarkType.COURT,
  })
  type: BookmarkType;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  creator: User;

  @ApiProperty({
    description: 'The court resource',
    type: () => Court,
  })
  court?: Court;

  @ApiProperty({
    description: 'The user resource',
    type: () => User,
  })
  user?: User;

  @ApiProperty({
    description: 'The branch resource',
    type: () => Branch,
  })
  branch?: Branch;
}
