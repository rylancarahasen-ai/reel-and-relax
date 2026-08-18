import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Fish, Trophy, Hash } from 'lucide-react';

const FISH_TYPES = ['Bass', 'Trout', 'Salmon', 'Pike', 'Catfish'];

const FISH_EMOJIS = {
  Bass: '🐟',
  Trout: '🎣',
  Salmon: '🍣',
  Pike: '🦈',
  Catfish: '🐱'
};

interface FishCollectionProps {
  fishCollection: Array<{
    fishType: string;
    size: number;
    weather: string;
    timestamp: number;
  }>;
  onClose: () => void;
}

export default function FishCollection({ fishCollection, onClose }: FishCollectionProps) {
  // Process fish collection data
  const getFishStats = () => {
    const stats: Record<string, { count: number; biggestSize: number; averageSize: number }> = {};
    
    FISH_TYPES.forEach(type => {
      const fishOfType = fishCollection.filter(fish => fish.fishType === type);
      stats[type] = {
        count: fishOfType.length,
        biggestSize: fishOfType.length > 0 ? Math.max(...fishOfType.map(f => f.size)) : 0,
        averageSize: fishOfType.length > 0 ? 
          Math.round(fishOfType.reduce((sum, f) => sum + f.size, 0) / fishOfType.length) : 0
      };
    });
    
    return stats;
  };

  const fishStats = getFishStats();
  const totalFish = fishCollection.length;
  const biggestOverall = fishCollection.length > 0 ? 
    Math.max(...fishCollection.map(f => f.size)) : 0;

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-b from-amber-50 to-orange-50 border-4 border-amber-200">
        <CardHeader className="bg-gradient-to-r from-amber-600 to-orange-600 text-white relative">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold flex items-center gap-3">
              <Fish className="w-8 h-8" />
              Fish Collection
            </CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
          <div className="flex items-center gap-6 mt-2 text-amber-100">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4" />
              <span>Total: {totalFish}</span>
            </div>
            {totalFish > 0 && (
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                <span>Biggest: {biggestOverall}cm</span>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {totalFish === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Fish className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-xl font-semibold mb-2">No Fish Caught Yet</h3>
              <p className="mb-2">Cast your line and your catches will show up here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FISH_TYPES.map((fishType) => {
                const stats = fishStats[fishType];
                const hasCaught = stats.count > 0;
                
                return (
                  <Card 
                    key={fishType} 
                    className={`transition-all duration-300 ${
                      hasCaught 
                        ? 'bg-white shadow-lg border-2 border-blue-200 hover:shadow-xl' 
                        : 'bg-gray-100 opacity-60 border-gray-300'
                    }`}
                  >
                    <CardContent className="p-6 text-center">
                      <div className={`text-6xl mb-4 ${!hasCaught && 'grayscale opacity-50'}`}>
                        {FISH_EMOJIS[fishType as keyof typeof FISH_EMOJIS]}
                      </div>
                      
                      <h3 className="text-xl font-bold mb-3 text-gray-800">
                        {fishType}
                      </h3>
                      
                      {hasCaught ? (
                        <div className="space-y-3">
                          <div className="flex justify-center">
                            <Badge variant="secondary" className="px-3 py-1">
                              {stats.count} caught
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <div className="font-semibold text-blue-800">Biggest</div>
                              <div className="text-lg font-bold text-blue-900">
                                {stats.biggestSize}cm
                              </div>
                            </div>
                            
                            <div className="bg-green-50 p-3 rounded-lg">
                              <div className="font-semibold text-green-800">Average</div>
                              <div className="text-lg font-bold text-green-900">
                                {stats.averageSize}cm
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-500">
                          <div className="text-sm mb-2">Not caught yet</div>
                          <Badge variant="outline" className="opacity-50">
                            0 caught
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="mt-8 text-center">
            <Button 
              onClick={onClose}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 px-8"
            >
              Continue Fishing
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}