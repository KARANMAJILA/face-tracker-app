import React from 'react';

const FaceOverlay = ({ faces, videoRef }) => {
  if (!faces || !videoRef?.current) return null;

  const videoWidth = videoRef.current.videoWidth || 1280;
  const videoHeight = videoRef.current.videoHeight || 720;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {faces.map((face, index) => {
        const { x, y, width, height } = face.boundingBox;
        
        // Convert to percentage for responsive overlay
        const leftPercent = (x / videoWidth) * 100;
        const topPercent = (y / videoHeight) * 100;
        const widthPercent = (width / videoWidth) * 100;
        const heightPercent = (height / videoHeight) * 100;

        return (
          <div
            key={face.id || index}
            className="absolute border-2 border-green-400 animate-pulse"
            style={{
              left: `${leftPercent}%`,
              top: `${topPercent}%`,
              width: `${widthPercent}%`,
              height: `${heightPercent}%`,
            }}
          >
            {/* Face label */}
            <div className="absolute -top-6 left-0 bg-green-400 text-black px-2 py-1 text-xs font-semibold rounded">
              Face {index + 1}
            </div>
            
            {/* Corner markers */}
            <div className="absolute -top-1 -left-1 w-4 h-4 border-l-2 border-t-2 border-red-400"></div>
            <div className="absolute -top-1 -right-1 w-4 h-4 border-r-2 border-t-2 border-red-400"></div>
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-l-2 border-b-2 border-red-400"></div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-r-2 border-b-2 border-red-400"></div>
          </div>
        );
      })}
    </div>
  );
};

export default FaceOverlay;