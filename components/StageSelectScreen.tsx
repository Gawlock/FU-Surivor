import React from 'react';
import { STAGES } from '../data/stages';

interface StageSelectScreenProps {
  onSelectStage: (stageId: string) => void;
  onBack: () => void;
}

const StageSelectScreen: React.FC<StageSelectScreenProps> = ({ onSelectStage, onBack }) => {
  return (
    <div className="absolute inset-0 bg-gray-900 flex flex-col justify-center items-center z-50 p-8">
      <button 
        onClick={onBack}
        className="absolute top-8 left-8 px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
      >
        &larr; Back to Characters
      </button>
      <h1 className="text-6xl font-extrabold mb-4 text-yellow-400 tracking-wider" style={{ textShadow: '2px 2px 0 #000' }}>
        SELECT STAGE
      </h1>
      <p className="text-xl mb-8 text-gray-300">Choose your battlefield.</p>
      <div className="flex flex-wrap justify-center gap-8">
        {Object.values(STAGES).map(stage => (
          <button
            key={stage.id}
            onClick={() => onSelectStage(stage.id)}
            className="w-80 p-8 bg-gray-800 border-2 border-gray-600 rounded-lg text-center hover:bg-yellow-600 hover:border-yellow-400 transform hover:-translate-y-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            <h2 className="text-3xl font-bold text-white mb-2">{stage.name}</h2>
            <p className="text-gray-400">Final Boss at 15:00</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default StageSelectScreen;