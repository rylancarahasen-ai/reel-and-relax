export class Achievement {
  id?: string;
  achievementId: string;
  title: string;
  description: string;
  unlockedQuote: string;
  unlocked: boolean;
  unlockedAt?: number;
  created_by?: string;

  constructor(data: Partial<Achievement>) {
    Object.assign(this, data);
  }

  static async create(data: any): Promise<Achievement> {
    const achievements = JSON.parse(localStorage.getItem('achievements') || '[]');
    const newAchievement = {
      ...data,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      created_by: 'local-user',
    };
    achievements.push(newAchievement);
    localStorage.setItem('achievements', JSON.stringify(achievements));
    return new Achievement(newAchievement);
  }

  /** Ensures every stored achievement has a unique id (older saves reused timestamps). */
  static async repairIds(): Promise<void> {
    const achievements = JSON.parse(localStorage.getItem('achievements') || '[]');
    const seen = new Set<string>();
    let changed = false;
    achievements.forEach((a: any) => {
      if (!a.id || seen.has(a.id)) {
        a.id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        changed = true;
      }
      seen.add(a.id);
    });
    if (changed) localStorage.setItem('achievements', JSON.stringify(achievements));
  }

  static async list(): Promise<Achievement[]> {
    const achievements = JSON.parse(localStorage.getItem('achievements') || '[]');
    return achievements.map((a: any) => new Achievement(a));
  }

  static async filter(criteria: any): Promise<Achievement[]> {
    const achievements = await this.list();
    return achievements.filter(a => {
      if (criteria.created_by && a.created_by !== criteria.created_by) return false;
      if (criteria.achievementId && a.achievementId !== criteria.achievementId) return false;
      return true;
    });
  }

  static async update(id: string, updates: any): Promise<Achievement> {
    const achievements = JSON.parse(localStorage.getItem('achievements') || '[]');
    const index = achievements.findIndex((a: any) => a.id === id);
    if (index !== -1) {
      achievements[index] = { ...achievements[index], ...updates };
      localStorage.setItem('achievements', JSON.stringify(achievements));
      return new Achievement(achievements[index]);
    }
    throw new Error('Achievement not found');
  }
}
