export default function Home() {
  const weekday = new Date().toLocaleDateString("en-US", { weekday: "long" });

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-zinc-50 px-6 text-center dark:bg-black">
      <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
        Exercise Tracker
      </h1>
      <p className="text-5xl font-bold text-black dark:text-zinc-50">{weekday}</p>
    </div>
  );
}
