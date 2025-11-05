import type { SaveData } from './types';

const SAVE_KEY = 'modularSurvivorSave';

export const defaultSaveData: SaveData = {
  bestTimes: {},
  completedStages: {},
  zenit: 0,
  upgrades: {
    revive: { level: 0, active: true },
    duplicator: { level: 0, active: true },
    speed: { level: 0, active: true },
    projSpeed: { level: 0, active: true },
    damage: { level: 0, active: true },
  }
};

export const loadGameData = (): SaveData => {
  try {
    const savedData = localStorage.getItem(SAVE_KEY);
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      // Deep merge to ensure new properties are added
      return {
        ...defaultSaveData,
        ...parsedData,
        upgrades: {
            ...defaultSaveData.upgrades,
            ...(parsedData.upgrades || {})
        },
        completedStages: {
          ...defaultSaveData.completedStages,
          ...(parsedData.completedStages || {})
        }
      };
    }
  } catch (error) {
    console.error("Failed to load save data from localStorage:", error);
  }
  return defaultSaveData;
};

export const saveGameData = (data: SaveData): void => {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save data to localStorage:", error);
  }
};