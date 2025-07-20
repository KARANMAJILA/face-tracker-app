import React from 'react';
import { Download, Trash2 } from 'lucide-react';

const SavedVideoCard = ({ video, onDownload, onDelete }) => {
  return (
    <div className="bg-gray-700 rounded-lg p-4">
      <div className="flex justify-between items-start mb-2">
        <div className="text-sm text-gray-300">
          {video.timestamp}
        </div>
        <div className="text-xs text-gray-400">
          {video.size}
        </div>
      </div>

      <div className="text-xs text-gray-400 mb-3">
        Duration: {typeof video.duration === 'number' 
          ? `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}` 
          : video.duration}
      </div>

      {/* ✅ Preview Player */}
      <video
        src={video.url}
        controls
        className="w-full rounded-md mb-4"
        preload="metadata"
        playsInline
      >
        Your browser does not support the video tag.
      </video>

      <div className="flex space-x-2">
        <button
          onClick={onDownload}
          className="flex items-center space-x-1 px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Download</span>
        </button>

        <button
          onClick={onDelete}
          className="flex items-center space-x-1 px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
};

export default SavedVideoCard;
