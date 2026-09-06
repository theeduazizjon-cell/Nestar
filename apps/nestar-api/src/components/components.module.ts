import { Module } from '@nestjs/common';
import { MemberModule } from './member/member.module';
import { PropertyModule } from './property/property.module';
import { CommentModule } from './comment/comment.module';
import { ViewModule } from './view/view.module';
import { FollowModule } from './follow/follow.module';
import { BoardArticleModule } from './board-article/board-article.module';
import { LikeModule } from './like/like.module';
import { AuthModule } from './auth/auth/auth.module';

@Module({
  imports: [MemberModule, AuthModule, PropertyModule, BoardArticleModule, LikeModule, ViewModule, CommentModule, FollowModule],
})
export class ComponentsModule {}