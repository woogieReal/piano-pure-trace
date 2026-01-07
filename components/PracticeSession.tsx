'use client';

import React, { useRef, useState, useEffect } from 'react';
import AudioAnalyzer from "@/components/AudioAnalyzer";
import ScoreViewer from "@/components/ScoreViewer";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import { ScoreEngine } from "@/utils/scoreEngine";
import { NoteData } from "@/utils/audio";

// We need AudioAnalyzer to bubble up the detected note.
// Since AudioAnalyzer currently manages its own state, we'll need to modify it slightly 
// OR simpler: we can just copy the `AudioAnalyzer.tsx` logic into a cleaner hook or 
// modify `AudioAnalyzer` to accept an `onNoteDetected` callback.
// For now, I will assume we modify AudioAnalyzer to take `onNoteDetected`.

interface PracticeSessionProps {
  fileUrl: string;
}

const PracticeSession: React.FC<PracticeSessionProps> = ({ fileUrl }) => {
  const [lastNote, setLastNote] = useState<NoteData | null>(null);
  const scoreEngineRef = useRef<ScoreEngine | null>(null);
  const [feedback, setFeedback] = useState<string>("");

  // Callback when OSMD is ready
  const handleOSMDLoad = (osmd: OpenSheetMusicDisplay) => {
    console.log("OSMD Loaded, initializing Engine");
    scoreEngineRef.current = new ScoreEngine(osmd);
  };

  // Callback from AudioAnalyzer (We need to update AudioAnalyzer to support this)
  const handleNoteDetected = (noteData: NoteData | null) => {
    setLastNote(noteData);

    if (noteData && scoreEngineRef.current) {
      const hit = scoreEngineRef.current.compareAndMove(noteData);
      if (hit) {
        setFeedback("Correct!");
        setTimeout(() => setFeedback(""), 500);
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className={`text-center h-8 font-bold text-xl transition-colors ${feedback === 'Correct!' ? 'text-green-500' : 'text-gray-500'}`}>
        {feedback}
      </div>

      <div className="w-full flex flex-col md:flex-row gap-6">
        <div className="flex-1 min-h-[400px]">
          <ScoreViewer fileUrl={fileUrl} onOSMDLoad={handleOSMDLoad} />
        </div>
        <div className="w-full md:w-80 flex-shrink-0">
          <AudioAnalyzer onNoteDetected={handleNoteDetected} />
        </div>
      </div>
    </div>
  );
};

export default PracticeSession;
