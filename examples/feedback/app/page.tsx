import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 via-indigo-50/30 to-purple-50/30 dark:from-zinc-950 dark:via-indigo-950/20 dark:to-purple-950/20">
      <main className="flex max-w-2xl flex-col items-center px-6 py-20 text-center">
        <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
          <span className="text-4xl">🤖</span>
        </div>

        <h1 className="mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-clip-text text-4xl font-bold tracking-tight text-transparent dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-400">
          AI Feedback Demo
        </h1>

        <p className="mb-8 max-w-md text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
          A demonstration of Axiom&apos;s user feedback system for AI capabilities.
          Chat with an AI assistant and provide feedback that links directly to
          traces.
        </p>

        <div className="mb-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/chat"
            className="rounded-xl bg-indigo-600 px-8 py-3.5 font-medium text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-500/30"
          >
            Start Chatting →
          </Link>
          <a
            href="https://axiom.co/docs/ai-engineering/observe/user-feedback"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-zinc-200 px-8 py-3.5 font-medium text-zinc-700 transition-all hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800/50"
          >
            View Docs
          </a>
        </div>

        {/* Feature cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white/60 p-5 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
              <span className="text-xl">📊</span>
            </div>
            <h3 className="mb-1 font-semibold text-zinc-900 dark:text-zinc-100">
              Trace Linking
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Feedback events are linked to AI traces for root cause analysis.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white/60 p-5 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
              <span className="text-xl">👍</span>
            </div>
            <h3 className="mb-1 font-semibold text-zinc-900 dark:text-zinc-100">
              Multiple Types
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Thumbs, ratings, text comments, and custom signals.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white/60 p-5 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
              <span className="text-xl">🔒</span>
            </div>
            <h3 className="mb-1 font-semibold text-zinc-900 dark:text-zinc-100">
              Secure by Design
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Uses ingest-only API tokens safe for browser exposure.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
