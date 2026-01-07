import PracticeSession from "@/components/PracticeSession";

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-black">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start w-full max-w-4xl">
        <div className="text-center w-full">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl mb-4">
            Piano Pure Trace
          </h1>
          <p className="text-lg text-gray-400">
            Real-time on-device piano practice assistant.
          </p>
        </div>

        <PracticeSession fileUrl="/scores/sample.musicxml" />

      </main>

      <footer className="row-start-3 text-gray-600 text-sm">
        Powered by Web Audio API & OSMD
      </footer>
    </div>
  );
}
