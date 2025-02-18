import React from 'react';
import { Channel, Video } from '../types';
import { TrendingUp, Gauge, Gauge as GaugeHigh, Gauge as GaugeLow } from 'lucide-react';

interface ChannelSectionProps {
  channel: Channel;
  videos: Video[];
}

const formatNumber = (num: number) => {
  return new Intl.NumberFormat('pt-BR').format(num);
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('pt-BR');
};

const PerformanceIndicator = ({ performance }: { performance: 'high' | 'medium' | 'low' }) => {
  const icons = {
    high: <GaugeHigh className="w-5 h-5" />,
    medium: <Gauge className="w-5 h-5" />,
    low: <GaugeLow className="w-5 h-5" />
  };

  const colors = {
    high: 'bg-green-100 text-green-700 border-green-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-red-100 text-red-700 border-red-200'
  };

  const labels = {
    high: 'Alto',
    medium: 'Médio',
    low: 'Baixo'
  };

  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${colors[performance]}`}>
      {icons[performance]}
      {labels[performance]}
    </div>
  );
};
export function ChannelSection({ channel, videos }: ChannelSectionProps) {
  return (
    <div className="mb-12 bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src={channel.avatar}
              alt={channel.name}
              className="w-16 h-16 rounded-full border-2 border-red-100"
            />
            <div>
              <h2 className="text-xl font-bold text-gray-900">{channel.name}</h2>
              <p className="text-gray-500">
                {formatNumber(channel.subscriberCount)} inscritos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium text-gray-700">
              {videos.length} vídeos esta semana
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
        {videos.map(video => (
          <div
            key={video.id}
            className="group cursor-pointer"
          >
            <div className="relative overflow-hidden rounded-lg aspect-video mb-3">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-2 right-2">
                <PerformanceIndicator performance={video.performance} />
              </div>
            </div>
            <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-red-600 transition-colors">
              {video.title}
            </h3>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
              <span>{formatNumber(video.views)} visualizações</span>
              <span>•</span>
              <span>{formatDate(video.publishedAt)}</span>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <span>👍</span>
                <span>{formatNumber(video.likes)}</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <span>💬</span>
                <span>{formatNumber(video.comments)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}