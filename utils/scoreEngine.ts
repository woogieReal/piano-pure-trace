import { OpenSheetMusicDisplay, Note } from "opensheetmusicdisplay";
import { NoteData } from "./audio";

export class ScoreEngine {
  private osmd: OpenSheetMusicDisplay;
  private isPlaying: boolean = false;
  private bpm: number = 60;
  private noteTimer: NodeJS.Timeout | null = null;
  private currentNoteHit: boolean = false;
  private onComplete: (() => void) | null = null;

  constructor(osmd: OpenSheetMusicDisplay) {
    this.osmd = osmd;
    console.log("ScoreEngine: Initialized with OSMD instance");
  }

  public setBPM(bpm: number) {
    this.bpm = bpm;
  }

  public setOnComplete(callback: () => void) {
    this.onComplete = callback;
  }

  public start() {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.processCurrentNote();
  }

  public stop() {
    this.isPlaying = false;
    if (this.noteTimer) {
      clearTimeout(this.noteTimer);
      this.noteTimer = null;
    }
  }

  private processCurrentNote() {
    if (!this.isPlaying) return;
    if (!this.osmd.cursor) return;

    // Ensure valid notes under cursor
    const notes = this.osmd.cursor.NotesUnderCursor();
    if (!notes || notes.length === 0) {
      // End of score or empty measure
      // Try next step immediately? Or finish?
      // For now, let's treat expectedNotes length check as end condition logic
    }

    // Reset hit state for new note
    this.currentNoteHit = false;

    // Calculate duration
    // RealValue 0.25 = Quarter Note = 1 Beat
    // Duration (ms) = (RealValue * 4) * (60000 / BPM)
    // Example: Quarter(0.25) * 4 = 1.  At 60BPM (60000ms per beat) -> 1000ms.
    let durationMs = 1000; // Default

    const iterator = this.osmd.cursor.Iterator;
    if (iterator && iterator.CurrentVoiceEntries && iterator.CurrentVoiceEntries.length > 0) {
      const firstNote = iterator.CurrentVoiceEntries[0].Notes[0];
      if (firstNote && firstNote.Length) {
        const realValue = firstNote.Length.RealValue;
        durationMs = (realValue * 4) * (60000 / this.bpm);
      }
    }

    // console.log(`ScoreEngine: Processing Note. Duration: ${durationMs}ms`);

    // Set Timer for next move
    this.noteTimer = setTimeout(() => {
      if (!this.currentNoteHit) {
        // Time's up and no hit -> MISS
        console.log("Time's up! MISS.");
        this.colorCurrentNotes("#ef4444"); // Red
      }

      // Move to next
      if (this.osmd.cursor.Iterator.EndReached) {
        console.log("ScoreEngine: End reached");
        this.stop();
        if (this.onComplete) this.onComplete();
      } else {
        this.next();
        // Recursive loop
        this.processCurrentNote();
      }
    }, durationMs);
  }

  public getExpectedNotes(): { note: string; octave: number }[] {
    if (!this.osmd.cursor) {
      console.warn("ScoreEngine: No cursor found!");
      return [];
    }

    // Check if cursor initialized
    if (!this.osmd.cursor.Iterator) {
      console.warn("ScoreEngine: Cursor Iterator is null");
      return [];
    }

    const iterator = this.osmd.cursor.Iterator;
    const voices = iterator.CurrentVoiceEntries;

    if (!voices || voices.length === 0) {
      console.log("ScoreEngine: No voices under cursor. Measure Index:", iterator.CurrentMeasureIndex);
    }

    const expectedNotes: { note: string; octave: number }[] = [];

    voices.forEach((voiceEntry, vIdx) => {
      voiceEntry.Notes.forEach((note, nIdx) => {
        // console.log(`ScoreEngine: Checking note [${vIdx}][${nIdx}]`, note);

        if (note.Pitch) {
          // Try property access first (Most Robust)
          const fundamentalNote = (note.Pitch as any).fundamentalNote;
          const octave = (note.Pitch as any).octave;

          if (fundamentalNote !== undefined) {
            const tones = ["C", "D", "E", "F", "G", "A", "B"];
            const noteChar = tones[fundamentalNote];

            // halfTone 기반 옥타브 계산 (예: Middle C = 48 -> 48/12 = 4)
            const halfTone = (note.Pitch as any).halfTone;
            let calculatedOctave = (note.Pitch as any).octave; // Fallback

            if (halfTone !== undefined) {
              calculatedOctave = Math.floor(halfTone / 12);
              // console.log(`ScoreEngine: Calculated octave ${calculatedOctave} from halfTone ${halfTone}`);
            }

            if (noteChar) {
              expectedNotes.push({
                note: noteChar,
                octave: calculatedOctave
              });
              return; // Continue to next note
            }
          }

          // Fallback: String Parsing (Updated Regex)
          const noteName = note.Pitch.ToString();
          const descriptiveMatch = noteName.match(/Key:\s*([A-G][#b]?)[^o]*octave:\s*(-?\d+)/i);

          if (descriptiveMatch) {
            expectedNotes.push({
              note: descriptiveMatch[1],
              octave: parseInt(descriptiveMatch[2], 10)
            });
          } else {
            // Try old regex just in case
            const simpleMatch = noteName.match(/([A-G][#b]?)(-?\d+)/);
            if (simpleMatch) {
              expectedNotes.push({
                note: simpleMatch[1],
                octave: parseInt(simpleMatch[2], 10)
              });
            } else {
              console.warn(`ScoreEngine: Pitch parsing failed for ${noteName}`);
            }
          }
        } else {
          console.warn(`ScoreEngine: Note has no Pitch object`);
        }
      });
    });

    return expectedNotes;
  }

  public checkInput(playedNote: NoteData): boolean {
    if (!this.isPlaying) return false;

    // If already hit, specific to this note, don't re-process (optional)
    if (this.currentNoteHit) return true;

    // console.log("ScoreEngine: compareAndMove called with:", playedNote);
    const expected = this.getExpectedNotes();
    // console.log("ScoreEngine: Expected notes:", expected);

    if (expected.length === 0) {
      // console.log("ScoreEngine: No expected notes, ignoring input");
      return false;
    }

    const match = expected.some(exp =>
      this.normalizeNoteName(exp.note) === this.normalizeNoteName(playedNote.note) &&
      exp.octave === playedNote.octave
    );

    if (match) {
      console.log("HIT! Coloring Green");
      this.colorCurrentNotes("#22c55e"); // Green-500
      this.currentNoteHit = true;
      // Do NOT call next() here. The timer handles it.
      return true;
    }

    return false;
  }

  public next() {
    if (this.osmd.cursor) {
      this.osmd.cursor.next();
      // cursorMoved logic removed as it's no longer needed for step-mode
    }
  }

  private colorCurrentNotes(color: string) {
    console.log(`ScoreEngine: colorCurrentNotes called with color: ${color}`);
    if (!this.osmd.cursor) {
      console.warn("ScoreEngine: No cursor available for coloring");
      return;
    }

    try {
      // osmd.cursor: 악보상의 현재 위치를 관리하고 제어하는 객체입니다. (내부 Iterator 포함)
      const cursor = this.osmd.cursor as any;
      console.log('ScoreEngine: Cursor object:', cursor);

      // GNotes (Graphical Notes): 현재 커서 위치에 렌더링된 시각적 음표 객체들의 배열입니다.
      // 이 객체들을 통해 SVG 요소를 찾거나 VexFlow 스타일을 수정하여 색상을 바꿀 수 있습니다.
      const gNotes = cursor.GNotesUnderCursor();
      console.log(`ScoreEngine: Found ${gNotes?.length || 0} Graphical Notes (gNotes):`, gNotes);

      if (gNotes && Array.isArray(gNotes)) {
        gNotes.forEach((gNote: any, index: number) => {
          let success = false;
          console.log(`ScoreEngine: Processing gNote [${index}]`, gNote);

          // Strategy 1: Direct SVG Manipulation (OSMD 1.3+)
          if (gNote.getNoteheadSVGs) {
            const svgs = gNote.getNoteheadSVGs();
            console.log(`ScoreEngine: getNoteheadSVGs returned ${svgs?.length} elements`, svgs);

            if (svgs && svgs.length > 0) {
              svgs.forEach((svg: SVGElement, svgIdx: number) => {
                const oldFill = svg.getAttribute("fill");
                // Color Parent
                svg.setAttribute("fill", color);
                svg.style.fill = color;
                svg.style.stroke = color;

                // Color Children (Paths, Ellipses, etc override parent)
                const children = svg.querySelectorAll("path, ellipse, rect, polygon");
                children.forEach(child => {
                  child.setAttribute("fill", color);
                  (child as HTMLElement).style.fill = color;
                  (child as HTMLElement).style.stroke = color;
                });

                console.log(`ScoreEngine: Applied SVG color to element [${svgIdx}] and ${children.length} children. Old fill: ${oldFill}, New fill: ${color}`);
              });
              success = true;
            }
          } else {
            console.warn("ScoreEngine: gNote.getNoteheadSVGs function missing");
          }

          // Strategy 2: VexFlow Style (Apply ALWAYS key for persistence)
          if (gNote.vfnote && gNote.vfnote[0]) {
            console.log("ScoreEngine: Attempting VexFlow styling for persistence");
            const vfNote = gNote.vfnote[0];
            if (vfNote.setStyle) {
              vfNote.setStyle({ fillStyle: color, strokeStyle: color });
              console.log("ScoreEngine: Applied VexFlow setStyle for persistence");
              success = true;
            } else {
              console.warn("ScoreEngine: vfNote.setStyle function missing for VexFlow persistence");
            }
          }

          // Strategy 3: Persistence
          if (gNote.sourceNote) {
            gNote.sourceNote.NoteheadColor = color;
            console.log("ScoreEngine: Set sourceNote.NoteheadColor (Persistence)");
          }

          if (!success) {
            console.warn("ScoreEngine: Failed to apply immediate visual color change to this note.");
          }
        });
      } else {
        console.warn("ScoreEngine: No Graphical Notes found under cursor.");
      }
    } catch (e) {
      console.error("ScoreEngine: Exception in colorCurrentNotes:", e);
    }
  }

  private normalizeNoteName(note: string): string {
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
