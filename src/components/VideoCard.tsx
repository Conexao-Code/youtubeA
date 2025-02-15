import React from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Video } from '../types';
import { Eye, ThumbsUp, MessageCircle, TrendingUp } from 'lucide-react';

interface VideoCardProps {
  video: Video;
  onClick: () => void;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video, onClick }) => {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', { notation: 'compact' }).format(num);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-xl shadow-lg overflow-hidden card-hover cursor-pointer"
      onClick={onClick}
    >
      <div className="relative">
        <img 
          src={video.thumbnail} 
          alt={video.title}
          className="w-full aspect-video object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 h-1">
          <div 
            className={`performance-indicator ${video.performance}`}
            style={{ width: `${video.sentimentScore}%` }}
          />
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-lg line-clamp-2 mb-2">
          {video.title}
        </h3>
        
        <p className="text-sm text-gray-600 mb-3">
          {video.channelName} • {formatDistanceToNow(new Date(video.publishedAt))} ago
        </p>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Eye size={16} />
            <span>{formatNumber(video.views)}</span>
          </div>
          <div className="flex items-center gap-2">
            <ThumbsUp size={16} />
            <span>{formatNumber(video.likes)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle size={16} />
            <span>{formatNumber(video.comments)}</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp size={16} />
            <span>{video.engagementRate.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};