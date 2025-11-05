import type { StageData } from '../types';

export const STAGES: Record<string, StageData> = {
  forest: {
    id: 'forest',
    name: 'Floresta de Rivendell',
    spawnWaves: [
      // Waves now appear 25% faster
      { time: 1.6, enemyTypeId: 'bat', count: 1, interval: 0 },
      { time: 4.8, enemyTypeId: 'bat', count: 1, interval: 0 },
      { time: 8, enemyTypeId: 'bat', count: 1, interval: 0 },
      { time: 12, enemyTypeId: 'bat', count: 2, interval: 500 },
      { time: 17.6, enemyTypeId: 'goblin', count: 1, interval: 0 },
      
      { time: 24, enemyTypeId: 'bat', count: 3, interval: 800 },
      { time: 32, enemyTypeId: 'goblin', count: 2, interval: 1000 },
      { time: 40, enemyTypeId: 'bat', count: 5, interval: 500 },

      { time: 52, enemyTypeId: 'skeleton', count: 1, interval: 0 },
      { time: 60, enemyTypeId: 'goblin', count: 4, interval: 1000 },
      { time: 72, enemyTypeId: 'bat', count: 8, interval: 400 },
      { time: 84, enemyTypeId: 'skeleton', count: 2, interval: 1500 },
    
      { time: 96, enemyTypeId: 'bat', count: 10, interval: 300 },
      { time: 108, enemyTypeId: 'goblin', count: 6, interval: 800 },
      { time: 120, enemyTypeId: 'skeleton', count: 4, interval: 1000 },
      
      { time: 144, enemyTypeId: 'bat', count: 15, interval: 300 },
      { time: 156, enemyTypeId: 'goblin', count: 10, interval: 500 },
      { time: 168, enemyTypeId: 'skeleton', count: 6, interval: 800 },
    
      { time: 192, enemyTypeId: 'bat', count: 20, interval: 200 },
      { time: 208, enemyTypeId: 'goblin', count: 8, interval: 600 },
      { time: 224, enemyTypeId: 'skeleton', count: 10, interval: 700 },
    
      { time: 240, enemyTypeId: 'bat', count: 20, interval: 400 },
      { time: 240, enemyTypeId: 'goblin', count: 5, interval: 1000 },
      
      { time: 272, enemyTypeId: 'skeleton', count: 10, interval: 1000 },
      { time: 272, enemyTypeId: 'bat', count: 15, interval: 500 },
      
      // BOSS SPAWN AT 5 MINUTES
      { time: 300, enemyTypeId: 'skeletonKing', count: 1, interval: 0 },

      { time: 304, enemyTypeId: 'goblin', count: 15, interval: 600 },
      { time: 304, enemyTypeId: 'skeleton', count: 5, interval: 1500 },

      { time: 336, enemyTypeId: 'bat', count: 30, interval: 200 },
      { time: 360, enemyTypeId: 'skeleton', count: 15, interval: 600 },
    
      { time: 400, enemyTypeId: 'goblin', count: 20, interval: 400 },
      { time: 400, enemyTypeId: 'bat', count: 20, interval: 300 },

      { time: 432, enemyTypeId: 'bat', count: 40, interval: 150 },
      { time: 448, enemyTypeId: 'skeleton', count: 25, interval: 400 },

      // BOSS SPAWN AT 10 MINUTES
      { time: 600, enemyTypeId: 'skeletonKing', count: 1, interval: 0 },

      { time: 608, enemyTypeId: 'bat', count: 50, interval: 100 },
      { time: 640, enemyTypeId: 'goblin', count: 30, interval: 300 },
      { time: 680, enemyTypeId: 'skeleton', count: 40, interval: 200 },
      
      { time: 720, enemyTypeId: 'skeletonKing', count: 2, interval: 2000 },
      { time: 750, enemyTypeId: 'bat', count: 60, interval: 50 },
      
      { time: 800, enemyTypeId: 'goblin', count: 40, interval: 100 },
      { time: 840, enemyTypeId: 'skeleton', count: 50, interval: 100 },
      
      // FINAL BOSS SPAWN
      { time: 900, enemyTypeId: 'voidHerald', count: 1, interval: 0 },
    ],
  },
};