
import React, { useState } from 'react';
import { CHARACTERS } from '../data/characters';
import { WEAPONS } from '../data/weapons';
import type { CharacterData, SaveData } from '../types';
import { formatTime } from '../utils';

interface StartScreenProps {
  onStart: (characterId: string, weaponId: string) => void;
  saveData: SaveData | null;
}

const StartScreen: React.FC<StartScreenProps> = ({ onStart, saveData }) => {
  const [selectedChar, setSelectedChar] = useState<CharacterData | null>(null);

  const handleCharSelect = (char: CharacterData) => {
    if (char.initialWeaponId) {
      onStart(char.id, char.initialWeaponId);
    } else {
      // This is the 'Test' character, move to weapon selection
      setSelectedChar(char);
    }
  };
  
  if (selectedChar) {
    // Weapon Selection Screen for 'Test' character
    return (
      <div className="absolute inset-0 bg-gray-900 flex flex-col justify-center items-center z-50 p-8">
        <button 
            onClick={() => setSelectedChar(null)}
            className="absolute top-8 left-8 px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
        >
            &larr; Back to Characters
        </button>
        <h1 className="text-5xl font-extrabold mb-2 text-yellow-400 tracking-wider">
          Choose a Weapon
        </h1>
        <p className="text-lg mb-8 text-gray-300">Select a starting weapon for {selectedChar.name}.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-h-[70vh] overflow-y-auto p-4">
          {Object.values(WEAPONS).map(weapon => (
            <button
              key={weapon.id}
              onClick={() => onStart(selectedChar.id, weapon.id)}
              className="w-56 p-4 bg-gray-800 border-2 border-gray-600 rounded-lg text-center hover:bg-yellow-600 hover:border-yellow-400 transform hover:-translate-y-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              <div className="text-5xl mb-2">{weapon.icon}</div>
              <h2 className="text-xl font-semibold">{weapon.name}</h2>
              <p className="text-xs text-gray-400 mt-2">{weapon.levels[0].description}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Character Selection Screen (default)
  return (
    <div className="absolute inset-0 bg-gray-900 flex flex-col justify-center items-center z-50 p-8">
      <h1 className="text-6xl font-extrabold mb-4 text-red-500 tracking-wider" style={{ textShadow: '2px 2px 0 #000' }}>
        MODULAR SURVIVOR
      </h1>
      <p className="text-xl mb-8 text-gray-300">Choose your survivor.</p>
      <div className="flex flex-wrap justify-center gap-8">
        {Object.values(CHARACTERS).map(char => {
          const bestTime = saveData?.bestTimes[char.id];
          return (
            <button
              key={char.id}
              onClick={() => handleCharSelect(char)}
              className="w-64 p-6 bg-gray-800 border-2 border-gray-600 rounded-lg text-center hover:bg-red-600 hover:border-red-400 transform hover:-translate-y-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              <h2 className="text-3xl font-bold text-yellow-400 mb-2">{char.name}</h2>
              {char.initialWeaponId ? (
                <>
                  <p className="text-gray-400 mb-4">Starts with:</p>
                  <div className="text-5xl mb-2">{WEAPONS[char.initialWeaponId].icon}</div>
                  <p className="font-semibold">{WEAPONS[char.initialWeaponId].name}</p>
                </>
              ) : (
                <>
                  <p className="text-gray-400 mb-4">Special Passive:</p>
                  <div className="text-5xl mb-2">📈</div>
                  <p className="font-semibold">+400% XP Gain</p>
                  <p className="text-xs text-gray-500 mt-2">(Choose any starting weapon)</p>
                </>
              )}
               {bestTime && bestTime > 0 && (
                <p className="text-sm text-yellow-200 mt-4 border-t border-gray-600 pt-2">
                  Best Time: <span className="font-bold">{formatTime(bestTime)}</span>
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StartScreen;
