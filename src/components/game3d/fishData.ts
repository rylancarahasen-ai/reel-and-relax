export interface Species {
  name: string;
  /** relative rarity weight */
  rarity: number;
  /** kg range */
  weight: [number, number];
  /** cm range */
  length: [number, number];
  /** fight strength multiplier */
  strength: number;
  color: string;
  /** minimum cast distance (metres) needed for this fish */
  minDistance: number;
  /** weather this fish is exclusive to (undefined = any) */
  weather?: string;
}

export const SPECIES: Species[] = [
  { name: 'Bass', rarity: 30, weight: [0.6, 3.2], length: [22, 48], strength: 0.85, color: '#4f7942', minDistance: 0 },
  { name: 'Trout', rarity: 26, weight: [0.4, 2.4], length: [20, 42], strength: 0.7, color: '#c08457', minDistance: 0 },
  { name: 'Salmon', rarity: 16, weight: [1.8, 8.5], length: [45, 92], strength: 1.15, color: '#e07a5f', minDistance: 12 },
  { name: 'Pike', rarity: 12, weight: [2.2, 11 ], length: [50, 110], strength: 1.35, color: '#6b8f3a', minDistance: 16 },
  { name: 'Catfish', rarity: 10, weight: [3.0, 16], length: [55, 125], strength: 1.5, color: '#4b4238', minDistance: 20 },
  { name: 'Golden Sunfish', rarity: 8, weight: [0.3, 1.6], length: [16, 30], strength: 0.6, color: '#f6c344', minDistance: 6, weather: 'sunset' },
  { name: 'Alpine Grayling', rarity: 8, weight: [0.7, 3.0], length: [28, 55], strength: 0.9, color: '#8fa3b0', minDistance: 8, weather: 'mountain' },
  { name: 'Rainbow Char', rarity: 8, weight: [1.0, 4.5], length: [32, 66], strength: 1.05, color: '#7fd4d1', minDistance: 8, weather: 'snow' },
  { name: 'Storm Perch', rarity: 8, weight: [0.8, 3.6], length: [26, 52], strength: 1.2, color: '#5b7fbf', minDistance: 8, weather: 'rain' },
  { name: 'Moonfish', rarity: 5, weight: [2.0, 9.0], length: [40, 88], strength: 1.4, color: '#c9b8f2', minDistance: 14, weather: 'starry' },
];

export const SPECIES_NAMES = SPECIES.map((s) => s.name);

/** Weather multiplier on how quickly fish bite (lower = faster bites) */
export const WEATHER_BITE_RATE: Record<string, number> = {
  sunset: 0.85,
  mountain: 1.1,
  snow: 1.25,
  rain: 0.7,
  starry: 1.0,
};

export function pickSpecies(weather: string, distance: number): Species {
  const pool = SPECIES.filter(
    (s) => (!s.weather || s.weather === weather) && distance >= s.minDistance
  );
  const available = pool.length ? pool : [SPECIES[0]];
  const total = available.reduce((sum, s) => sum + s.rarity * (s.weather === weather ? 1.8 : 1), 0);
  let roll = Math.random() * total;
  for (const s of available) {
    roll -= s.rarity * (s.weather === weather ? 1.8 : 1);
    if (roll <= 0) return s;
  }
  return available[available.length - 1];
}

export function rollFish(weather: string, distance: number) {
  const species = pickSpecies(weather, distance);
  const t = Math.pow(Math.random(), 1.6); // skew toward smaller fish
  const weight = species.weight[0] + (species.weight[1] - species.weight[0]) * t;
  const length = species.length[0] + (species.length[1] - species.length[0]) * t;
  const weatherFight = weather === 'rain' || weather === 'starry' ? 1.15 : 1;
  return {
    species: species.name,
    color: species.color,
    weight: Math.round(weight * 100) / 100,
    length: Math.round(length),
    strength: species.strength * (0.75 + t * 0.6) * weatherFight,
  };
}

export type RolledFish = ReturnType<typeof rollFish>;
