/**
 * Pai Presente — API
 * Copyright (c) 2026. Todos os direitos reservados.
 * Licenca: proprietaria.
 */

import type { Database } from './database/client';
import { buildActivityRoutes } from './modules/Activity/activity.controller';
import { createActivityRepository } from './modules/Activity/activity.repository';
import { createActivityUseCases } from './modules/Activity/activity.use-case';
import type { ChildOwnershipPort } from './modules/Activity/types/activity.types';
import { buildChatMessageRoutes } from './modules/ChatMessage/chat-message.controller';
import { createChatMessageRepository } from './modules/ChatMessage/chat-message.repository';
import { createChatMessageUseCases } from './modules/ChatMessage/chat-message.use-case';
import { buildChildRoutes } from './modules/Child/child.controller';
import { createChildRepository } from './modules/Child/child.repository';
import { createChildUseCases } from './modules/Child/child.use-case';
import type { ChildRepository } from './modules/Child/types/child.types';
import { buildCommunityCommentRoutes } from './modules/CommunityComment/community-comment.controller';
import { createCommunityCommentRepository } from './modules/CommunityComment/community-comment.repository';
import { createCommunityCommentUseCases } from './modules/CommunityComment/community-comment.use-case';
import { buildCommunityPostRoutes } from './modules/CommunityPost/community-post.controller';
import { createCommunityPostRepository } from './modules/CommunityPost/community-post.repository';
import { createCommunityPostUseCases } from './modules/CommunityPost/community-post.use-case';
import type { CommunityPostRepository } from './modules/CommunityPost/types/community-post.types';
import { buildInsightRatingRoutes } from './modules/InsightRating/insight-rating.controller';
import { createInsightRatingRepository } from './modules/InsightRating/insight-rating.repository';
import { createInsightRatingUseCases } from './modules/InsightRating/insight-rating.use-case';
import type { PostExistencePort } from './modules/CommunityComment/types/community-comment.types';
import type { RouteDefinition } from './modules/shared/http/route.types';
import { buildUserRoutes } from './modules/User/user.controller';
import { createUserRepository } from './modules/User/user.repository';
import { createUserUseCases } from './modules/User/user.use-case';

/** O dono do filho ja e checado na busca escopada; a porta so expoe o booleano. */
function adaptChildOwnership(repository: ChildRepository): ChildOwnershipPort {
  return {
    isOwnedByUser: async ({ childId, userId }) =>
      (await repository.findById({ childId, userId })) !== undefined,
  };
}

function adaptPostExistence(repository: CommunityPostRepository): PostExistencePort {
  return { exists: (postId) => repository.exists(postId) };
}

export function buildApplicationRoutes(database: Database): readonly RouteDefinition[] {
  const childRepository = createChildRepository(database);
  const communityPostRepository = createCommunityPostRepository(database);

  return [
    ...buildUserRoutes(createUserUseCases(createUserRepository(database))),
    ...buildChildRoutes(createChildUseCases(childRepository)),
    ...buildActivityRoutes(
      createActivityUseCases({
        repository: createActivityRepository(database),
        childOwnership: adaptChildOwnership(childRepository),
      }),
    ),
    ...buildInsightRatingRoutes(
      createInsightRatingUseCases(createInsightRatingRepository(database)),
    ),
    ...buildCommunityPostRoutes(createCommunityPostUseCases(communityPostRepository)),
    ...buildCommunityCommentRoutes(
      createCommunityCommentUseCases({
        repository: createCommunityCommentRepository(database),
        postExistence: adaptPostExistence(communityPostRepository),
      }),
    ),
    ...buildChatMessageRoutes(createChatMessageUseCases(createChatMessageRepository(database))),
  ];
}
