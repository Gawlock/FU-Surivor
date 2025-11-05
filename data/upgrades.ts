import type { UpgradeId } from '../types';

interface UpgradeMetadata {
    name: string;
    maxLevel: number;
    cost: number;
    description: (level: number) => string;
}

export const UPGRADES_DATA: Record<UpgradeId, UpgradeMetadata> = {
    revive: {
        name: 'Reviver',
        maxLevel: 1,
        cost: 10000,
        description: (level) => level > 0 
            ? 'Allows you to revive once per game with full HP.' 
            : 'Allows you to revive once per game with full HP.',
    },
    duplicator: {
        name: 'Duplicador de Cronita',
        maxLevel: 1,
        cost: 8000,
        description: (level) => level > 0
            ? 'Doubles the amount of projectiles fired from all sources.'
            : 'Doubles the amount of projectiles fired from all sources.',
    },
    speed: {
        name: 'Celeridade da Deusa',
        maxLevel: 5,
        cost: 5000,
        description: (level) => `Increases movement speed by ${level * 5}%. (Current: +${level*5}%)`,
    },
    projSpeed: {
        name: 'Catalisador de Cronita',
        maxLevel: 5,
        cost: 5000,
        description: (level) => `Increases projectile speed by ${level * 5}%. (Current: +${level*5}%)`,
    },
    damage: {
        name: 'Força Corrupta',
        maxLevel: 5,
        cost: 5000,
        description: (level) => `Increases all damage by ${level * 5}%. (Current: +${level*5}%)`,
    },
};
