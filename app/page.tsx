import PracticeSession from "@/components/PracticeSession";

export default function Home() {
  return (
    <div className="flex flex-col h-screen bg-black overflow-hidden relative">
      <header className="absolute top-4 left-6 z-10 pointer-events-none">
        <h1 className="text-2xl font-bold tracking-tight text-white/50">
          Piano Pure Trace
        </h1>
      </header>

      <main className="flex-1 w-full h-full flex flex-col pt-16 px-4 pb-4">
        <PracticeSession fileUrl="/scores/sample.musicxml" />
      </main>
    </div>
  );
}
