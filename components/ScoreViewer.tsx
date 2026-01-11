'use client';

import React, { useEffect, useRef, useState } from 'react';
import { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';

interface ScoreViewerProps {
  fileUrl: string;
  onOSMDLoad?: (osmd: OpenSheetMusicDisplay) => void;
}

const ScoreViewer: React.FC<ScoreViewerProps> = ({ fileUrl, onOSMDLoad }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize OSMD
    const osmd = new OpenSheetMusicDisplay(containerRef.current, {
      autoResize: true,
      backend: 'svg',
      drawingParameters: 'compacttight',
      drawTitle: true,
      drawSubtitle: false,
      drawCredits: false,
      drawPartNames: false,
      drawFingerings: true,
      followCursor: true,
    });

    // Load and render
    const loadScore = async () => {
      try {
        await osmd.load(fileUrl);
        await osmd.render();
        // Enable cursor after render
        if (osmd.cursor) {
          osmd.cursor.show();
          osmd.cursor.reset(); // Ensure valid start state
        }

        // Notify parent only after full load to ensure cursor is ready
        if (onOSMDLoad) onOSMDLoad(osmd);

        // DEBUG: Expose to window
        (window as any).osmd = osmd;

      } catch (err: any) {
        console.error("OSMD Load Error:", err);
        setError(err.message || "Failed to load score");
      }
    };

    loadScore();

    // Clean up
    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
      osmdRef.current = null;
    };
  }, [fileUrl, onOSMDLoad]);

  return (
    <div className="w-full bg-white text-black p-4 rounded-xl shadow-lg overflow-hidden">
      {error && <div className="text-red-500 mb-2">Error: {error}</div>}
      <div ref={containerRef} className="w-full h-auto min-h-[300px]" />
    </div>
  );
};

export default ScoreViewer;
