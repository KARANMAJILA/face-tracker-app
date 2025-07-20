import React from 'react';
import { Circle } from 'lucide-react';

const RecordingIndicator = ({ time }) => {
  return (
    <div className="absolute top-4 left-4 flex items-center space-x-2 bg-red-600 px-3 py-2 rounded-full animate-pulse">
      <Circle className="w-3 h-3 fill-white animate-pulse" />
      <span className="text-sm font-semibold">REC {time}</span>
    </div>
  );
};

export default RecordingIndicator;