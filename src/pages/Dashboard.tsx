import React, { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { motion } from 'framer-motion';
import { Search, TrendingUp } from 'lucide-react';
import { ChannelSection } from '../components/ChannelSection';
import { Channel, Video } from '../types';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const fetchChannels = async (): Promise<Channel[]> => {
  const snapshot = await getDocs(collection(db, 'channels'));
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }) as Channel);
};

const calculatePerformance = (
  views: number,
  likes: number,
  publishedAt: string,
  subscriberCount: number
): 'high' | 'medium' | 'low' => {
  const now = new Date();
  const publishDate = new Date(publishedAt);
  const ageInHours = Math.max(1, (now.getTime() - publishDate.getTime()) / (1000 * 60 * 60));
  
  const viewsPerHour = views / ageInHours;
  const engagementRate = views > 0 ? (likes / views) * 100 : 0;
  const subscriberPenetration = subscriberCount > 0 
    ? (views / subscriberCount) * 100 
    : 0;

  const factors = {
    viewsVelocity: Math.log10(viewsPerHour + 1) * 0.4,
    engagement: engagementRate * 0.3,
    subscriberReach: subscriberPenetration * 0.2,
    absolutePopularity: Math.log10(likes + 1) * 0.1
  };

  const totalScore = 
    factors.viewsVelocity +
    factors.engagement +
    factors.subscriberReach +
    factors.absolutePopularity;

  if (totalScore >= 7.5) return 'high';
  if (totalScore >= 4.5) return 'medium';
  return 'low';
};

const fetchVideos = async (channel: Channel): Promise<Video[]> => {
  const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?` +
      `part=snippet&channelId=${channel.youtubeId}&maxResults=50&` +
      `order=date&type=video&publishedAfter=${oneWeekAgo.toISOString()}&key=AIzaSyAed6Gwm1MdihckCKGtvjv4nzsZNZpSZnE`
    );

    const data = await response.json();
    
    if (!data.items) return [];

    const videoIds = data.items
      .filter((item: any) => item.id.videoId)
      .map((item: any) => item.id.videoId)
      .join(',');

    if (!videoIds) return [];

    const statsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?` +
        `part=snippet,statistics&id=${videoIds}&key=AIzaSyAed6Gwm1MdihckCKGtvjv4nzsZNZpSZnE`
    );

    const statsData = await statsResponse.json();

    return statsData.items.map((item: any) => {
      const views = Number(item.statistics.viewCount || 0);
      const likes = Number(item.statistics.likeCount || 0);
      const comments = Number(item.statistics.commentCount || 0);
      
      return {
          id: item.id,
          title: item.snippet.title,
          channelId: channel.id,
          channelName: channel.name,
          thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.default.url,
          publishedAt: item.snippet.publishedAt,
          views: views,
          likes: likes,
          comments: comments,
          performance: calculatePerformance(
              views,
              likes,
              item.snippet.publishedAt,
              channel.subscriberCount
          ),
          metrics: {
              ageInHours: (Date.now() - new Date(item.snippet.publishedAt).getTime()) / (1000 * 60 * 60),
              engagementRate: views > 0 ? (likes / views) * 100 : 0,
              subscriberPenetration: channel.subscriberCount > 0
                  ? (views / channel.subscriberCount) * 100
                  : 0
          },
          sentimentScore: 0,
          engagementRate: 0
      } as unknown as Video;
    });
  } catch (error) {
    console.error('Error fetching videos:', error);
    return [];
  }
};

export function Dashboard() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [videosByChannel, setVideosByChannel] = useState<Map<string, Video[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const { ref, inView } = useInView({ threshold: 0 });

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const channelData = await fetchChannels();
        setChannels(channelData);
        
        const videosMap = new Map<string, Video[]>();
        for (const channel of channelData) {
          const videos = await fetchVideos(channel);
          videosMap.set(channel.id, videos);
        }
        setVideosByChannel(videosMap);
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };
    loadInitialData();
  }, []);

  const filterVideos = (videos: Video[]) => {
    return videos.filter(video => {
      const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           video.channelName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filter === 'all' || video.performance === filter;
      return matchesSearch && matchesFilter;
    });
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-40 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Pesquisar vídeos ou canais..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full border-none focus:outline-none focus:ring-2 focus:ring-red-500 hover:bg-gray-200 transition-colors"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === 'all' 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setFilter('all')}
              >
                Todos
              </button>
              <button
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === 'high'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setFilter('high')}
              >
                Alto Desempenho
              </button>
              <button
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === 'medium'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setFilter('medium')}
              >
                Médio Desempenho
              </button>
              <button
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === 'low'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setFilter('low')}
              >
                Baixo Desempenho
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-24 pb-12">
        {channels.map(channel => {
          const channelVideos = videosByChannel.get(channel.id) || [];
          const filteredChannelVideos = filterVideos(channelVideos);
          
          if (filteredChannelVideos.length === 0) return null;
          
          return (
            <ChannelSection
              key={channel.id}
              channel={channel}
              videos={filteredChannelVideos}
            />
          );
        })}

        {loading && (
          <div className="flex justify-center mt-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <TrendingUp className="w-8 h-8 text-red-500" />
            </motion.div>
          </div>
        )}

        <div ref={ref} className="h-20" />
      </main>
    </div>
  );
}