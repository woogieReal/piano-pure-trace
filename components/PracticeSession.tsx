'use client';

import React, { useRef, useState, useEffect } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';
import ScoreViewer from "@/components/ScoreViewer";
import AudioAnalyzer from "@/components/AudioAnalyzer";
import { ScoreEngine } from "@/utils/scoreEngine";
import { NoteData } from "@/utils/audio";

interface PracticeSessionProps {
  fileUrl: string;
}

const PracticeSession: React.FC<PracticeSessionProps> = ({ fileUrl }) => {
  const scoreEngineRef = useRef<ScoreEngine | null>(null);

  // State
  // isPlaying: Engine is running and game is active
  // isPaused: Game was active but user passed Stop. Cursor remains.
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);

  const [countdown, setCountdown] = useState<number | null>(null);
  const [countdownAction, setCountdownAction] = useState<'START' | 'RESUME' | 'RESET' | null>(null);

  // Initial Start (effectively Restart/Reset logic)
  const handleStart = () => {
    setCountdownAction('START');
    setCountdown(3);
  };

  const handleContinue = () => {
    setCountdownAction('RESUME');
    setCountdown(3);
  };

  const handleReset = () => {
    setCountdownAction('RESET');
    setCountdown(3);
  };

  const handleStop = () => {
    if (scoreEngineRef.current) {
      scoreEngineRef.current.stop();
    }
    setIsPlaying(false);
    setIsPaused(true); // Mark as paused so we can show Continue/Reset
    setIsMicActive(false); // Auto-disable Mic
    setCountdown(null); // Stop any pending countdown
  };

  // Called when song finishes naturally
  const handleComplete = () => {
    setIsPlaying(false);
    setIsPaused(false); // Finished means back to initial state? Or paused at end?
    // User requested: "Initial state" on complete.
    setIsMicActive(false);
    setCountdown(null);
  };

  // Callback from ScoreViewer
  const handleOSMDLoad = (osmd: OpenSheetMusicDisplay) => {
    console.log("PracticeSession: OSMD Loaded, initializing Engine");
    scoreEngineRef.current = new ScoreEngine(osmd);

    // Set completion callback
    scoreEngineRef.current.setOnComplete(() => {
      handleComplete();
    });
  };

  // When a note is picked up by the analyzer
  const handleNoteDetected = (noteData: NoteData | null) => {
    // Ignore null data or if engine not ready
    if (!noteData || !scoreEngineRef.current) return;
    scoreEngineRef.current.checkInput(noteData);
  };

  // Countdown Logic
  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      // Countdown finished, execute action
      if (scoreEngineRef.current && countdownAction) {
        if (countdownAction === 'START' || countdownAction === 'RESET') {
          scoreEngineRef.current.reset(); // Clear previous state
          scoreEngineRef.current.start();
        } else if (countdownAction === 'RESUME') {
          scoreEngineRef.current.start(); // Just start (resume)
        }

        setIsPlaying(true);
        setIsPaused(false);
        setIsMicActive(true); // Enable Mic
      }
      setCountdown(null); // Hide countdown overlay
      setCountdownAction(null);
    }
  }, [countdown, countdownAction]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (scoreEngineRef.current) scoreEngineRef.current.stop();
    }
  }, []);

  return (
    <div className="flex flex-col h-full w-full max-w-none bg-neutral-900 text-white overflow-hidden relative">

      {/* Countdown Overlay */}
      {countdown !== null && countdown > 0 && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="text-9xl font-black text-white animate-bounce">
            {countdown}
          </div>
        </div>
      )}

      {/* Top Section: Score */}
      <div className="flex-1 w-full bg-white relative overflow-hidden">
        <ScoreViewer
          fileUrl="/scores/sample.musicxml"
          onOSMDLoad={handleOSMDLoad}
        />

        {/* Controls Overlay */}
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          {/* Case 1: Playing -> Show Stop */}
          {isPlaying && (
            <button
              onClick={handleStop}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-bold shadow-lg transition transform hover:scale-105"
            >
              Stop
            </button>
          )}

          {/* Case 2: Not Playing & Not Paused (Initial) -> Show Start */}
          {!isPlaying && !isPaused && (
            <button
              onClick={handleStart}
              disabled={countdown !== null}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full font-bold shadow-lg transition transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
            >
              Start
            </button>
          )}

          {/* Case 3: Not Playing & Paused -> Show Continue / Reset */}
          {!isPlaying && isPaused && (
            <div className="flex gap-4">
              <button
                onClick={handleContinue}
                disabled={countdown !== null}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-bold shadow-lg transition transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
              >
                Continue
              </button>
              <button
                onClick={handleReset}
                disabled={countdown !== null}
                className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-full font-bold shadow-lg transition transform hover:scale-105 disabled:opacity-50 disabled:scale-100"
              >
                Reset
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Audio/Piano */}
      <div className="flex-none w-full h-[35vh] min-h-[300px] border-t border-neutral-800 bg-black">
        <AudioAnalyzer
          isActive={isMicActive}
          onNoteDetected={handleNoteDetected}
        />
      </div>
    </div>
  );
};

export default PracticeSession;
