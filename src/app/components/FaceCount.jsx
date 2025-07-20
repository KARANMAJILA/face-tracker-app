import React from 'react';

const FaceCount = ({ count }) => {
  return (
    <div className="absolute top-4 right-4 bg-blue-600 px-3 py-2 rounded-full">
      <span className="text-sm font-semibold">
        {count} Face{count !== 1 ? 's' : ''}
      </span>
    </div>
  );
};

export default FaceCount;