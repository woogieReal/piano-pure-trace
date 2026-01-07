import { OpenSheetMusicDisplay, Note } from "opensheetmusicdisplay";
import { NoteData } from "./audio";

export class ScoreEngine {
  private osmd: OpenSheetMusicDisplay;
  private cursorMoved: boolean = false;

  constructor(osmd: OpenSheetMusicDisplay) {
    this.osmd = osmd;
  }

  public getExpectedNotes(): { note: string; octave: number }[] {
    // This is a simplified extraction. 
    // In a real app, we need to handle chords, voices, etc.
    // OSMD Cursor iterator gives us the notes currently under the cursor.
    if (!this.osmd.cursor) return [];

    const iterator = this.osmd.cursor.Iterator;
    const voices = iterator.CurrentVoiceEntries;

    const expectedNotes: { note: string; octave: number }[] = [];

    voices.forEach(voiceEntry => {
      voiceEntry.Notes.forEach(note => {
        // Note Pitch: step (C, D, E...), octave (4, 5...)
        if (note.Pitch) {
          // Map OSMD Pitch to our NoteData format
          // OSMD uses "C", "C#", etc. Our audio util calls them the same.
          // However, we need to be careful with flats vs sharps.
          // For Phase 1/2 we'll assume C Major / sharpened keys for simplicity or handle simple mapping.
          let step = note.Pitch.FundamentalNote.toString().replace("None", ""); // Returns "C", "D"...

          // Handle Accidental
          // This part of OSMD API can be tricky.
          // For now, let's just grab the calculated pitch if possible, or build it.
          // Pitch.ToString() often returns "C4" or "C#4".
          // Let's rely on basic step + render accidental checking if needed.

          // Better approach: Use half-tone steps from C0?
          // note.Pitch.getHalfTone() might be available.

          // Let's try to reconstruct the name manually which is safer.
          const noteName = note.Pitch.ToString(); // e.g. "C4", "C#4"

          // Regex to split Note and Octave
          const match = noteName.match(/([A-G][#b]?)(-?\d+)/);
          if (match) {
            expectedNotes.push({
              note: match[1], // "C", "C#"
              octave: parseInt(match[2], 10)
            });
          }
        }
      });
    });

    return expectedNotes;
  }

  public compareAndMove(playedNote: NoteData): boolean {
    const expected = this.getExpectedNotes();
    if (expected.length === 0) return false;

    // Simple matching logic: 
    // If the played note matches ANY of the notes at the current cursor position.

    const match = expected.some(exp =>
      this.normalizeNoteName(exp.note) === this.normalizeNoteName(playedNote.note) &&
      exp.octave === playedNote.octave
    );

    if (match) {
      this.next();
      return true;
    }
    return false;
  }

  public next() {
    if (this.osmd.cursor) {
      this.osmd.cursor.next();
      this.cursorMoved = true;
    }
  }

  private normalizeNoteName(note: string): string {
    // Basic enharmonic equivalent handling could go here.
    // e.g. Db == C#
    const enhancements: { [key: string]: string } = {
      "Db": "C#",
      "Eb": "D#",
      "Gb": "F#",
      "Ab": "G#",
      "Bb": "A#"
    };
    return enhancements[note] || note;
  }
}
