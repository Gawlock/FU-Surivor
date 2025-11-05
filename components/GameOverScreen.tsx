

import React from 'react';
import { formatTime } from '../utils';

interface GameOverScreenProps {
  score: number;
  onRestart: () => void;
  canRevive: boolean;
  onRevive: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ score, onRestart, canRevive, onRevive }) => {
  return (
    <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col justify-center items-center z-50">
      <h1 className="text-7xl font-extrabold mb-4 text-red-700">GAME OVER</h1>
      <p className="text-2xl mb-8 text-gray-200">You survived for: <span className="font-bold text-yellow-400">{formatTime(score)}</span></p>
      <div className="flex gap-6">
        {canRevive && (
            <button
            onClick={onRevive}
            className="px-10 py-4 bg-yellow-500 text-black font-bold rounded-lg text-2xl border-2 border-yellow-700 hover:bg-yellow-400 transform hover:scale-110 transition-transform duration-200"
            >
            Revive
            </button>
        )}
        <button
          onClick={onRestart}
          className="px-10 py-4 bg-gray-600 text-white font-bold rounded-lg text-2xl border-2 border-gray-800 hover:bg-gray-500 transform hover:scale-110 transition-transform duration-200"
        >
          Restart
        </button>
      </div>
    </div>
  );
};

export default GameOverScreen;