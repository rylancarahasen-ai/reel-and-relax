import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { FishCatch } from '@/entities/FishCatch';
import { GameStats } from '@/entities/GameStats';
import { Achievement } from '@/entities/Achievement';
import { User } from '@/entities/User';
import Player from './Player';
import Lake from './Lake';
import Terrain from './Terrain';
import Props from './Props';
import Weather3D from './Weather3D';
import Bobber from './Bobber';
import RodView from './RodView';
import HUD from './HUD';
import CollectionPanel from './CollectionPanel';
import AchievementsPanel from './AchievementsPanel';
import { FishingEngine, HudState, INITIAL_HUD, Landed } from './fishingEngine';

const WEATHER_CYCLE = ['sunset', 'mountain', 'snow', 'rain', 'starry'];
const WEATHER_DURATION = 2.5 * 60 * 1000;

const ACHIEVEMENT_DEFS = [
  {
    id: 'first-fish',
    title: 'Every End Is A New Beginning',
    description: 'Land your first fish.',
    quote:
      'God buries our sins in the depths of the sea and then puts up a sign that says, "No Fishing". - Corrie ten Boom',
  },
  {
    id: 'set-the-hook',
    title: 'Set The Hook',
    description: 'Strike in time and hook a fish.',
    quote: 'Follow me, and I will make you fishers of men. - Matthew 4:19',
  },
  {
    id: 'line-snapped',
    title: 'Tested And Tried',
    description: 'Snap a line and cast again anyway.',
    quote: 'A righteous man falls seven times and rises again. - Proverbs 24:16',
  },
  {
    id: 'weather-perseverance',
    title: 'Weathering Perseverance',
    description: 'Fish through one full weather cycle.',
    quote: 'I can do all things through Christ who strengthens me. - Philippians 4:13',
  },
  {
    id: 'deep-water',
    title: 'Out Where It Is Deep',
    description: 'Land a fish from a cast of 25 metres or more.',
    quote: 'Put out into the deep water and let down your nets for a catch. - Luke 5:4',
  },
];

function EngineTick({
  engine,
  onHud,
}: {
  engine: FishingEngine;
  onHud: (updater: (prev: HudState) => HudState) => void;
}) {
  const { camera } = useThree();
  useFrame((_, delta) => {
    engine.update(Math.min(delta, 0.05), camera);
    onHud((prev) => engine.readHud(prev));
  });
  return null;
}

export default function Game3D() {
  const engine = useMemo(() => new FishingEngine(), []);
  const controlsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);

  const [hud, setHud] = useState<HudState>(INITIAL_HUD);
  const [locked, setLocked] = useState(false);
  const [weatherIndex, setWeatherIndex] = useState(0);
  const [showCollection, setShowCollection] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [catches, setCatches] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [unlockToast, setUnlockToast] = useState<string | null>(null);

  if (import.meta.env.DEV) (window as any).__fishing = engine;

  const weather = WEATHER_CYCLE[weatherIndex];
  engine.weather = weather;

  const achievementsRef = useRef<any[]>([]);
  achievementsRef.current = achievements;

  const unlock = useCallback(async (achievementId: string) => {
    const found = achievementsRef.current.find((a) => a.achievementId === achievementId);
    if (!found || found.unlocked) return;
    try {
      await Achievement.update(found.id, { unlocked: true, unlockedAt: Date.now() });
      const updated = await Achievement.filter({ created_by: 'local-user' });
      setAchievements(updated);
      setUnlockToast(found.title);
      window.setTimeout(() => setUnlockToast((t) => (t === found.title ? null : t)), 6000);
    } catch (error) {
      console.log('Could not unlock achievement:', error);
    }
  }, []);

  // --- data loading ---
  const loadCatches = useCallback(async () => {
    try {
      const user = await User.me();
      setCatches(await FishCatch.filter({ created_by: user.email }, '-timestamp'));
    } catch (error) {
      console.log('Could not load catches:', error);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const user = await User.me();
        const all = await GameStats.list();
        setStats(all.find((s) => s.created_by === user.email) ?? null);
      } catch (error) {
        console.log('Could not load stats:', error);
      }

      try {
        await Achievement.repairIds();
        let list = await Achievement.filter({ created_by: 'local-user' });
        for (const def of ACHIEVEMENT_DEFS) {
          if (!list.some((a) => a.achievementId === def.id)) {
            await Achievement.create({
              achievementId: def.id,
              title: def.title,
              description: def.description,
              unlockedQuote: def.quote,
              unlocked: false,
            });
          }
        }
        list = await Achievement.filter({ created_by: 'local-user' });
        setAchievements(list);
      } catch (error) {
        console.log('Could not load achievements:', error);
      }

      loadCatches();
    })();
  }, [loadCatches]);

  // --- weather cycle ---
  useEffect(() => {
    const id = setInterval(() => {
      setWeatherIndex((prev) => {
        const next = (prev + 1) % WEATHER_CYCLE.length;
        if (next === 0) unlock('weather-perseverance');
        return next;
      });
    }, WEATHER_DURATION);
    return () => clearInterval(id);
  }, [unlock]);

  // --- persistence on landing a fish ---
  const statsRef = useRef<any>(null);
  statsRef.current = stats;

  useEffect(() => {
    engine.onLanded = async (fish: Landed) => {
      try {
        await FishCatch.create({
          fishType: fish.species,
          type: fish.species,
          size: fish.length,
          length: fish.length,
          weight: fish.weight,
          distance: fish.distance,
          fightTime: fish.fightTime,
          weather: fish.weather,
          timestamp: Date.now(),
        } as any);

        const current = statsRef.current;
        const nextStats = {
          fishCaught: (current?.fishCaught ?? 0) + 1,
          biggestFish: Math.max(current?.biggestFish ?? 0, fish.weight),
          favoriteWeather: fish.weather,
        };
        const saved = current
          ? await GameStats.update(current.id, nextStats)
          : await GameStats.create(nextStats);
        setStats(saved);

        if ((current?.fishCaught ?? 0) === 0) unlock('first-fish');
        if (fish.distance >= 25) unlock('deep-water');
        loadCatches();
      } catch (error) {
        console.log('Could not save catch:', error);
      }
    };

    engine.onEvent = (event) => {
      if (event === 'hooked') unlock('set-the-hook');
      if (event === 'snapped') unlock('line-snapped');
    };
  }, [engine, unlock, loadCatches]);

  // --- input ---
  const anyPanelOpen = showCollection || showAchievements || !!hud.landed;

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (e.button !== 0 || !locked || anyPanelOpen) return;
      engine.reeling = true;
      if (engine.phase === 'bite') {
        engine.strike();
      } else if (engine.phase === 'idle') {
        engine.startCharge();
      }
    };
    const onUp = (e: MouseEvent) => {
      if (e.button !== 0) return;
      engine.reeling = false;
      if (engine.phase === 'charging') {
        const cam = cameraRef.current;
        if (cam) engine.releaseCharge(cam);
      }
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
    };
  }, [engine, locked, anyPanelOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Tab') {
        e.preventDefault();
        setShowAchievements(false);
        setShowCollection((v) => !v);
        controlsRef.current?.unlock?.();
      } else if (e.code === 'KeyG') {
        setShowCollection(false);
        setShowAchievements((v) => !v);
        controlsRef.current?.unlock?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const requestLock = () => controlsRef.current?.lock?.();

  return (
    <div className="relative h-screen w-full overflow-hidden bg-slate-950">
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ fov: 72, near: 0.05, far: 900, position: [0, 2.6, 10] }}
        onCreated={({ camera }) => {
          cameraRef.current = camera;
        }}
      >
        <Weather3D weather={weather} />
        <Terrain weather={weather} />
        <Lake weather={weather} />
        <Props weather={weather} />
        <Bobber engine={engine} />
        <RodView engine={engine} />
        <Player controlsRef={controlsRef} onLockChange={setLocked} />
        <EngineTick engine={engine} onHud={setHud} />
      </Canvas>

      <HUD
        hud={hud}
        weather={weather}
        fishCaught={stats?.fishCaught ?? 0}
        biggestFish={stats?.biggestFish ?? 0}
        locked={locked}
        onDismissCatch={() => {
          engine.reset();
          setHud((prev) => engine.readHud(prev));
          requestLock();
        }}
        onRequestLock={requestLock}
      />

      {unlockToast && (
        <div className="pointer-events-none absolute left-1/2 top-24 z-30 -translate-x-1/2 rounded-xl border border-amber-300/40 bg-slate-900/90 px-5 py-3 text-center text-white shadow-xl">
          <p className="text-[10px] uppercase tracking-[0.2em] text-amber-300">Achievement unlocked</p>
          <p className="font-semibold">{unlockToast}</p>
          <p className="text-[11px] text-white/60">Press G to read it</p>
        </div>
      )}

      {showCollection && (
        <CollectionPanel catches={catches} onClose={() => setShowCollection(false)} />
      )}
      {showAchievements && (
        <AchievementsPanel achievements={achievements} onClose={() => setShowAchievements(false)} />
      )}
    </div>
  );
}
