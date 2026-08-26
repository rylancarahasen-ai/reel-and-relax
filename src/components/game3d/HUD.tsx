import { HudState } from './fishingEngine';

interface HUDProps {
  hud: HudState;
  weather: string;
  fishCaught: number;
  biggestFish: number;
  locked: boolean;
  onDismissCatch: () => void;
  onRequestLock: () => void;
}

const WEATHER_LABEL: Record<string, string> = {
  sunset: 'Sunset',
  mountain: 'Overcast',
  snow: 'Snowfall',
  rain: 'Rain',
  starry: 'Clear Night',
};

export default function HUD({
  hud,
  weather,
  fishCaught,
  biggestFish,
  locked,
  onDismissCatch,
  onRequestLock,
}: HUDProps) {
  const tensionPct = Math.min(100, (hud.tension / 1.25) * 100);
  const safeStart = (0.22 / 1.25) * 100;
  const safeWidth = ((0.92 - 0.22) / 1.25) * 100;
  const danger = hud.tension > 0.92 || hud.tension < 0.16;

  return (
    <div className="pointer-events-none absolute inset-0 select-none font-sans text-white">
      {/* top-left stats */}
      <div className="absolute left-5 top-5 rounded-lg bg-black/40 px-4 py-3 backdrop-blur-sm">
        <p className="text-xs uppercase tracking-widest text-white/60">{WEATHER_LABEL[weather] ?? weather}</p>
        <p className="text-lg font-semibold">{fishCaught} fish landed</p>
        {biggestFish > 0 && <p className="text-xs text-white/70">Best: {biggestFish.toFixed(2)} kg</p>}
      </div>

      {/* controls hint */}
      <div className="absolute right-5 top-5 rounded-lg bg-black/40 px-4 py-3 text-right text-xs leading-relaxed text-white/75 backdrop-blur-sm">
        <p><span className="font-semibold text-white">WASD</span> move · <span className="font-semibold text-white">Shift</span> sprint</p>
        <p><span className="font-semibold text-white">Hold click</span> cast · <span className="font-semibold text-white">Click</span> hook · <span className="font-semibold text-white">Hold</span> reel</p>
        <p><span className="font-semibold text-white">Tab</span> collection · <span className="font-semibold text-white">G</span> achievements · <span className="font-semibold text-white">Esc</span> free cursor</p>
      </div>

      {/* crosshair */}
      {locked && (
        <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70" />
      )}

      {/* message */}
      {hud.message && !hud.landed && (
        <div className="absolute left-1/2 top-[62%] -translate-x-1/2 rounded-md bg-black/45 px-4 py-2 text-center text-sm backdrop-blur-sm">
          {hud.message}
        </div>
      )}

      {hud.phase === 'bite' && (
        <div className="absolute left-1/2 top-[42%] -translate-x-1/2 animate-pulse text-6xl font-black text-amber-300 drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)]">
          !
        </div>
      )}

      {/* cast power */}
      {hud.phase === 'charging' && (
        <div className="absolute bottom-16 left-1/2 w-72 -translate-x-1/2">
          <p className="mb-1 text-center text-xs uppercase tracking-widest text-white/70">Cast power</p>
          <div className="h-3 overflow-hidden rounded-full bg-black/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-300 to-rose-400 transition-[width] duration-75"
              style={{ width: `${hud.power * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* fight UI */}
      {hud.phase === 'hooked' && (
        <div className="absolute bottom-14 left-1/2 w-96 -translate-x-1/2 space-y-3">
          <p className="text-center text-sm font-semibold tracking-wide text-white/90">
            {hud.hookedName} on the line
          </p>
          <div>
            <div className="mb-1 flex justify-between text-[10px] uppercase tracking-widest text-white/60">
              <span>Line tension</span>
              <span className={danger ? 'text-rose-300' : 'text-emerald-300'}>
                {hud.tension > 0.92 ? 'Too tight!' : hud.tension < 0.16 ? 'Too slack!' : 'Good'}
              </span>
            </div>
            <div className="relative h-4 overflow-hidden rounded-full bg-black/55">
              <div
                className="absolute inset-y-0 bg-emerald-500/30"
                style={{ left: `${safeStart}%`, width: `${safeWidth}%` }}
              />
              <div
                className={`absolute inset-y-0 left-0 rounded-full ${danger ? 'bg-rose-400' : 'bg-emerald-400'}`}
                style={{ width: `${tensionPct}%`, opacity: 0.85 }}
              />
            </div>
          </div>
          <div>
            <div className="mb-1 text-[10px] uppercase tracking-widest text-white/60">Landed</div>
            <div className="h-2.5 overflow-hidden rounded-full bg-black/55">
              <div className="h-full rounded-full bg-sky-300" style={{ width: `${hud.progress * 100}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* catch card */}
      {hud.landed && (
        <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-black/45 backdrop-blur-sm">
          <div className="w-80 rounded-2xl border border-white/15 bg-slate-900/90 p-6 text-center shadow-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-300">Fish landed</p>
            <h2 className="mt-2 text-2xl font-bold" style={{ color: hud.landed.color }}>
              {hud.landed.species}
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-white/5 py-2">
                <p className="text-white/50">Weight</p>
                <p className="font-semibold">{hud.landed.weight.toFixed(2)} kg</p>
              </div>
              <div className="rounded-lg bg-white/5 py-2">
                <p className="text-white/50">Length</p>
                <p className="font-semibold">{hud.landed.length} cm</p>
              </div>
              <div className="rounded-lg bg-white/5 py-2">
                <p className="text-white/50">Cast</p>
                <p className="font-semibold">{hud.landed.distance} m</p>
              </div>
              <div className="rounded-lg bg-white/5 py-2">
                <p className="text-white/50">Fight</p>
                <p className="font-semibold">{hud.landed.fightTime}s</p>
              </div>
            </div>
            <button
              onClick={onDismissCatch}
              className="mt-6 w-full rounded-lg bg-amber-400 py-2 font-semibold text-slate-900 transition hover:bg-amber-300"
            >
              Keep fishing
            </button>
          </div>
        </div>
      )}

      {/* click to play */}
      {!locked && !hud.landed && (
        <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
          <button
            onClick={onRequestLock}
            className="rounded-2xl border border-white/15 bg-slate-900/80 px-10 py-8 text-center transition hover:border-amber-300/50"
          >
            <h1 className="text-3xl font-bold tracking-tight">A Quiet Cast</h1>
            <p className="mt-2 max-w-sm text-sm text-white/70">
              Click to look around the lake. Hold the left mouse button to charge a cast, click the moment a
              fish bites, then reel while keeping the line tension in the green.
            </p>
          </button>
        </div>
      )}
    </div>
  );
}
