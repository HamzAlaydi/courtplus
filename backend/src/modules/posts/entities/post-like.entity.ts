import { Column, Entity, Unique, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/base-entity';
import { Post } from './post.entity';
import { User } from 'src/modules/users/entities/user.entity';

@Entity('post_likes')
@Unique('idx_post_user', ['postId', 'userId'])
export class PostLike extends BaseEntity {
  @Column('uuid')
  postId: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
