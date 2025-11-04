

import type { WeaponData, Player, Enemy, WeaponLevel, Projectile, Vector2D } from '../types';
import { getClosestEnemy, normalize } from '../utils';
import { PLAYER_SIZE } from '../constants';

export const WEAPONS: Record<string, WeaponData> = {
  magic_missile: {
    id: 'magic_missile',
    name: 'Magic Missile',
    icon: '✨',
    levels: [
      { level: 1, damage: 10, cooldown: 1500, projectiles: 1, projectileSpeed: 5, description: 'Fires a missile at the nearest enemy.' },
      { level: 2, damage: 12, cooldown: 1400, projectiles: 1, projectileSpeed: 5, description: 'Damage and cooldown improved.' },
      { level: 3, damage: 12, cooldown: 1400, projectiles: 2, projectileSpeed: 5.5, description: 'Fires an additional missile.' },
      { level: 4, damage: 15, cooldown: 1300, projectiles: 2, projectileSpeed: 6, description: 'Damage, cooldown, and speed improved.' },
      { level: 5, damage: 15, cooldown: 1200, projectiles: 3, projectileSpeed: 6, description: 'Fires a third missile.' },
    ],
    fire: (player, enemies, weaponLevel) => {
      const projectiles: Projectile[] = [];
      const closestEnemy = getClosestEnemy(player.position, enemies);
      if (closestEnemy) {
        for (let i = 0; i < weaponLevel.projectiles; i++) {
          const direction = normalize({
            x: closestEnemy.position.x - player.position.x,
            y: closestEnemy.position.y - player.position.y,
          });
          projectiles.push({
            id: `proj_${Date.now()}_${Math.random()}`,
            position: { ...player.position },
            size: 16,
            velocity: {
              x: direction.x * weaponLevel.projectileSpeed * player.stats.projectileSpeedMultiplier,
              y: direction.y * weaponLevel.projectileSpeed * player.stats.projectileSpeedMultiplier,
            },
            damage: weaponLevel.damage * player.stats.damageMultiplier,
            lifespan: 3000,
            color: 'bg-blue-400',
            piercing: false,
            weaponId: 'magic_missile',
          });
        }
      }
      return projectiles;
    },
  },
  spinning_axe: {
    id: 'spinning_axe',
    name: 'Spinning Axe',
    icon: '🪓',
    levels: [
      { level: 1, damage: 15, cooldown: 4000, projectiles: 1, projectileSpeed: 3, description: 'An axe spins around you.' },
      { level: 2, damage: 20, cooldown: 3800, projectiles: 1, projectileSpeed: 3, description: 'Damage improved.' },
      { level: 3, damage: 20, cooldown: 3500, projectiles: 2, projectileSpeed: 3.5, description: 'A second axe appears.' },
      { level: 4, damage: 25, cooldown: 3500, projectiles: 2, projectileSpeed: 4, description: 'Damage and speed improved.' },
      { level: 5, damage: 30, cooldown: 3000, projectiles: 3, projectileSpeed: 4, description: 'A third axe joins the dance.' },
    ],
    fire: (player, _enemies, weaponLevel) => {
      const projectiles: Projectile[] = [];
      const angleIncrement = (2 * Math.PI) / weaponLevel.projectiles;
      for (let i = 0; i < weaponLevel.projectiles; i++) {
        const angle = i * angleIncrement;
        projectiles.push({
          id: `proj_${Date.now()}_${Math.random()}_${i}`,
          position: { ...player.position },
          size: 28,
          // Custom logic for spinning
          velocity: { x: angle, y: weaponLevel.projectileSpeed * player.stats.projectileSpeedMultiplier }, // x is angle, y is speed
          damage: weaponLevel.damage * player.stats.damageMultiplier,
          lifespan: weaponLevel.cooldown - 100,
          color: 'bg-gray-300',
          piercing: true,
          weaponId: 'spinning_axe',
        });
      }
      return projectiles;
    },
  },
  fist_of_fury: {
    id: 'fist_of_fury',
    name: 'Fist of Fury',
    icon: '👊',
    levels: [
      { level: 1, damage: 20, cooldown: 800, projectiles: 3, projectileSpeed: 7, description: 'Unleash a cone of three piercing punches.' },
      { level: 2, damage: 25, cooldown: 750, projectiles: 3, projectileSpeed: 7, description: 'Increased damage and faster cooldown.' },
      { level: 3, damage: 30, cooldown: 750, projectiles: 3, projectileSpeed: 7.5, description: 'Increased damage and projectile speed.' },
      { level: 4, damage: 30, cooldown: 700, projectiles: 5, projectileSpeed: 7.5, description: 'Unleash a wider cone of five punches.' },
      { level: 5, damage: 40, cooldown: 650, projectiles: 5, projectileSpeed: 8, description: 'Maximum power and speed.' },
    ],
    fire: (player: Player, enemies: Enemy[], weaponLevel: WeaponLevel, targetDirection?: Vector2D): Projectile[] => {
      const projectiles: Projectile[] = [];
      let baseDirection: Vector2D;

      if (targetDirection && (targetDirection.x !== 0 || targetDirection.y !== 0)) {
        baseDirection = targetDirection;
      } else {
        // Fallback to original logic
        baseDirection = normalize(player.velocity);
        if (baseDirection.x === 0 && baseDirection.y === 0) {
          const closestEnemy = getClosestEnemy(player.position, enemies);
          if (closestEnemy) {
            baseDirection = normalize({
              x: closestEnemy.position.x - player.position.x,
              y: closestEnemy.position.y - player.position.y,
            });
          } else {
              baseDirection = { x: 1, y: 0 }; 
          }
        }
      }

      const baseAngle = Math.atan2(baseDirection.y, baseDirection.x);
      const coneSpread = Math.PI / 8; 

      const angles = [];
      const numProjectiles = weaponLevel.projectiles;
      if (numProjectiles === 1) {
        angles.push(baseAngle);
      } else {
          for(let i = 0; i < numProjectiles; i++) {
              angles.push(baseAngle - coneSpread + (i * (2 * coneSpread / (numProjectiles - 1)) ));
          }
      }
      
      for (const angle of angles) {
        const velocity = {
          x: Math.cos(angle) * weaponLevel.projectileSpeed * player.stats.projectileSpeedMultiplier,
          y: Math.sin(angle) * weaponLevel.projectileSpeed * player.stats.projectileSpeedMultiplier,
        };
        projectiles.push({
          id: `proj_${Date.now()}_${Math.random()}`,
          position: { x: player.position.x + velocity.x*2, y: player.position.y + velocity.y*2 },
          size: 20,
          velocity,
          damage: weaponLevel.damage * player.stats.damageMultiplier,
          lifespan: 400,
          color: 'bg-orange-400',
          piercing: true,
          weaponId: 'fist_of_fury',
        });
      }
      return projectiles;
    },
  },
  book_of_the_celestial: {
    id: 'book_of_the_celestial',
    name: 'Book of the Celestial',
    icon: '📖',
    levels: [
        { level: 1, damage: 15, cooldown: 2000, projectiles: 1, projectileSpeed: 4, explosionDamage: 25, explosionRadius: 80, description: 'Fires a seeking fireball. Enemies slain by it explode.' },
        { level: 2, damage: 20, cooldown: 1800, projectiles: 1, projectileSpeed: 4, explosionDamage: 30, explosionRadius: 90, description: 'Increased damage and explosion size.' },
        { level: 3, damage: 20, cooldown: 1800, projectiles: 2, projectileSpeed: 4.5, explosionDamage: 30, explosionRadius: 90, description: 'Fires an additional fireball.' },
        { level: 4, damage: 25, cooldown: 1600, projectiles: 2, projectileSpeed: 5, explosionDamage: 40, explosionRadius: 100, description: 'Faster, stronger, and more explosive.' },
        { level: 5, damage: 25, cooldown: 1500, projectiles: 3, projectileSpeed: 5, explosionDamage: 50, explosionRadius: 110, description: 'Unleashes a volley of three exploding fireballs.' },
    ],
    fire: (player, enemies, weaponLevel) => {
      const projectiles: Projectile[] = [];
      const availableEnemies = [...enemies];
      
      for (let i = 0; i < weaponLevel.projectiles; i++) {
        const closestEnemy = getClosestEnemy(player.position, availableEnemies);
        if (closestEnemy) {
          // Remove enemy from pool so multiple projectiles don't target the same one
          availableEnemies.splice(availableEnemies.indexOf(closestEnemy), 1);
          
          const direction = normalize({
            x: closestEnemy.position.x - player.position.x,
            y: closestEnemy.position.y - player.position.y,
          });

          projectiles.push({
            id: `proj_${Date.now()}_${Math.random()}`,
            position: { ...player.position },
            size: 18,
            velocity: {
              x: direction.x * weaponLevel.projectileSpeed * player.stats.projectileSpeedMultiplier,
              y: direction.y * weaponLevel.projectileSpeed * player.stats.projectileSpeedMultiplier,
            },
            damage: weaponLevel.damage * player.stats.damageMultiplier,
            lifespan: 4000,
            color: 'bg-red-500',
            piercing: false,
            weaponId: 'book_of_the_celestial',
          });
        }
      }
      return projectiles;
    },
  },
  dragon_katana: {
    id: 'dragon_katana',
    name: 'Dragon Katana',
    icon: '🗡️',
    levels: [
      { level: 1, damage: 5, cooldown: 200, projectiles: 1, projectileSpeed: 6, description: 'A swift slash with a weaving trajectory.' },
      { level: 2, damage: 5, cooldown: 200, projectiles: 2, projectileSpeed: 6, description: 'A second slash joins the flurry.' },
      { level: 3, damage: 6, cooldown: 180, projectiles: 2, projectileSpeed: 6.5, description: 'Faster slashes and improved damage.' },
      { level: 4, damage: 6, cooldown: 180, projectiles: 3, projectileSpeed: 6.5, description: 'Unleash a third weaving slash.' },
      { level: 5, damage: 8, cooldown: 150, projectiles: 3, projectileSpeed: 7, description: 'A relentless storm of serpentine strikes.' },
    ],
    fire: (player: Player, enemies: Enemy[], weaponLevel: WeaponLevel, targetDirection?: Vector2D): Projectile[] => {
      const projectiles: Projectile[] = [];
      let baseDirection: Vector2D;

      if (targetDirection && (targetDirection.x !== 0 || targetDirection.y !== 0)) {
        baseDirection = targetDirection;
      } else {
        baseDirection = normalize(player.velocity);
        if (baseDirection.x === 0 && baseDirection.y === 0) {
          const closestEnemy = getClosestEnemy(player.position, enemies);
          if (closestEnemy) {
            baseDirection = normalize({
              x: closestEnemy.position.x - player.position.x,
              y: closestEnemy.position.y - player.position.y,
            });
          } else {
            baseDirection = { x: 1, y: 0 };
          }
        }
      }

      const baseAngle = Math.atan2(baseDirection.y, baseDirection.x);
      const spread = Math.PI / 16;
      const numProjectiles = weaponLevel.projectiles;

      for (let i = 0; i < numProjectiles; i++) {
        const angleOffset = (i - (numProjectiles - 1) / 2) * spread;
        const angle = baseAngle + angleOffset;
        const velocity = {
          x: Math.cos(angle) * weaponLevel.projectileSpeed * player.stats.projectileSpeedMultiplier,
          y: Math.sin(angle) * weaponLevel.projectileSpeed * player.stats.projectileSpeedMultiplier,
        };
        projectiles.push({
          id: `proj_${Date.now()}_${Math.random()}_${i}`,
          position: { ...player.position },
          size: 24,
          velocity,
          damage: weaponLevel.damage * player.stats.damageMultiplier,
          lifespan: 600,
          color: 'bg-green-400',
          piercing: true,
          weaponId: 'dragon_katana',
          customUpdate: 'serpentine',
          spawnTime: Date.now(),
        });
      }
      return projectiles;
    },
  },
  kirin_companion: {
    id: 'kirin_companion',
    name: 'Kirin Companion',
    icon: '🦄',
    levels: [
        { level: 1, damage: 12, cooldown: 1000, projectiles: 1, projectileSpeed: 6, description: 'Summons Kirin, a loyal pet who attacks nearby foes.' },
        { level: 2, damage: 15, cooldown: 1000, projectiles: 1, projectileSpeed: 6.5, description: 'Kirin becomes stronger and faster.' },
        { level: 3, damage: 15, cooldown: 1000, projectiles: 2, projectileSpeed: 6.5, description: 'Summons a second Kirin to fight by your side.' },
        { level: 4, damage: 20, cooldown: 1000, projectiles: 2, projectileSpeed: 7, description: 'Both Kirins grow in power.' },
        { level: 5, damage: 20, cooldown: 1000, projectiles: 3, projectileSpeed: 7, description: 'A third Kirin joins the hunt.' },
    ],
    fire: (player: Player, _enemies: Enemy[], weaponLevel: WeaponLevel): Projectile[] => {
        const projectiles: Projectile[] = [];
        // This function returns the full set of Kirins. The game loop will replace the old ones.
        for (let i = 0; i < weaponLevel.projectiles; i++) {
            projectiles.push({
                id: `proj_kirin_${i}`, // Stable ID
                position: { x: player.position.x + Math.random()*20-10, y: player.position.y + Math.random()*20-10 },
                size: 28,
                velocity: { x: 0, y: weaponLevel.projectileSpeed * player.stats.projectileSpeedMultiplier }, // y stores speed
                damage: weaponLevel.damage * player.stats.damageMultiplier,
                lifespan: 999999, // Essentially permanent
                color: 'bg-yellow-300',
                piercing: true,
                weaponId: 'kirin_companion',
                customUpdate: 'kirin',
            });
        }
        return projectiles;
    }
  },
  deployable_turret: {
    id: 'deployable_turret',
    name: 'Deployable Turret',
    icon: '⚙️',
    levels: [
      { level: 1, damage: 10, cooldown: 5000, projectiles: 1, projectileSpeed: 6, description: 'Deploys a turret that fires at enemies.', maxDeployed: 1, turretLifespan: 10000, turretFireCooldown: 1000 },
      { level: 2, damage: 12, cooldown: 5000, projectiles: 1, projectileSpeed: 6, description: 'Turret damage increased.', maxDeployed: 1, turretLifespan: 10000, turretFireCooldown: 900 },
      { level: 3, damage: 12, cooldown: 4500, projectiles: 1, projectileSpeed: 6.5, description: 'Deploy a second turret.', maxDeployed: 2, turretLifespan: 12000, turretFireCooldown: 900 },
      { level: 4, damage: 15, cooldown: 4500, projectiles: 1, projectileSpeed: 7, description: 'Turrets fire faster.', maxDeployed: 2, turretLifespan: 12000, turretFireCooldown: 750 },
      { level: 5, damage: 15, cooldown: 4000, projectiles: 1, projectileSpeed: 7, description: 'Deploy a third, more powerful turret.', maxDeployed: 3, turretLifespan: 15000, turretFireCooldown: 750 },
    ],
    deploy: (player, weaponLevel) => {
        return {
            size: 30,
            lifespan: weaponLevel.turretLifespan!,
            weaponId: 'deployable_turret',
            weaponLevel: weaponLevel.level,
        };
    }
  },
  chefs_gloves: {
    id: 'chefs_gloves',
    name: 'Luvas do Chef',
    icon: '🍳',
    levels: [
      { level: 1, damage: 8, cooldown: 1000, projectiles: 1, projectileSpeed: 4, description: 'Lança projéteis culinários de tamanho, velocidade e dano aleatórios.' },
      { level: 2, damage: 8, cooldown: 900, projectiles: 1, projectileSpeed: 4, description: 'Cozinha mais rápido.' },
      { level: 3, damage: 10, cooldown: 900, projectiles: 1, projectileSpeed: 4.5, description: 'Ingredientes mais potentes e velozes.' },
      { level: 4, damage: 10, cooldown: 800, projectiles: 2, projectileSpeed: 4.5, description: 'Atira um segundo projétil.' },
      { level: 5, damage: 12, cooldown: 700, projectiles: 2, projectileSpeed: 5, description: 'Caos culinário máximo!' },
    ],
    fire: (player: Player, _enemies: Enemy[], weaponLevel: WeaponLevel, targetDirection?: Vector2D): Projectile[] => {
      const projectiles: Projectile[] = [];
      const baseDirection = targetDirection;
      if (!baseDirection || (baseDirection.x === 0 && baseDirection.y === 0)) return [];
      
      for (let i = 0; i < weaponLevel.projectiles; i++) {
          const sizeMultiplier = 0.25 + Math.random() * 3.75;
          const size = PLAYER_SIZE * sizeMultiplier;
          
          const speedMultiplier = 0.8 + Math.random() * 0.4;
          const speed = weaponLevel.projectileSpeed * speedMultiplier * player.stats.projectileSpeedMultiplier;

          const damage = weaponLevel.damage * sizeMultiplier * player.stats.damageMultiplier;
          
          const baseAngle = Math.atan2(baseDirection.y, baseDirection.x);
          const spread = (i > 0) ? (Math.random() - 0.5) * (Math.PI / 12) : 0;
          const finalAngle = baseAngle + spread;

          const velocity = {
              x: Math.cos(finalAngle) * speed,
              y: Math.sin(finalAngle) * speed,
          };

          projectiles.push({
              id: `proj_${Date.now()}_${Math.random()}`,
              position: { ...player.position },
              size,
              velocity,
              damage,
              lifespan: 3000,
              color: 'bg-orange-300',
              piercing: true,
              weaponId: 'chefs_gloves',
          });
      }
      return projectiles;
    },
  },
};