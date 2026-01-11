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
  // Remove unused state
  // const [lastNote, setLastNote] = useState<NoteData | null>(null);

  // Callback from ScoreViewer
  const handleOSMDLoad = (osmd: OpenSheetMusicDisplay) => {
    console.log("PracticeSession: OSMD Loaded, initializing Engine");
    scoreEngineRef.current = new ScoreEngine(osmd);
  };

  // When a note is picked up by the analyzer
  const handleNoteDetected = (noteData: NoteData | null) => {
    // Ignore null data or if engine not ready
    if (!noteData || !scoreEngineRef.current) return;

    scoreEngineRef.current.checkInput(noteData);
  };

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);

  const handleStart = () => {
    if (scoreEngineRef.current) {
      scoreEngineRef.current.start();
      setIsPlaying(true);
      setIsMicActive(true); // Auto-enable Mic
    }
  };

  const handleStop = () => {
    if (scoreEngineRef.current) {
      scoreEngineRef.current.stop();
      setIsPlaying(false);
      setIsMicActive(false); // Auto-disable Mic
    }
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (scoreEngineRef.current) scoreEngineRef.current.stop();
    }
  }, []);

  return (
    <div className="flex flex-col h-full w-full max-w-none bg-neutral-900 text-white overflow-hidden">
      {/* Top Section: Score */}
      <div className="flex-1 w-full bg-white relative overflow-hidden">
        <ScoreViewer
          fileUrl="/scores/sample.musicxml"
          onOSMDLoad={handleOSMDLoad}
        />

        {/* Controls Overlay */}
        <div className="absolute top-4 right-4 flex gap-2">
          {!isPlaying ? (
            <button
              onClick={handleStart}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full font-bold shadow-lg transition"
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
