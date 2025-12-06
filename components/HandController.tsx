import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision';

interface HandControllerProps {
  onGesture: (gesture: string) => void;
  onMove: (x: number, y: number, z: number) => void;
  onTrackingStatus: (isTracking: boolean) => void;
}

const HandController: React.FC<HandControllerProps> = ({ onGesture, onMove, onTrackingStatus }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isReady, setIsReady] = useState(false);
  const recognizerRef = useRef<GestureRecognizer | null>(null);
  const requestRef = useRef<number>(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const init = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/wasm"
        );
        
        if (!mountedRef.current) return;

        recognizerRef.current = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        
        if (mountedRef.current) {
          setIsReady(true);
        }
      } catch (error) {
        console.error("Failed to initialize gesture recognizer:", error);
      }
    };

    if (!recognizerRef.current) {
        init();
    }

    return () => {
      mountedRef.current = false;
      if (recognizerRef.current) {
        try {
            recognizerRef.current.close();
        } catch (e) {
            // Ignore close errors
        }
        recognizerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isReady || !videoRef.current) return;

    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: 320, 
            height: 240,
            frameRate: { ideal: 30 }
          } 
        });
        
        if (videoRef.current && mountedRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadeddata = () => {
             if (mountedRef.current) predict();
          };
        }
      } catch (err) {
        console.error("Camera access denied or failed:", err);
      }
    };

    startCamera();

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isReady]);

  const predict = () => {
    if (!mountedRef.current) return;
    if (!videoRef.current || !recognizerRef.current) return;

    const nowInMs = Date.now();
    
    try {
      if (videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
        const results = recognizerRef.current.recognizeForVideo(videoRef.current, nowInMs);

        if (results.gestures.length > 0 && results.landmarks.length > 0) {
          onTrackingStatus(true);
          
          // 1. Handle Gesture
          const gesture = results.gestures[0][0].categoryName;
          onGesture(gesture);

          // 2. Handle Position (Centroid & Depth)
          const landmarks = results.landmarks[0];
          
          // X/Y: Average of wrist (0) and middle finger MCP (9)
          const x = (landmarks[0].x + landmarks[9].x) / 2;
          const y = (landmarks[0].y + landmarks[9].y) / 2;
          
          // Z: Approximate distance using hand size in frame
          // Distance between Wrist (0) and Middle Finger Tip (12)
          const dx = landmarks[0].x - landmarks[12].x;
          const dy = landmarks[0].y - landmarks[12].y;
          // Scale factor: Larger distance = closer hand. Typical range approx 0.1 to 0.4
          const handSize = Math.sqrt(dx*dx + dy*dy); 
          
          // Normalize/Clamp roughly 0.1 (far) to 0.4 (close)
          // We will pass the raw handSize and let Scene handle mapping
          
          // Mirror X for natural interaction
          onMove(1 - x, y, handSize);
        } else {
          onTrackingStatus(false);
        }
      }
    } catch (e) {
      // Suppress temporary recognition errors
    }
    
    requestRef.current = requestAnimationFrame(predict);
  };

  return (
    <video 
      ref={videoRef} 
      autoPlay 
      playsInline 
      muted 
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '320px',
        height: '240px',
        opacity: 0, 
        pointerEvents: 'none',
        zIndex: -1 
      }} 
    />
  );
};

export default HandController;