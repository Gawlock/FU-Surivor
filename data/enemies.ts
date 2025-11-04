import type { EnemyData } from '../types';

export const ENEMIES: Record<string, EnemyData> = {
  bat: {
    name: 'Bat',
    hp: 10,
    speed: 1.8,
    damage: 3,
    size: 24,
    xp: 6,
    color: 'bg-purple-600',
  },
  skeleton: {
    name: 'Skeleton',
    hp: 25,
    speed: 1.3,
    damage: 7,
    size: 32,
    xp: 19,
    color: 'bg-gray-400',
  },
  goblin: {
    name: 'Goblin',
    hp: 15,
    speed: 2.2,
    damage: 5,
    size: 28,
    xp: 13,
    color: 'bg-green-600',
  },
};