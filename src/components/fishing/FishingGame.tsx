import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameStats } from '@/entities/GameStats';
import { User } from '@/entities/User';
import GameBackground from './GameBackground';
import Fisherman from './Fisherman';
import FishingMechanics from './FishingMechanics';
import GameUI from './GameUI';
import WeatherSystem from './WeatherSystem';
import { FishCatch } from '@/entities/FishCatch';
import FishCollection from './FishCollection';
import { Achievement } from '@/entities/Achievement';
import AchievementDisplay from './AchievementDisplay';

const WEATHER_CYCLE = ['sunset', 'mountain', 'snow', 'rain', 'starry'];
const WEATHER_DURATION = 2.5 * 60 * 1000; // 2.5 minutes in milliseconds

export default function FishingGame() {
  const [gameState, setGameState] = useState({
    fishermanPosition: 50, // percentage from left
    isSitting: false,
    isFishing: false,
    currentWeather: 'sunset',
    weatherIndex: 0,
    fishCaught: 0,
    currentCatch: null as {
      type: string;
      size: number;
      weather: string;
      timestamp: number;
    } | null,
    gameStats: null as any,
    showFishCollection: false,
    showAchievements: false
  });

  // Keep track of which keys are currently down
  const [keys, setKeys] = useState<Record<string, boolean>>({});
  // Track keys that have been pressed but whose action hasn't been handled yet (for single-press actions)
  const [keyPressEvents, setKeyPressEvents] = useState<Record<string, boolean>>({});

  const [fishCollection, setFishCollection] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [cycleCount, setCycleCount] = useState(0); 
  // Guards against a single reel-in registering more than one catch
  const reelLockRef = useRef(false);

  // --- Game Data Loaders (useCallback for stability) ---

  const loadFishCollection = useCallback(async () => {
    try {
      const user = await User.me();
      const catches = await FishCatch.filter({ created_by: user.email }, '-timestamp');
      setFishCollection(catches);
    } catch (error) {
      console.log('Could not load fish collection:', error);
    }
  }, []); 

  const loadGameStats = useCallback(async () => {
    try {
      const user = await User.me();
      const stats = await GameStats.list();
      const userStats = stats.find(s => s.created_by === user.email);
      
      if (userStats) {
        setGameState(prev => ({ 
          ...prev, 
          gameStats: userStats, 
          fishCaught: userStats.fishCaught || 0 // Use DB value on initial load
        }));
      }
    } catch (error) {
      console.log('Could not load game stats:', error);
    }
  }, []);

  const unlockAchievement = useCallback(async (achievementId: string) => {
    try {
      const achievement = achievements.find(a => a.achievementId === achievementId);
      if (achievement && !achievement.unlocked) {
        await Achievement.update(achievement.id, {
          unlocked: true,
          unlockedAt: Date.now()
        });
        const updatedAchievements = await Achievement.filter({ created_by: 'local-user' });
        setAchievements(updatedAchievements); 
        setGameState(prev => ({ ...prev, showAchievements: true }));
      }
    } catch (error) {
      console.log('Could not unlock achievement:', error);
    }
  }, [achievements]); 

  const loadAchievements = useCallback(async () => {
    try {
      let userAchievements = await Achievement.filter({ created_by: 'local-user' });
      
      const ensureAchievement = async (id: string, title: string, description: string, quote: string) => {
        if (!userAchievements.some(a => a.achievementId === id)) {
          await Achievement.create({
            achievementId: id, title, description, unlockedQuote: quote, unlocked: false
          });
        }
      };

      await ensureAchievement('first-fish', 'Every End Is A New Beginning', 'Caught your first fish', 'God buries our sins in the depths of the sea and then puts up a sign that says, "No Fishing". - Corrie ten Boom');
      await ensureAchievement('weather-perseverance', 'Weathering Perseverance', 'Complete one full weather cycle.', 'I can do all things through Christ who strengthens me - Philippians 4:13');

      userAchievements = await Achievement.filter({ created_by: 'local-user' });
      setAchievements(userAchievements);
      
      const weatherPerseverance = userAchievements.find(a => a.achievementId === 'weather-perseverance');
      if (weatherPerseverance?.unlocked) {
        setCycleCount(1);
      }
    } catch (error) {
      console.log('Could not load achievements:', error);
    }
  }, []);


  // --- Asynchronous Game Updates (Helper function for handleFish) ---
  const saveCatchAndUpdateStats = useCallback(async (catchData: any, newFishCaughtCount: number, fishSize: number) => {
    try {
      // 1. Save Catch
      await FishCatch.create(catchData);

      // 2. Update Stats
      const statsUpdates = {
        fishCaught: newFishCaughtCount, 
        biggestFish: Math.max(gameState.gameStats?.biggestFish || 0, fishSize),
        favoriteWeather: catchData.weather
      };
      
      if (gameState.gameStats) {
        await GameStats.update(gameState.gameStats.id, statsUpdates);
      } else {
        await GameStats.create(statsUpdates);
      }
      
      // Load fish collection after save to update the modal content
      loadFishCollection(); 
    } catch (error) {
      console.log('Could not save catch/update stats:', error);
    }
  }, [gameState.gameStats, loadFishCollection]);


  // --- Initial Data Load ---
  useEffect(() => {
    loadGameStats();
    loadFishCollection();
    loadAchievements();
  }, [loadGameStats, loadFishCollection, loadAchievements]);


  // --- Weather Cycling System (Unchanged) ---
  useEffect(() => {
    const weatherInterval = setInterval(() => {
      setGameState(prev => {
        const nextIndex = (prev.weatherIndex + 1) % WEATHER_CYCLE.length;
        
        if (nextIndex === 0) {
          setCycleCount(prevCount => {
            const newCount = prevCount + 1;
            if (newCount === 1) {
              unlockAchievement('weather-perseverance');
            }
            return newCount;
          });
        }

        return {
          ...prev,
          weatherIndex: nextIndex,
          currentWeather: WEATHER_CYCLE[nextIndex]
        };
      });
    }, WEATHER_DURATION);

    return () => clearInterval(weatherInterval);
  }, [unlockAchievement]); 


  // --- handleFish: Corrected Logic ---
  const handleFish = useCallback(() => {
    
    if (gameState.isFishing) {
      // REEL IN (Catch a fish)
      const fishSize = Math.random() * 100 + 10;
      const fishType = ['Bass', 'Trout', 'Salmon', 'Pike', 'Catfish'][Math.floor(Math.random() * 5)];
      
      let calculatedFishCount: number;

      const catchData = {
        type: fishType,
        fishType: fishType,
        size: Math.round(fishSize),
        weather: gameState.currentWeather,
        timestamp: Date.now()
      };

      // 1. IMMEDIATE LOCAL STATE UPDATE (Ensures fishCaught displays correctly)
      setGameState(prev => {
        calculatedFishCount = prev.fishCaught + 1;

        if (prev.fishCaught === 0) { 
          unlockAchievement('first-fish'); 
        }
        return {
          ...prev,
          isFishing: false,
          currentCatch: catchData, 
          fishCaught: calculatedFishCount 
        };
      });
        
      // 2. ASYNC DATABASE UPDATE
      saveCatchAndUpdateStats(catchData, calculatedFishCount!, fishSize);
        
    } else if (!gameState.isFishing) { 
      // CAST LINE (Allows standing or sitting to cast)
      setGameState(prev => ({
        ...prev,
        isFishing: true,
        currentCatch: null
      }));
    }
  }, [gameState.isFishing, gameState.currentWeather, unlockAchievement, saveCatchAndUpdateStats]);


// --- Modal Handlers ---
  const dismissCatch = () => {
    setGameState(prev => ({ ...prev, currentCatch: null }));
  };

  const handleCabinDoorClick = () => {
    setGameState(prev => ({ ...prev, showFishCollection: true }));
  };

  const closeFishCollection = () => {
    setGameState(prev => ({ ...prev, showFishCollection: false }));
  };

  const handleGravestoneClick = () => {
    setGameState(prev => ({ ...prev, showAchievements: true }));
  };

  const closeAchievements = () => {
    setGameState(prev => ({ ...prev, showAchievements: false }));
  };

// --- Keyboard & Game Loop Logic (Updated for 'X' catch dismissal) ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase(); 

      if (key === 'a' || key === 'd' || key === ' ' || key === 'x' || key === 'arrowdown') {
        if (!keys[key]) { 
          setKeys(prev => ({ ...prev, [key]: true }));
          setKeyPressEvents(prev => ({ ...prev, [key]: true })); 
        }
        if (key === ' ') {
          e.preventDefault(); 
        }
      } else {
        setKeys(prev => ({ ...prev, [key]: true }));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [e.key.toLowerCase()]: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [keys]);

  // Handle movement and actions
  useEffect(() => {
    const moveSpeed = 1;
    const minPos = 43; 
    const maxPos = 57; 
    
    // Continuous Movement
    if (keys.arrowleft && gameState.fishermanPosition > minPos) {
      setGameState(prev => ({
        ...prev,
        fishermanPosition: Math.max(minPos, prev.fishermanPosition - moveSpeed)
      }));
    }
    
    if (keys.arrowright && gameState.fishermanPosition < maxPos) {
      setGameState(prev => ({
        ...prev,
        fishermanPosition: Math.min(maxPos, prev.fishermanPosition + moveSpeed)
      }));
    }

    // Single Key Actions (Triggers on keyPressEvents)
    if (keyPressEvents.arrowdown) {
      setGameState(prev => ({ ...prev, isSitting: !prev.isSitting }));
      setKeyPressEvents(prev => ({ ...prev, arrowdown: false })); 
    }

    if (keyPressEvents.d) {
      handleGravestoneClick();
      setKeyPressEvents(prev => ({ ...prev, d: false })); 
    }

    if (keyPressEvents.a) {
      handleCabinDoorClick();
      setKeyPressEvents(prev => ({ ...prev, a: false })); 
    }

    if (keyPressEvents[' ']) {
      handleFish(); 
      setKeyPressEvents(prev => ({ ...prev, ' ': false })); 
    }
    
    // 'x' to exit modal screens OR catch notification
    if (keyPressEvents.x) {
      if (gameState.showFishCollection) {
        closeFishCollection();
      } else if (gameState.showAchievements) {
        closeAchievements();
      } else if (gameState.currentCatch) {
        // NEW FIX: Dismiss the caught fish notification
        dismissCatch();
      }
      setKeyPressEvents(prev => ({ ...prev, x: false })); 
    }

  }, [keys, gameState.fishermanPosition, keyPressEvents, gameState.showFishCollection, gameState.showAchievements, gameState.currentCatch, handleFish]); 

// --- JSX Render (Unchanged) ---
  return (
    <div className="w-full h-screen overflow-hidden bg-gradient-to-b from-slate-900 to-slate-800 relative">
      <svg
        viewBox="0 0 1200 800"
        className="w-full h-full weather-transition"
        style={{ background: 'transparent' }}
      >
        <GameBackground weather={gameState.currentWeather} />
        <WeatherSystem weather={gameState.currentWeather} />
        
        <ellipse
          cx="600"
          cy="600"
          rx="500"
          ry="180"
          fill={gameState.currentWeather === 'starry' ? '#1e3a8a' :
                gameState.currentWeather === 'rain' ? '#1e40af' :
                gameState.currentWeather === 'snow' ? '#3b82f6' :
                gameState.currentWeather === 'mountain' ? '#374151' : '#4338ca'}
          opacity="0.8"
          className="weather-transition"
        />
        
        <rect
          x="500"
          y="520"
          width="200"
          height="80"
          fill="#8b5a3c"
          rx="5"
        />
        
        {/* Log Cabin */}
        <g transform="translate(100, 300)">
          <rect x="0" y="40" width="180" height="120" fill="#6b4423" />
          <polygon points="0,40 90,0 180,40" fill="#4a2c17" />
          <rect 
            x="70" y="90" width="40" height="70" fill="#3c1810"
            style={{ cursor: 'pointer' }} onClick={handleCabinDoorClick} />
          <circle 
            cx="100" cy="125" r="2" fill="#d4af37"
            style={{ cursor: 'pointer' }} onClick={handleCabinDoorClick} />
          <rect x="20" y="70" width="30" height="25" fill="#ffd700" opacity="0.7" />
          <rect x="130" y="70" width="30" height="25" fill="#ffd700" opacity="0.7" />
          <rect x="140" y="10" width="20" height="40" fill="#8b4513" />
        </g>

        {/* Grave of Luna Wildrose */}
          <g transform="translate(1100, 400)" style={{ cursor: 'pointer' }} onClick={handleGravestoneClick}>
            
            <rect x="-45" y="55" width="90" height="30" rx="5" ry="5" fill="#a0a0a0" stroke="#757575" strokeWidth="1" />
            
            <g transform="translate(0, 5)">
              <rect x="-10" y="-15" width="20" height="85" fill="#795548" rx="2" ry="2" />
              <rect x="-30" y="7" width="60" height="15" fill="#795548" rx="2" ry="2" />
              
              <text x="0" y="11" font-family="sans-serif" font-size="7" fill="#fbe2b1" text-anchor="middle" font-weight="bold">LUNA</text>
              <text x="0" y="21" font-family="sans-serif" font-size="7" fill="#fbe2b1" text-anchor="middle" font-weight="bold">WILDROSE</text>
            </g>

            <g transform="translate(-15, 70)">
              <rect x="-1" y="0" width="2" height="15" fill="#388e3c" />
              <circle cx="0" cy="0" r="4" fill="#e53935" />
              <circle cx="3" cy="-2.5" r="4" fill="#e53935" />
              <circle cx="-3" cy="-2.5" r="4" fill="#e53935" />
              <circle cx="0" cy="0" r="2" fill="#ffc107" />
            </g>

            <g transform="translate(0, 70)">
              <rect x="-1" y="0" width="2" height="15" fill="#388e3c" />
              <circle cx="0" cy="0" r="4" fill="#e53935" />
              <circle cx="3" cy="-2.5" r="4" fill="#e53935" />
              <circle cx="-3" cy="-2.5" r="4" fill="#e53935" />
              <circle cx="0" cy="0" r="2" fill="#ffc107" />
            </g>
            
            <g transform="translate(15, 70)">
              <rect x="-1" y="0" width="2" height="15" fill="#388e3c" />
              <circle cx="0" cy="0" r="4" fill="#e53935" />
              <circle cx="3" cy="-2.5" r="4" fill="#e53935" />
              <circle cx="-3" cy="-2.5" r="4" fill="#e53935" />
              <circle cx="0" cy="0" r="2" fill="#ffc107" />
            </g>
          </g>
        
        <Fisherman
          position={gameState.fishermanPosition}
          isSitting={gameState.isSitting}
          isFishing={gameState.isFishing}
        />
        
        <FishingMechanics
          fishermanPosition={gameState.fishermanPosition}
          isFishing={gameState.isFishing}
          weather={gameState.currentWeather}
        />
      </svg>

      <GameUI 
        gameState={gameState}
        onFish={handleFish}
        onDismissCatch={dismissCatch}
        weather={gameState.currentWeather}
      />

      {gameState.showFishCollection && (
        <FishCollection 
          fishCollection={fishCollection}
          onClose={closeFishCollection}
        />
      )}

      {gameState.showAchievements && (
        <AchievementDisplay 
          achievements={achievements}
          onClose={closeAchievements}
        />
      )}
    </div>
  );
}