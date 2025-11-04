
import type { Vector2D, GameObject, Enemy } from './types';

export const distance = (a: Vector2D, b: Vector2D): number => {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
};

export const normalize = (v: Vector2D): Vector2D => {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: v.x / len, y: v.y / len };
};

export const isColliding = (obj1: GameObject, obj2: GameObject): boolean => {
  const dist = distance(obj1.position, obj2.position);
  return dist < (obj1.size / 2 + obj2.size / 2);
};

export const getClosestEnemy = (playerPos: Vector2D, enemies: Enemy[]): Enemy | null => {
  if (enemies.length === 0) return null;
  
  let closestEnemy: Enemy | null = null;
  let minDistance = Infinity;

  for (const enemy of enemies) {
    const d = distance(playerPos, enemy.position);
    if (d < minDistance) {
      minDistance = d;
      closestEnemy = enemy;
    }
  }
  return closestEnemy;
};

export const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};
