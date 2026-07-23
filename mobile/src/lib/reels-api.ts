import { gatewayApi } from './api';

export type ReelCreator = {
  userId: string;
  displayName: string;
  profilePhotoUrl: string | null;
  status: string;
};

export type Reel = {
  id: string;
  videoUrl: string;
  durationSeconds: number;
  wasTrimmed: boolean;
  caption: string;
  tags: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  popularityScore: number;
  isFlagged: boolean;
  createdAt: string;
  updatedAt: string;
  creator: ReelCreator;
  isLikedByViewer: boolean;
  isSharedByViewer: boolean;
};

type FeedResponse = {
  items: Reel[];
  total?: number;
};

export async function listPublicReels(): Promise<Reel[]> {
  const { data } = await gatewayApi.get<FeedResponse>('/reels/public-feed');
  return data.items ?? [];
}
