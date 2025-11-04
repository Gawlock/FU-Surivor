
import React from 'react';
import type { LevelUpOption, Attribute } from '../types';
import { WEAPONS } from '../data/weapons';

interface LevelUpModalProps {
  attributeOptions: LevelUpOption<Attribute>[];
  weaponOptions: LevelUpOption<string>[];
  onAttributeSelect: (attribute: Attribute) => void;
  onWeaponSelect: (weaponId: string) => void;
  mode: 'attribute' | 'weapon';
}

const LevelUpModal: React.FC<LevelUpModalProps> = ({ attributeOptions, weaponOptions, onAttributeSelect, onWeaponSelect, mode }) => {
  const options = mode === 'attribute' ? attributeOptions : weaponOptions;
  const onSelect = mode === 'attribute' ? onAttributeSelect : onWeaponSelect;

  return (
    <div className="absolute inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-gray-800 border-2 border-yellow-400 p-8 rounded-lg shadow-lg text-center w-full max-w-4xl">
        <h2 className="text-3xl font-bold mb-6 text-yellow-300">{mode === 'attribute' ? 'Attribute Upgrade!' : 'Choose Your Weapon!'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => onSelect(option.id as any)}
              className="bg-gray-700 border-2 border-gray-600 p-6 rounded-lg hover:bg-yellow-500 hover:border-white hover:text-black transition-all duration-200 transform hover:scale-105"
            >
              <div className="text-5xl mb-3">{WEAPONS[option.id]?.icon || '💪'}</div>
              <h3 className="text-xl font-bold mb-2">{option.title}</h3>
              <p className="text-sm text-gray-300">{option.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LevelUpModal;
