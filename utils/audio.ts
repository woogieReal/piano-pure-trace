export const NOTE_STRINGS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export interface NoteData {
  note: string;
  octave: number;
  cents: number;
  frequency: number;
}

export function getNoteFromFrequency(frequency: number): NoteData | null {
  if (!frequency || frequency <= 0) return null;

  const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
  const midiNote = Math.round(noteNum) + 69;
  
  if (midiNote < 0) return null; // Avoid negative MIDI notes if freq is too low

  const noteIndex = midiNote % 12;
  const octave = Math.floor(midiNote / 12) - 1;
  const noteName = NOTE_STRINGS[noteIndex];

  // Calculate cents off
  // desired freq of this midi note:
  const desiredFreq = 440 * Math.pow(2, (midiNote - 69) / 12);
  // cents difference: 1200 * log2(f / desired)
  const cents = 1200 * Math.log2(frequency / desiredFreq);

  return {
    note: noteName,
    octave: octave,
    cents: cents,
    frequency: frequency
  };
}
