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
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const handleStart = () => {
    if (scoreEngineRef.current) {
      scoreEngineRef.current.reset(); // Reset score on start
    }
    setCountdown(3); // Start Countdown
  };

  const handleStop = () => {
    if (scoreEngineRef.current) {
      scoreEngineRef.current.stop();
    }
    setIsPlaying(false);
    setIsMicActive(false); // Auto-disable Mic
    setCountdown(null); // Reset countdown
  };

  // Callback from ScoreViewer
  const handleOSMDLoad = (osmd: OpenSheetMusicDisplay) => {
    console.log("PracticeSession: OSMD Loaded, initializing Engine");
    scoreEngineRef.current = new ScoreEngine(osmd);

    // Set completion callback
    scoreEngineRef.current.setOnComplete(() => {
      handleStop(); // Reset UI when score ends
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
      // Start Game
      if (scoreEngineRef.current) {
        scoreEngineRef.current.start();
        setIsPlaying(true);
        setIsMicActive(true); // Enable Mic
      }
      setCountdown(null); // Hide countdown
    }
  }, [countdown]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (scoreEngineRef.current) scoreEngineRef.current.stop();
    }
  }, []);

  return (
    <div className="flex flex-col h-full w-full max-w-none bg-neutral-900 text-white overflow-hidden relative">

      {/* Countdown Overlay */}
      {countdown !== null && countdown > 0 && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
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
          {!isPlaying ? (
            <button
              onClick={handleStart}
              disabled={countdown !== null}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full font-bold shadow-lg transition disabled:opacity-50"
            >
              Start
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full font-bold shadow-lg transition"
            >
              Stop
            </button>
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
