'use client';

import React, { useRef, useState } from 'react';
import AudioAnalyzer from "@/components/AudioAnalyzer";
import ScoreViewer from "@/components/ScoreViewer";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import { ScoreEngine } from "@/utils/scoreEngine";
import { NoteData } from "@/utils/audio";

interface PracticeSessionProps {
  fileUrl: string;
}

const PracticeSession: React.FC<PracticeSessionProps> = ({ fileUrl }) => {
  const [lastNote, setLastNote] = useState<NoteData | null>(null);
  const scoreEngineRef = useRef<ScoreEngine | null>(null);

  // Callback when OSMD is ready
  const handleOSMDLoad = (osmd: OpenSheetMusicDisplay) => {
    console.log("PracticeSession: OSMD Loaded, initializing Engine");
    scoreEngineRef.current = new ScoreEngine(osmd);
  };

  // Callback from AudioAnalyzer
  const handleNoteDetected = (noteData: NoteData | null) => {
    setLastNote(noteData);
    console.log("PracticeSession: Note Detected:", noteData);

    if (noteData) {
      if (scoreEngineRef.current) {
        console.log("PracticeSession: Engine found, calling compareAndMove");
        scoreEngineRef.current.compareAndMove(noteData);
      } else {
        console.warn("PracticeSession: Engine ref is NULL - Note detected but engine not ready");
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full h-full">
      <div className="w-full flex flex-col md:flex-row gap-6 h-full">
        <div className="flex-1 min-h-[400px] h-full bg-white rounded-xl shadow-lg ring-4 ring-gray-800 flex flex-col">
          <div className="flex-1 overflow-auto p-2">
            <ScoreViewer fileUrl={fileUrl} onOSMDLoad={handleOSMDLoad} />
          </div>
        </div>

        <div className="w-full md:w-80 flex-shrink-0 flex items-start justify-center pt-8">
          <AudioAnalyzer onNoteDetected={handleNoteDetected} />
        </div>
      </div>
    </div>
  );
};

export default PracticeSession;
