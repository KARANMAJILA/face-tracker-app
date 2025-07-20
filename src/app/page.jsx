'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Circle, Square, Download, Trash2, Camera } from 'lucide-react';

// Import face-api.js (make sure it's installed: npm install face-api.js)
import * as faceapi from 'face-api.js';

import VideoPlayer from './components/VideoPlayer';
import FaceOverlay from './components/FaceOverlay';
import RecordingIndicator from './components/RecordingIndicator';
import FaceCount from './components/FaceCount';
import SavedVideoCard from './components/SavedVideoCard';

const Page = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const recordingCanvasRef = useRef(null); // Separate canvas for recording
  const mediaRecorderRef = useRef(null);
  const recordedChunks = useRef([]);
  const detectionIntervalRef = useRef(null);
  const recordingAnimationRef = useRef(null);

  const [faces, setFaces] = useState([]);
  const [stream, setStream] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [savedVideos, setSavedVideos] = useState([]);
  const [error, setError] = useState('');
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [supportedFormats, setSupportedFormats] = useState([]);

  // Load face-api.js models
  const loadModels = async () => {
    try {
      console.log('Loading face detection models...');
      
      // Load models from CDN or local files
      const MODEL_URL = '/models'; // Make sure you have the models in public/models folder
      
      // Alternative: Load from CDN if local models don't exist
      const CDN_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';
      
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      } catch (localError) {
        console.log('Loading from CDN...');
        await faceapi.nets.tinyFaceDetector.loadFromUri(CDN_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(CDN_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(CDN_URL);
      }
      
      console.log('Models loaded successfully');
      setIsModelsLoaded(true);
      setError('');
    } catch (err) {
      console.error('Failed to load models:', err);
      setError('Failed to load face detection models: ' + err.message);
    }
  };

  // Initialize camera
  const startCamera = async () => {
    try {
      console.log('Starting camera...');
      
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded');
          videoRef.current.play().then(() => {
            console.log('Video playing');
            setIsCameraReady(true);
            setError('');
          });
        };
      }
      
      setStream(mediaStream);
    } catch (err) {
      console.error('Camera access failed:', err);
      setError('Unable to access camera: ' + err.message);
    }
  };

  // Face detection function - runs independently of recording
  const detectFaces = useCallback(async () => {
    if (!videoRef.current || !isModelsLoaded || !isCameraReady) {
      return;
    }

    try {
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions({
          inputSize: 416,
          scoreThreshold: 0.5
        }))
        .withFaceLandmarks()
        .withFaceDescriptors();

      const boundingBoxes = detections.map((detection, index) => ({
        id: index,
        boundingBox: {
          x: detection.detection.box.left,
          y: detection.detection.box.top,
          width: detection.detection.box.width,
          height: detection.detection.box.height,
        },
        landmarks: detection.landmarks?.positions || []
      }));

      setFaces(boundingBoxes);
      // Removed console.log to avoid spam during recording
    } catch (err) {
      console.error('Face detection error:', err);
    }
  }, [isModelsLoaded, isCameraReady]);

  // Start detection loop - independent of recording
  const startDetectionLoop = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
    
    detectionIntervalRef.current = setInterval(() => {
      detectFaces();
    }, 100); // Detection every 100ms for smooth tracking
  }, [detectFaces]);

  // Stop detection loop
  const stopDetectionLoop = () => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
  };

  // Initialize everything
  useEffect(() => {
    const init = async () => {
      // Check supported formats
      if (typeof window !== 'undefined' && window.MediaRecorder) {
        const formats = [];
        if (MediaRecorder.isTypeSupported('video/mp4;codecs=h264,aac')) {
          formats.push({ name: 'MP4', color: 'bg-green-600' });
        }
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
          formats.push({ name: 'WebM (VP9)', color: 'bg-blue-600' });
        }
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
          formats.push({ name: 'WebM (VP8)', color: 'bg-purple-600' });
        }
        setSupportedFormats(formats);
      }
      
      await loadModels();
      await startCamera();
    };
    
    init();

    // Cleanup on unmount
    return () => {
      stopDetectionLoop();
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (recordingAnimationRef.current) {
        cancelAnimationFrame(recordingAnimationRef.current);
      }
    };
  }, []);

  // Start detection when camera is ready
  useEffect(() => {
    if (isModelsLoaded && isCameraReady) {
      console.log('Starting face detection...');
      startDetectionLoop();
    }

    return () => {
      stopDetectionLoop();
    };
  }, [isModelsLoaded, isCameraReady, startDetectionLoop]);

  // CORRECTED Recording functions
  const startRecording = () => {
  if (!stream || !videoRef.current || !isCameraReady) {
    setError('Camera not ready for recording');
    return;
  }

  try {
    console.log('Starting recording...');
    recordedChunks.current = [];

    // Method 1: Try to record the original camera stream
    // This will record the clean video without overlays but ensures video works
    
    let recordingStream = stream; // Use original camera stream
    
    // MediaRecorder options
    let options = { videoBitsPerSecond: 2500000 };
    
    if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
      options.mimeType = 'video/webm;codecs=vp9';
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
      options.mimeType = 'video/webm;codecs=vp8';
    } else if (MediaRecorder.isTypeSupported('video/webm')) {
      options.mimeType = 'video/webm';
    }
    
    console.log('Using recording options:', options);

    const recorder = new MediaRecorder(recordingStream, options);
    mediaRecorderRef.current = recorder;

    // Event handlers
    recorder.ondataavailable = (event) => {
      console.log('Data available:', event.data.size, 'bytes');
      if (event.data && event.data.size > 0) {
        recordedChunks.current.push(event.data);
      }
    };

    recorder.onstop = () => {
      console.log('Recording stopped, creating blob...');
      
      if (recordedChunks.current.length === 0) {
        setError('No video data was recorded');
        return;
      }
      
      const blob = new Blob(recordedChunks.current, { type: options.mimeType || 'video/webm' });
      console.log('Final blob size:', blob.size, 'bytes');
      
      const url = URL.createObjectURL(blob);
      const now = new Date();
      
      const newVideo = {
        id: Date.now(),
        url,
        timestamp: now.toLocaleString(),
        size: (blob.size / (1024 * 1024)).toFixed(2) + ' MB',
        duration: recordingTime,
        fileExtension: options.mimeType?.includes('mp4') ? 'mp4' : 'webm',
        mimeType: options.mimeType || 'video/webm'
      };
      
      setSavedVideos((prev) => [...prev, newVideo]);
      console.log('Video saved successfully');
    };

    recorder.onstart = () => {
      console.log('Recording started successfully');
      setError('');
    };

    recorder.onerror = (event) => {
      console.error('Recording error:', event.error);
      setError('Recording failed: ' + event.error.message);
      setIsRecording(false);
    };

    // Start recording
    recorder.start(1000);
    setIsRecording(true);
    setRecordingTime(0);

    // Start timer
    const timerInterval = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);

    recorder.timerInterval = timerInterval;

  } catch (err) {
    console.error('Failed to start recording:', err);
    setError('Recording failed: ' + err.message);
  }
};

  const stopRecording = () => {
    console.log('Stopping recording...');
    
    if (mediaRecorderRef.current && isRecording) {
      const recorder = mediaRecorderRef.current;
      
      // Set recording state to false first
      setIsRecording(false);
      
      // Clear timer
      if (recorder.timerInterval) {
        clearInterval(recorder.timerInterval);
      }
      
      // Cancel animation frame
      if (recordingAnimationRef.current) {
        cancelAnimationFrame(recordingAnimationRef.current);
        recordingAnimationRef.current = null;
      }
      
      // Stop recording with a small delay to ensure last frame is captured
      setTimeout(() => {
        if (recorder && recorder.state !== 'inactive') {
          console.log('Stopping MediaRecorder, current state:', recorder.state);
          recorder.stop();
        }
      }, 200); // Increased delay
      
      console.log('Recording stop initiated');
      
      // Clean up recording canvas
      if (recordingCanvasRef.current) {
        recordingCanvasRef.current = null;
      }
    }
  };

  // Utility functions
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const downloadVideo = (video) => {
    const a = document.createElement('a');
    a.href = video.url;
    // Use the proper file extension based on the recorded format
    const extension = video.fileExtension || 'webm';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    a.download = `face-tracking-${timestamp}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Show download notification
    console.log(`Downloaded video as ${extension.toUpperCase()} format`);
  };

  const deleteVideo = (id) => {
    setSavedVideos((prev) => {
      const videoToDelete = prev.find(v => v.id === id);
      if (videoToDelete?.url) {
        URL.revokeObjectURL(videoToDelete.url);
      }
      return prev.filter((v) => v.id !== id);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Face Tracking Studio
          </h1>
          <p className="text-gray-400">Real-time face detection with video recording</p>
        </div>

        {/* Format Selection */}
        <div className="mb-4 flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-400">Supported formats:</span>
          {supportedFormats.length > 0 ? (
            supportedFormats.map((format, index) => (
              <span key={index} className={`px-2 py-1 ${format.color} text-xs rounded`}>
                {format.name}
              </span>
            ))
          ) : (
            <span className="px-2 py-1 bg-gray-600 text-xs rounded">Detecting...</span>
          )}
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          <span className={`px-3 py-1 rounded-full text-sm ${isModelsLoaded ? 'bg-green-600' : 'bg-yellow-600'}`}>
            Models: {isModelsLoaded ? 'Loaded' : 'Loading...'}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm ${isCameraReady ? 'bg-green-600' : 'bg-yellow-600'}`}>
            Camera: {isCameraReady ? 'Ready' : 'Initializing...'}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm ${faces.length > 0 ? 'bg-green-600' : 'bg-gray-600'}`}>
            Detection: {faces.length > 0 ? 'Active' : 'Waiting'}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm ${isRecording ? 'bg-red-600 animate-pulse' : 'bg-gray-600'}`}>
            Recording: {isRecording ? 'Active' : 'Standby'}
          </span>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Main video area */}
        <div className="bg-gray-800 rounded-xl p-6 shadow-2xl mb-6">
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <VideoPlayer ref={videoRef} />
            <FaceOverlay faces={faces} videoRef={videoRef} />
            {isRecording && <RecordingIndicator time={formatTime(recordingTime)} />}
            <FaceCount count={faces.length} />
          </div>

          {/* Controls */}
          <div className="flex justify-center mt-6 space-x-4">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={!isCameraReady || !isModelsLoaded}
              className={`flex items-center space-x-2 px-6 py-3 rounded-full font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                isRecording 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isRecording ? <Square className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
              <span>{isRecording ? 'Stop Recording' : 'Start Recording'}</span>
            </button>
          </div>
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {/* Saved Videos */}
        <div className="bg-gray-800 rounded-xl p-6 shadow-2xl">
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Camera className="w-5 h-5 mr-2" />
            Saved Videos ({savedVideos.length})
          </h2>
          
          {savedVideos.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No recordings yet</p>
          ) : (
            <div className="space-y-4">
              {savedVideos.map((video) => (
                <SavedVideoCard
                  key={video.id}
                  video={video}
                  onDownload={() => downloadVideo(video)}
                  onDelete={() => deleteVideo(video.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 bg-gray-800 rounded-lg p-4 text-sm">
            <h3 className="font-bold mb-2">Debug Info:</h3>
            <p>Models loaded: {isModelsLoaded.toString()}</p>
            <p>Camera ready: {isCameraReady.toString()}</p>
            <p>Faces detected: {faces.length}</p>
            <p>Recording: {isRecording.toString()}</p>
            <p>Stream: {stream ? 'Active' : 'None'}</p>
            <p>Video dimensions: {videoRef.current?.videoWidth || 0}x{videoRef.current?.videoHeight || 0}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;