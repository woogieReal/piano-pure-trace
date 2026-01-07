'use client';

import React, { useEffect, useRef, useState } from 'react';
import { PitchDetector } from 'pitchy';
import { getNoteFromFrequency, NoteData } from '@/utils/audio';

interface AudioAnalyzerProps {
  onNoteDetected?: (noteData: NoteData | null) => void;
}

const AudioAnalyzer: React.FC<AudioAnalyzerProps> = ({ onNoteDetected }) => {
  const [isListening, setIsListening] = useState(false);
  const [noteData, setNoteData] = useState<NoteData | null>(null);
  const [clarity, setClarity] = useState(0);
  const [volume, setVolume] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafId = useRef<number | null>(null);

  const startListening = async () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsListening(true);
      updatePitch();
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access denied or error occurred.");
    }
  };

  const stopListening = () => {
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsListening(false);
    setNoteData(null);
    setClarity(0);
    setVolume(0);
  };

  const updatePitch = () => {
    if (!analyserRef.current || !audioContextRef.current) return;

    const analyser = analyserRef.current;
    const buffer = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buffer);

    // Calculate Volume (RMS)
    let sumSquares = 0;
    for (const amplitude of buffer) {
      sumSquares += amplitude * amplitude;
    }
    const rms = Math.sqrt(sumSquares / buffer.length);
    setVolume(rms);

    // Detect Pitch
    const detector = PitchDetector.forFloat32Array(analyser.fftSize);
    const [frequency, confidence] = detector.findPitch(buffer, audioContextRef.current.sampleRate);

    setClarity(confidence);

    if (confidence > 0.8 && rms > 0.01) { // Thresholds
      const data = getNoteFromFrequency(frequency);
      setNoteData(data);
      if (onNoteDetected) onNoteDetected(data);
    } else {
      // Keep last note or clear? Let's clear if very quiet or unclear
      if (rms < 0.01) setNoteData(null);
    }

    rafId.current = requestAnimationFrame(updatePitch);
  };

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-900 text-white rounded-xl shadow-2xl max-w-md w-full mx-auto mt-10 border border-gray-700">
      <h2 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
        Audio Analyzer
      </h2>

      <div className="mb-8 flex flex-col items-center justify-center w-40 h-40 rounded-full border-4 border-gray-700 bg-gray-800 relative shadow-inner">
        {noteData ? (
          <>
            <span className="text-5xl font-extrabold text-white z-10">
              {noteData.note}{noteData.octave}
            </span>
            <span className="text-sm text-gray-400 mt-2 z-10">
              {noteData.frequency.toFixed(1)} Hz
            </span>

            {/* Visual indicator for cents off */}
            <div className="absolute bottom-4 w-20 h-1 bg-gray-600 rounded-full overflow-hidden">
              <div
                className={`h-full ${Math.abs(noteData.cents) < 10 ? 'bg-green-500' : 'bg-red-500'}`}
                style={{
                  width: '4px',
                  transform: `translateX(${40 + noteData.cents}px)`, // simple approx mapping, assumes -40 to 40 range visible
                  transition: 'transform 0.1s'
                }}
              />
            </div>
          </>
        ) : (
          <span className="text-gray-500">Listening...</span>
        )}

        {/* Volume Ring */}
        <div
          className="absolute rounded-full border-2 border-blue-500/50 transition-all duration-75"
          style={{
            width: `${100 + volume * 500}px`,
            height: `${100 + volume * 500}px`,
            opacity: Math.min(volume * 5, 0.5)
          }}
        />
      </div>

      <div className="w-full flex justify-between text-xs text-gray-400 mb-4 px-4">
        <span>Clarity: {(clarity * 100).toFixed(0)}%</span>
        <span>Volume: {(volume * 100).toFixed(0)}%</span>
      </div>

      <button
        onClick={isListening ? stopListening : startListening}
        className={`px-8 py-3 rounded-full font-semibold transition-all shadow-lg transform active:scale-95 ${isListening
            ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30'
            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30'
          }`}
      >
        {isListening ? 'Stop Mic' : 'Start Mic'}
      </button>
    </div>
  );
};

export default AudioAnalyzer;
