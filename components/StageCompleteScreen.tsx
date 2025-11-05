
import React from 'react';
import { formatTime } from '../utils';

interface StageCompleteScreenProps {
  score: number;
  zenit: number;
  onBack: () => void;
}

const StageCompleteScreen: React.FC<StageCompleteScreenProps> = ({ score, zenit, onBack }) => {
  return (
    <div className="absolute inset-0 bg-black bg-opacity-80 flex flex-col justify-center items-center z-50 text-white">
      <h1 className="text-8xl font-extrabold mb-4 text-yellow-400" style={{ textShadow: '0 0 15px #fef08a, 0 0 25px #fef08a' }}>
        VITÓRIA!
      </h1>
      <p className="text-2xl mb-4">Fase concluída em: <span className="font-bold text-green-400">{formatTime(score)}</span></p>
      <p className="text-3xl mb-8">Zenit Obtido: <span className="font-bold text-purple-400">{zenit.toLocaleString()} Z</span></p>
      <button
        onClick={onBack}
        className="px-12 py-5 bg-blue-600 font-bold rounded-lg text-2xl border-2 border-blue-800 hover:bg-blue-500 transform hover:scale-110 transition-transform duration-200"
      >
        Voltar ao Menu
      </button>
    </div>
  );
};

export default StageCompleteScreen;