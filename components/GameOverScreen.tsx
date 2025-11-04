
import React from 'react';

interface GameOverScreenProps {
  score: number;
  onRestart: () => void;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ score, onRestart }) => {
    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

  return (
    <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col justify-center items-center z-50">
      <h1 className="text-7xl font-extrabold mb-4 text-red-700">GAME OVER</h1>
      <p className="text-2xl mb-8 text-gray-200">You survived for: <span className="font-bold text-yellow-400">{formatTime(score)}</span></p>
      <button
        onClick={onRestart}
        className="px-10 py-4 bg-gray-600 text-white font-bold rounded-lg text-2xl border-2 border-gray-800 hover:bg-gray-500 transform hover:scale-110 transition-transform duration-200"
      >
        Restart
      </button>
    </div>
  );
};

export default GameOverScreen;
