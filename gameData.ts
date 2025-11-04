import type { SaveData } from './types';

const SAVE_KEY = 'modularSurvivorSave';

export const defaultSaveData: SaveData = {
  bestTimes: {},
};

export const loadGameData = (): SaveData => {
  try {
    const savedData = localStorage.getItem(SAVE_KEY);
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      return { ...defaultSaveData, ...parsedData };
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
