interface AchievementsPanelProps {
  achievements: any[];
  onClose: () => void;
}

export default function AchievementsPanel({ achievements, onClose }: AchievementsPanelProps) {
  const unlocked = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center bg-slate-950/75 p-6 backdrop-blur-sm">
      <div className="max-h-[80vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/95 p-6 text-white shadow-2xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold">Achievements</h2>
            <p className="text-sm text-white/60">
              {unlocked} of {achievements.length} unlocked
            </p>
          </div>
          <button onClick={onClose} className="rounded-md bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20">
            Close
          </button>
        </div>

        <div className="space-y-3">
          {achievements.map((a) => (
            <div
              key={a.achievementId}
              className={`rounded-xl border p-4 ${
                a.unlocked ? 'border-amber-300/30 bg-amber-300/5' : 'border-white/5 bg-white/[0.02] opacity-60'
              }`}
            >
              <h3 className={`font-semibold ${a.unlocked ? 'text-amber-200' : 'text-white/80'}`}>{a.title}</h3>
              <p className="mt-1 text-sm text-white/65">{a.description}</p>
              {a.unlocked && a.unlockedQuote && (
                <p className="mt-3 border-l-2 border-amber-300/40 pl-3 text-xs italic text-white/60">
                  {a.unlockedQuote}
                </p>
              )}
            </div>
          ))}
          {achievements.length === 0 && (
            <p className="text-sm text-white/60">No achievements available yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
