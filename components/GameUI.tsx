
import React from 'react';
import type { Player } from '../types';
import { formatTime } from '../utils';

interface GameUIProps {
  player: Player;
  gameTime: number;
}

const GameUI: React.FC<GameUIProps> = ({ player, gameTime }) => {
  const hpPercentage = (player.stats.currentHp / player.stats.maxHp) * 100;
  const xpPercentage = (player.xp / player.xpToNextLevel) * 100;

  return (
    <div className="absolute top-0 left-0 right-0 p-4 bg-black bg-opacity-30 z-20">
      <div className="flex justify-between items-center text-lg">
        <div>Level: {player.level}</div>
        <div className="font-bold text-2xl">{formatTime(gameTime)}</div>
        <div>Weapons: {player.weapons.map(w => w.id.split('_')[0]).join(', ')}</div>
      </div>
      <div className="mt-2">
        {/* HP Bar */}
        <div className="w-full bg-gray-700 rounded-full h-4 border border-gray-500">
          <div className="bg-red-600 h-full rounded-full" style={{ width: `${hpPercentage}%` }}></div>
        </div>
        <div className="text-center text-sm">HP: {Math.ceil(player.stats.currentHp)} / {player.stats.maxHp}</div>
      </div>
       <div className="mt-1">
        {/* XP Bar */}
        <div className="w-full bg-gray-700 rounded-full h-3 border border-gray-500">
          <div className="bg-blue-500 h-full rounded-full" style={{ width: `${xpPercentage}%` }}></div>
        </div>
        <div className="text-center text-sm">XP: {player.xp} / {player.xpToNextLevel}</div>
      </div>
    </div>
  );
};

export default GameUI;
