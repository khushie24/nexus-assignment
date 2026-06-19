import Link from "next/link";

export default function DashboardPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f6f2] px-5 text-zinc-950">
      <section className="max-w-lg rounded-md border border-zinc-200 bg-white p-7 text-center shadow-xl shadow-zinc-200/70">
        <h1 className="text-2xl font-semibold">Run an analysis first</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          The founder dashboard is generated from your product input, competitor
          set, lead shortlist, and recommendation engine output.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex rounded-md bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
        >
          Start analysis
        </Link>
      </section>
    </main>
  );
}
