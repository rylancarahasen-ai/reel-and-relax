import { SPECIES } from './fishData';

interface CollectionPanelProps {
  catches: any[];
  onClose: () => void;
}

export default function CollectionPanel({ catches, onClose }: CollectionPanelProps) {
  const bySpecies = new Map<string, { count: number; best: number; bestLength: number }>();
  catches.forEach((c) => {
    const name = c.fishType || c.type || 'Unknown';
    const weight = typeof c.weight === 'number' ? c.weight : (c.size ?? 0) / 10;
    const entry = bySpecies.get(name) ?? { count: 0, best: 0, bestLength: 0 };
    entry.count += 1;
    entry.best = Math.max(entry.best, weight);
    entry.bestLength = Math.max(entry.bestLength, c.length ?? 0);
    bySpecies.set(name, entry);
  });

  const discovered = SPECIES.filter((s) => bySpecies.has(s.name)).length;

  return (
    <div className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center bg-slate-950/75 p-6 backdrop-blur-sm">
      <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/95 p-6 text-white shadow-2xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold">Fish Collection</h2>
            <p className="text-sm text-white/60">
              {discovered} of {SPECIES.length} species · {catches.length} total catches
            </p>
          </div>
          <button onClick={onClose} className="rounded-md bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20">
            Close
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {SPECIES.map((s) => {
            const entry = bySpecies.get(s.name);
            return (
              <div
                key={s.name}
                className={`rounded-xl border p-4 ${
                  entry ? 'border-white/15 bg-white/5' : 'border-white/5 bg-white/[0.02] opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-3.5 w-3.5 rounded-full"
                    style={{ backgroundColor: entry ? s.color : '#475569' }}
                  />
                  <h3 className="font-semibold">{s.name}</h3>
                </div>
                {entry ? (
                  <p className="mt-2 text-xs text-white/70">
                    Caught {entry.count}× · best {entry.best.toFixed(2)} kg
                    {entry.bestLength ? ` · ${entry.bestLength} cm` : ''}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-white/50">
                    Not caught yet{s.weather ? ` · appears in ${s.weather} weather` : ''}
                    {s.minDistance ? ` · needs a ${s.minDistance} m cast` : ''}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
