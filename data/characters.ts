

import type { PlayerStats, CharacterData } from '../types';

export const CHARACTERS: Record<string, CharacterData> = {
  raime: {
    id: 'raime',
    name: 'Raimé',
    initialStats: {
      maxHp: 90,
      currentHp: 90,
      moveSpeed: 3.2,
      defense: 0,
      damageMultiplier: 1.1,
      projectileSpeedMultiplier: 1,
      xpMultiplier: 1,
    } as PlayerStats,
    initialWeaponId: 'fist_of_fury',
    heroicGaugeMax: 200,
    heroicSkillDuration: 0, // Instant
    spriteSheet: '/sprites/player-placeholder.png',
    frameWidth: 32,
    frameHeight: 48,
  },
  andwyn: {
    id: 'andwyn',
    name: 'Andwyn, Arcane Mage',
    initialStats: {
      maxHp: 80,
      currentHp: 80,
      moveSpeed: 3,
      defense: 0,
      damageMultiplier: 1.2,
      projectileSpeedMultiplier: 1.1,
      xpMultiplier: 1,
    } as PlayerStats,
    initialWeaponId: 'book_of_the_celestial',
    heroicGaugeMax: 250,
    heroicSkillDuration: 0, // Instant
    spriteSheet: '/sprites/player-placeholder.png',
    frameWidth: 32,
    frameHeight: 48,
  },
  kazu: {
    id: 'kazu',
    name: 'Kazu, the Swordsman',
    initialStats: {
      maxHp: 100,
      currentHp: 100,
      moveSpeed: 3.5,
      defense: 0,
      damageMultiplier: 1.0,
      projectileSpeedMultiplier: 1.1,
      xpMultiplier: 1,
    } as PlayerStats,
    initialWeaponId: 'dragon_katana',
    heroicGaugeMax: 180,
    heroicSkillDuration: 10000, // 10 seconds
    spriteSheet: '/sprites/player-placeholder.png',
    frameWidth: 32,
    frameHeight: 48,
  },
  gaeru: {
    id: 'gaeru',
    name: 'Gaeru, the Explorer',
    initialStats: {
      maxHp: 100,
      currentHp: 100,
      moveSpeed: 3.3,
      defense: 5,
      damageMultiplier: 1.0,
      projectileSpeedMultiplier: 1.0,
      xpMultiplier: 1.1,
    } as PlayerStats,
    initialWeaponId: 'kirin_companion',
    heroicGaugeMax: 160,
    heroicSkillDuration: 12000, // 12 seconds
    spriteSheet: '/sprites/player-placeholder.png',
    frameWidth: 32,
    frameHeight: 48,
  },
  thorne: {
    id: 'thorne',
    name: 'Thorne, the Engineer',
    initialStats: {
      maxHp: 110,
      currentHp: 110,
      moveSpeed: 3.1,
      defense: 10,
      damageMultiplier: 1.0,
      projectileSpeedMultiplier: 1.0,
      xpMultiplier: 1.0,
    } as PlayerStats,
    initialWeaponId: 'deployable_turret',
    heroicGaugeMax: 220,
    heroicSkillDuration: 25000, // 25 seconds
    spriteSheet: '/sprites/player-placeholder.png',
    frameWidth: 32,
    frameHeight: 48,
  },
  ito: {
    id: 'ito',
    name: 'Ito, o Chef',
    initialStats: {
      maxHp: 100,
      currentHp: 100,
      moveSpeed: 3.2,
      defense: 0,
      damageMultiplier: 1.0,
      projectileSpeedMultiplier: 1.0,
      xpMultiplier: 1.0,
    } as PlayerStats,
    initialWeaponId: 'chefs_gloves',
    heroicGaugeMax: 190,
    heroicSkillDuration: 8000, // 8 seconds
    spriteSheet: '/sprites/player-placeholder.png',
    frameWidth: 32,
    frameHeight: 48,
  },
  test: {
    id: 'test',
    name: 'Test',
    initialStats: {
        maxHp: 100,
        currentHp: 100,
        moveSpeed: 3,
        defense: 0,
        damageMultiplier: 1,
        projectileSpeedMultiplier: 1,
        xpMultiplier: 5, // 400% more XP
    } as PlayerStats,
    // No initialWeaponId, it's selectable
    heroicGaugeMax: 100,
    heroicSkillDuration: 5000,
    spriteSheet: '/sprites/player-placeholder.png',
    frameWidth: 32,
    frameHeight: 48,
  }
};