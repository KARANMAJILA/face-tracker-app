import { forwardRef } from 'react';

const VideoPlayer = forwardRef((props, ref) => {
  return (
    <video
      ref={ref}
      className="w-full h-full object-cover"
      autoPlay
      playsInline
      muted
      {...props}
    />
  );
});

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;