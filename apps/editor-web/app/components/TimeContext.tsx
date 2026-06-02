'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';

interface TimeContextValue {
  currentTime: number;
  isPlaying: boolean;
  frameRate: number;
  speed: number;
  totalFrames: number;
  play: () => void;
  pause: () => void;
  reset: () => void;
  setFrameRate: (fps: number) => void;
  setSpeed: (speed: number) => void;
  setTotalFrames: (frames: number) => void;
  seekToFrame: (frame: number) => void;
  seekToTime: (time: number) => void;
}

interface TimeProviderProps {
  children: React.ReactNode;
}

const TimeContext = createContext<TimeContextValue | undefined>(undefined);

export function useTime() {
  const context = useContext(TimeContext);
  if (context === undefined) {
    throw new Error('useTime must be used within a TimeProvider');
  }
  return context;
}

export function TimeProvider({ children }: TimeProviderProps) {
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [frameRate, setFrameRateState] = useState<number>(30); // 30 FPS default
  const [speed, setSpeedState] = useState<number>(1); // 1x speed
  const [totalFrames, setTotalFramesState] = useState<number>(300); // 10 seconds at 30fps
  
  const animationRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number | undefined>(undefined);

  const play = useCallback(() => {
    setIsPlaying(true);
    startTimeRef.current = performance.now() - (currentTime * 1000);
    lastTimeRef.current = performance.now();
  }, [currentTime]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, []);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, []);

  const setFrameRate = useCallback((fps: number) => {
    setFrameRateState(Math.max(1, Math.min(120, fps))); // Clamp between 1-120 FPS
  }, []);

  const setSpeed = useCallback((newSpeed: number) => {
    setSpeedState(Math.max(0.1, Math.min(10, newSpeed))); // Clamp between 0.1x-10x speed
  }, []);

  const setTotalFrames = useCallback((frames: number) => {
    setTotalFramesState(Math.max(1, frames));
  }, []);

  const seekToFrame = useCallback((frame: number) => {
    const clampedFrame = Math.max(0, Math.min(totalFrames - 1, frame));
    const newTime = clampedFrame / frameRate;
    setCurrentTime(newTime);
    startTimeRef.current = performance.now() - (newTime * 1000);
  }, [frameRate, totalFrames]);

  const seekToTime = useCallback((time: number) => {
    const maxTime = (totalFrames - 1) / frameRate;
    const clampedTime = Math.max(0, Math.min(maxTime, time));
    setCurrentTime(clampedTime);
    startTimeRef.current = performance.now() - (clampedTime * 1000);
  }, [frameRate, totalFrames]);

  // Animation loop
  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!isPlaying) return;

      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsedMs = (timestamp - startTimeRef.current) * speed;
      const newTime = elapsedMs / 1000;
      const maxTime = (totalFrames - 1) / frameRate;

      if (newTime >= maxTime) {
        // Loop back to start
        setCurrentTime(0);
        startTimeRef.current = timestamp;
      } else {
        setCurrentTime(newTime);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, speed, frameRate, totalFrames]);

  const value: TimeContextValue = {
    currentTime,
    isPlaying,
    frameRate,
    speed,
    totalFrames,
    play,
    pause,
    reset,
    setFrameRate,
    setSpeed,
    setTotalFrames,
    seekToFrame,
    seekToTime,
  };

  return (
    <TimeContext.Provider value={value}>
      {children}
    </TimeContext.Provider>
  );
} 