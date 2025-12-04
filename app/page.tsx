"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface TimerConfig {
  name: string;
  sets: number;
  action: number;
  break: number;
}

const TIMER_CONFIGS: TimerConfig[] = [
  { name: 'HIIT Workout', sets: 4, action: 20, break: 10 },
  { name: 'Tabata', sets: 8, action: 20, break: 10 },
  { name: 'Boxing Rounds', sets: 5, action: 180, break: 60 },
  { name: 'Quick Burst', sets: 10, action: 45, break: 15 },
  { name: 'Endurance', sets: 6, action: 90, break: 30 },
];

export default function IntervalTimer() {
  const [selectedConfig, setSelectedConfig] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentSet, setCurrentSet] = useState<number>(1);
  const [timeLeft, setTimeLeft] = useState<number>(TIMER_CONFIGS[0].action);
  const [isBreak, setIsBreak] = useState<boolean>(false);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  const playBeep = (frequency: number, duration: number): void => {
    if (!audioContextRef.current) return;
    
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  };

  const playStartSound = (): void => {
    playBeep(880, 0.15);
    setTimeout(() => playBeep(1046, 0.15), 150);
  };

  const playEndSound = (): void => {
    playBeep(659, 0.15);
    setTimeout(() => playBeep(523, 0.3), 150);
  };

  useEffect(() => {
    const config = TIMER_CONFIGS[selectedConfig];
    setTimeLeft(config.action);
    setCurrentSet(1);
    setIsBreak(false);
    setIsRunning(false);
    setHasStarted(false);
  }, [selectedConfig]);

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          const config = TIMER_CONFIGS[selectedConfig];
          
          if (!isBreak) {
            playEndSound();
            if (currentSet < config.sets) {
              setIsBreak(true);
              setTimeout(() => playStartSound(), 100);
              return config.break;
            } else {
              setIsRunning(false);
              setHasStarted(false);
              return 0;
            }
          } else {
            playEndSound();
            setIsBreak(false);
            setCurrentSet((s) => s + 1);
            setTimeout(() => playStartSound(), 100);
            return config.action;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, isBreak, currentSet, selectedConfig]);

  const handleStart = (): void => {
    if (!hasStarted) {
      setHasStarted(true);
      playStartSound();
    }
    setIsRunning(true);
  };

  const handlePause = (): void => {
    setIsRunning(false);
  };

  const handleReset = (): void => {
    const config = TIMER_CONFIGS[selectedConfig];
    setIsRunning(false);
    setCurrentSet(1);
    setTimeLeft(config.action);
    setIsBreak(false);
    setHasStarted(false);
  };

  const config: TimerConfig = TIMER_CONFIGS[selectedConfig];
  const progress: number = isBreak 
    ? ((config.break - timeLeft) / config.break) * 100
    : ((config.action - timeLeft) / config.action) * 100;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Config Selection */}
        <div className="mb-8 flex flex-wrap gap-2 justify-center">
          {TIMER_CONFIGS.map((cfg, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedConfig(idx)}
              disabled={isRunning}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedConfig === idx
                  ? 'bg-white text-purple-900 shadow-lg scale-105'
                  : 'bg-white/10 text-white hover:bg-white/20'
              } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {cfg.name}
            </button>
          ))}
        </div>

        {/* Main Timer Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
          {/* Timer Display */}
          <div className="relative">
            {/* Circular Progress */}
            <div className="relative w-72 h-72 mx-auto">
              <svg className="transform -rotate-90 w-full h-full">
                <circle
                  cx="144"
                  cy="144"
                  r="136"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="16"
                  fill="none"
                />
                <circle
                  cx="144"
                  cy="144"
                  r="136"
                  stroke={isBreak ? '#10b981' : '#8b5cf6'}
                  strokeWidth="16"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 136}`}
                  strokeDashoffset={`${2 * Math.PI * 136 * (1 - progress / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              
              {/* Center Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className={`text-6xl font-bold mb-2 transition-colors ${
                  isBreak ? 'text-emerald-400' : 'text-purple-300'
                }`}>
                  {formatTime(timeLeft)}
                </div>
                <div className={`text-xl font-semibold mb-1 transition-colors ${
                  isBreak ? 'text-emerald-300' : 'text-purple-200'
                }`}>
                  {isBreak ? 'BREAK' : 'ACTION'}
                </div>
                <div className="text-white/60 text-sm">
                  Set {currentSet} of {config.sets}
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4 mt-8">
            {!isRunning ? (
              <button
                onClick={handleStart}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-full p-6 shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <Play size={32} fill="white" />
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="bg-yellow-600 hover:bg-yellow-700 text-white rounded-full p-6 shadow-lg hover:shadow-xl transition-all hover:scale-105"
              >
                <Pause size={32} fill="white" />
              </button>
            )}
            <button
              onClick={handleReset}
              className="bg-slate-600 hover:bg-slate-700 text-white rounded-full p-6 shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              <RotateCcw size={32} />
            </button>
          </div>

          {/* Config Info */}
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-white/60 text-sm mb-1">Sets</div>
              <div className="text-white text-2xl font-bold">{config.sets}</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-white/60 text-sm mb-1">Action</div>
              <div className="text-purple-300 text-2xl font-bold">{config.action}s</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-white/60 text-sm mb-1">Break</div>
              <div className="text-emerald-300 text-2xl font-bold">{config.break}s</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}