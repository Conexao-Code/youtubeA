// types.ts
export interface Channel {
  id: string;
  name: string;
  avatar: string;
  subscriberCount: number;
  url: string;
  youtubeId: string;
  addedAt: string;
}

export interface Video {
  id: string;
  title: string;
  channelId: string;
  channelName: string;
  thumbnail: string;
  publishedAt: string;
  views: number;
  likes: number;
  comments: number;
  performance: 'high' | 'medium' | 'low';
  sentimentScore: number;
  engagementRate: number;
  performanceScore: number;
  metrics: {
    ageInHours: number;
    viewsPerHour: number;
    engagementRate: number;
  };
}

export interface VideoMetrics {
  viewsGrowth: number[];
  likesGrowth: number[];
  commentsGrowth: number[];
  sentimentAnalysis: {
    positive: number;
    neutral: number;
    negative: number;
  };
}