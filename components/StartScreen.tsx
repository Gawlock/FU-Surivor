import React, { useState } from 'react';
import { CHARACTERS } from '../data/characters';
import { WEAPONS } from '../data/weapons';
import { UPGRADES_DATA } from '../data/upgrades';
import type { CharacterData, SaveData, UpgradeId } from '../types';
import { formatTime } from '../utils';

interface StartScreenProps {
  onCharacterSelect: (characterId: string, weaponId: string) => void;
  saveData: SaveData | null;
  updateSaveData: (newSaveData: SaveData) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onCharacterSelect, saveData, updateSaveData }) => {
  const [selectedChar, setSelectedChar] = useState<CharacterData | null>(null);
  const [view, setView] = useState<'character' | 'shop'>('character');

  const handleCharSelect = (char: CharacterData) => {
    if (char.initialWeaponId) {
      onCharacterSelect(char.id, char.initialWeaponId);
    } else {
      setSelectedChar(char);
    }
  };

  const handleBuyUpgrade = (upgradeId: UpgradeId) => {
    if (!saveData) return;
    const upgradeMeta = UPGRADES_DATA[upgradeId];
    const currentLevel = saveData.upgrades[upgradeId].level;
    if (currentLevel < upgradeMeta.maxLevel && saveData.zenit >= upgradeMeta.cost) {
      const newSaveData = { ...saveData };
      newSaveData.zenit -= upgradeMeta.cost;
      newSaveData.upgrades[upgradeId].level += 1;
      updateSaveData(newSaveData);
    }
  };

  const handleToggleUpgrade = (upgradeId: UpgradeId) => {
    if (!saveData) return;
    const newSaveData = { ...saveData };
    newSaveData.upgrades[upgradeId].active = !newSaveData.upgrades[upgradeId].active;
    updateSaveData(newSaveData);
  };
  
  if (selectedChar) {
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
              onClick={() => onCharacterSelect(selectedChar.id, weapon.id)}
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

  if (view === 'shop') {
     return (
        <div className="absolute inset-0 bg-gray-900 flex flex-col justify-center items-center z-50 p-8">
            <h1 className="text-5xl font-extrabold mb-2 text-yellow-400 tracking-wider">Permanent Upgrades</h1>
            <p className="text-lg mb-4 text-gray-300">Spend Zenit to unlock permanent bonuses.</p>
             <div className="absolute top-4 right-4 text-2xl font-bold bg-purple-800 text-yellow-200 px-4 py-2 rounded-lg border-2 border-purple-500">
                Zenit: {saveData?.zenit.toLocaleString() || 0} Z
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-h-[70vh] overflow-y-auto p-4">
                {Object.entries(UPGRADES_DATA).map(([id, meta]) => {
                    const upgradeId = id as UpgradeId;
                    const savedUpgrade = saveData?.upgrades[upgradeId] || { level: 0, active: true };
                    const isMaxLevel = savedUpgrade.level >= meta.maxLevel;
                    const canAfford = saveData ? saveData.zenit >= meta.cost : false;

                    return (
                        <div key={id} className={`w-80 p-4 bg-gray-800 border-2 ${savedUpgrade.active ? 'border-purple-500' : 'border-gray-600'} rounded-lg flex flex-col`}>
                            <h2 className="text-2xl font-bold text-yellow-300">{meta.name}</h2>
                            <p className="text-sm text-gray-400 mb-2">Level: {savedUpgrade.level} / {meta.maxLevel}</p>
                            <p className="text-sm flex-grow text-gray-300">{meta.description(savedUpgrade.level)}</p>
                            
                            <div className="mt-4 flex justify-between items-center">
                                <button
                                    onClick={() => handleBuyUpgrade(upgradeId)}
                                    disabled={isMaxLevel || !canAfford}
                                    className="px-4 py-2 bg-green-600 text-white font-bold rounded hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isMaxLevel ? 'MAX' : `Buy: ${meta.cost} Z`}
                                </button>
                                {savedUpgrade.level > 0 && (
                                     <button
                                        onClick={() => handleToggleUpgrade(upgradeId)}
                                        className={`px-3 py-1 text-sm rounded ${savedUpgrade.active ? 'bg-purple-600 hover:bg-purple-500' : 'bg-gray-600 hover:bg-gray-500'}`}
                                    >
                                        {savedUpgrade.active ? 'ACTIVE' : 'INACTIVE'}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
             <button 
                onClick={() => setView('character')}
                className="mt-6 px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-500 transition-colors"
            >
                Back to Characters
            </button>
        </div>
     );
  }

  return (
    <div className="absolute inset-0 bg-gray-900 flex flex-col justify-center items-center z-50 p-8">
      <h1 className="text-6xl font-extrabold mb-4 text-red-500 tracking-wider" style={{ textShadow: '2px 2px 0 #000' }}>
        MODULAR SURVIVOR
      </h1>
       <div className="absolute top-4 right-4 text-2xl font-bold bg-purple-800 text-yellow-200 px-4 py-2 rounded-lg border-2 border-purple-500">
          Zenit: {saveData?.zenit.toLocaleString() || 0} Z
      </div>
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
       <button 
          onClick={() => setView('shop')}
          className="mt-8 px-8 py-4 bg-purple-600 text-white font-bold rounded-lg text-xl hover:bg-purple-500 transition-colors"
      >
          Upgrades
      </button>
    </div>
  );
};

export default StartScreen;