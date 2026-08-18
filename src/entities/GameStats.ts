// Mock GameStats entity for the fishing game
export interface GameStatsData {
  id?: string;
  fishCaught: number;
  biggestFish: number;
  favoriteWeather: string;
  created_by?: string;
}

export class GameStats {
  static async list(): Promise<GameStatsData[]> {
    // Mock implementation - could be replaced with real database calls
    const savedStats = localStorage.getItem('fishingGameStats');
    return savedStats ? [JSON.parse(savedStats)] : [];
  }

  static async create(data: GameStatsData): Promise<GameStatsData> {
    const stats = {
      ...data,
      id: Date.now().toString(),
      created_by: 'guest@fishingGame.com'
    };
    localStorage.setItem('fishingGameStats', JSON.stringify(stats));
    return stats;
  }

  static async update(id: string, data: Partial<GameStatsData>): Promise<GameStatsData> {
    const savedStats = localStorage.getItem('fishingGameStats');
    const currentStats = savedStats ? JSON.parse(savedStats) : {};
    const updatedStats = { ...currentStats, ...data };
    localStorage.setItem('fishingGameStats', JSON.stringify(updatedStats));
    return updatedStats;
  }
}