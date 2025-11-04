

import type { WeaponData, Player, Enemy, WeaponLevel, Projectile, Vector2D } from '../types';
import { getClosestEnemy, normalize } from '../utils';
import { PLAYER_SIZE, GAME_TICK_RATE } from '../constants';

export const WEAPONS: Record<string, WeaponData> = {
  magic_missile: {
    id: 'magic_missile',
    name: 'Magic Missile',
    icon: '✨',
    levels: [
      { level: 1, damage: 10, cooldown: 1500, projectiles: 1, projectileSpeed: 5, knockback: 1, description: 'Fires a missile at the nearest enemy.' },
      { level: 2, damage: 12, cooldown: 1400, projectiles: 1, projectileSpeed: 5, knockback: 1, description: 'Damage and cooldown improved.' },
      { level: 3, damage: 12, cooldown: 1400, projectiles: 2, projectileSpeed: 5.5, knockback: 1, description: 'Fires an additional missile.' },
      { level: 4, damage: 15, cooldown: 1300, projectiles: 2, projectileSpeed: 6, knockback: 1, description: 'Damage, cooldown, and speed improved.' },
      { level: 5, damage: 15, cooldown: 1200, projectiles: 3, projectileSpeed: 6, knockback: 1, description: 'Fires a third missile.' },
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
            knockback: weaponLevel.knockback,
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
      { level: 1, damage: 15, cooldown: 4000, projectiles: 1, projectileSpeed: 3, knockback: 6, description: 'An axe spins around you.' },
      { level: 2, damage: 20, cooldown: 3800, projectiles: 1, projectileSpeed: 3, knockback: 6, description: 'Damage improved.' },
      { level: 3, damage: 20, cooldown: 3500, projectiles: 2, projectileSpeed: 3.5, knockback: 7, description: 'A second axe appears.' },
      { level: 4, damage: 25, cooldown: 3500, projectiles: 2, projectileSpeed: 4, knockback: 7, description: 'Damage and speed improved.' },
      { level: 5, damage: 30, cooldown: 3000, projectiles: 3, projectileSpeed: 4, knockback: 8, description: 'A third axe joins the dance.' },
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
          knockback: weaponLevel.knockback,
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
      { level: 1, damage: 20, cooldown: 800, projectiles: 3, projectileSpeed: 7, knockback: 8, description: 'Unleash a cone of three piercing punches.' },
      { level: 2, damage: 25, cooldown: 750, projectiles: 3, projectileSpeed: 7, knockback: 8, description: 'Increased damage and faster cooldown.' },
      { level: 3, damage: 30, cooldown: 750, projectiles: 3, projectileSpeed: 7.5, knockback: 9, description: 'Increased damage and projectile speed.' },
      { level: 4, damage: 30, cooldown: 700, projectiles: 5, projectileSpeed: 7.5, knockback: 9, description: 'Unleash a wider cone of five punches.' },
      { level: 5, damage: 40, cooldown: 650, projectiles: 5, projectileSpeed: 8, knockback: 10, description: 'Maximum power and speed.' },
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
          knockback: weaponLevel.knockback,
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
        { level: 1, damage: 15, cooldown: 2000, projectiles: 1, projectileSpeed: 4, knockback: 1, explosionDamage: 25, explosionRadius: 80, description: 'Fires a seeking fireball. Enemies slain by it explode.' },
        { level: 2, damage: 20, cooldown: 1800, projectiles: 1, projectileSpeed: 4, knockback: 1, explosionDamage: 30, explosionRadius: 90, description: 'Increased damage and explosion size.' },
        { level: 3, damage: 20, cooldown: 1800, projectiles: 2, projectileSpeed: 4.5, knockback: 1, explosionDamage: 30, explosionRadius: 90, description: 'Fires an additional fireball.' },
        { level: 4, damage: 25, cooldown: 1600, projectiles: 2, projectileSpeed: 5, knockback: 1, explosionDamage: 40, explosionRadius: 100, description: 'Faster, stronger, and more explosive.' },
        { level: 5, damage: 25, cooldown: 1500, projectiles: 3, projectileSpeed: 5, knockback: 1, explosionDamage: 50, explosionRadius: 110, description: 'Unleashes a volley of three exploding fireballs.' },
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
            knockback: weaponLevel.knockback,
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
      { level: 1, damage: 5, cooldown: 200, projectiles: 1, projectileSpeed: 6, knockback: 4, description: 'A swift slash with a weaving trajectory.' },
      { level: 2, damage: 5, cooldown: 200, projectiles: 2, projectileSpeed: 6, knockback: 4, description: 'A second slash joins the flurry.' },
      { level: 3, damage: 6, cooldown: 180, projectiles: 2, projectileSpeed: 6.5, knockback: 5, description: 'Faster slashes and improved damage.' },
      { level: 4, damage: 6, cooldown: 180, projectiles: 3, projectileSpeed: 6.5, knockback: 5, description: 'Unleash a third weaving slash.' },
      { level: 5, damage: 8, cooldown: 150, projectiles: 3, projectileSpeed: 7, knockback: 6, description: 'A relentless storm of serpentine strikes.' },
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
          knockback: weaponLevel.knockback,
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
        { level: 1, damage: 12, cooldown: 1000, projectiles: 1, projectileSpeed: 6, knockback: 3, description: 'Summons Kirin, a loyal pet who attacks nearby foes.' },
        { level: 2, damage: 15, cooldown: 1000, projectiles: 1, projectileSpeed: 6.5, knockback: 3, description: 'Kirin becomes stronger and faster.' },
        { level: 3, damage: 15, cooldown: 1000, projectiles: 2, projectileSpeed: 6.5, knockback: 4, description: 'Summons a second Kirin to fight by your side.' },
        { level: 4, damage: 20, cooldown: 1000, projectiles: 2, projectileSpeed: 7, knockback: 4, description: 'Both Kirins grow in power.' },
        { level: 5, damage: 20, cooldown: 1000, projectiles: 3, projectileSpeed: 7, knockback: 5, description: 'A third Kirin joins the hunt.' },
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
                knockback: weaponLevel.knockback,
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
      { level: 1, damage: 10, cooldown: 5000, projectiles: 1, projectileSpeed: 6, knockback: 2, description: 'Deploys a turret that fires at enemies.', maxDeployed: 1, turretLifespan: 10000, turretFireCooldown: 1000 },
      { level: 2, damage: 12, cooldown: 5000, projectiles: 1, projectileSpeed: 6, knockback: 2, description: 'Turret damage increased.', maxDeployed: 1, turretLifespan: 10000, turretFireCooldown: 900 },
      { level: 3, damage: 12, cooldown: 4500, projectiles: 1, projectileSpeed: 6.5, knockback: 3, description: 'Deploy a second turret.', maxDeployed: 2, turretLifespan: 12000, turretFireCooldown: 900 },
      { level: 4, damage: 15, cooldown: 4500, projectiles: 1, projectileSpeed: 7, knockback: 3, description: 'Turrets fire faster.', maxDeployed: 2, turretLifespan: 12000, turretFireCooldown: 750 },
      { level: 5, damage: 15, cooldown: 4000, projectiles: 1, projectileSpeed: 7, knockback: 4, description: 'Deploy a third, more powerful turret.', maxDeployed: 3, turretLifespan: 15000, turretFireCooldown: 750 },
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
      { level: 1, damage: 8, cooldown: 1000, projectiles: 1, projectileSpeed: 4, knockback: 2, description: 'Lança projéteis culinários de tamanho, velocidade e dano aleatórios.' },
      { level: 2, damage: 8, cooldown: 900, projectiles: 1, projectileSpeed: 4, knockback: 2, description: 'Cozinha mais rápido.' },
      { level: 3, damage: 10, cooldown: 900, projectiles: 1, projectileSpeed: 4.5, knockback: 2, description: 'Ingredientes mais potentes e velozes.' },
      { level: 4, damage: 10, cooldown: 800, projectiles: 2, projectileSpeed: 4.5, knockback: 2, description: 'Atira um segundo projétil.' },
      { level: 5, damage: 12, cooldown: 700, projectiles: 2, projectileSpeed: 5, knockback: 2, description: 'Caos culinário máximo!' },
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
          const knockback = (weaponLevel.knockback || 2) * sizeMultiplier;
          
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
              knockback,
              lifespan: 3000,
              color: 'bg-orange-300',
              piercing: true,
              weaponId: 'chefs_gloves',
          });
      }
      return projectiles;
    },
  },
  doggolita: {
    id: 'doggolita',
    name: 'Doggolita',
    icon: '💎',
    levels: [
      { level: 1, damage: 0, cooldown: 99999, projectiles: 0, projectileSpeed: 0, description: 'Regenerates 3 HP every 10 seconds.', hpRegen: 3, regenInterval: 10000 },
      { level: 2, damage: 0, cooldown: 99999, projectiles: 0, projectileSpeed: 0, description: 'Regenerates 4 HP every 10 seconds.', hpRegen: 4, regenInterval: 10000 },
      { level: 3, damage: 0, cooldown: 99999, projectiles: 0, projectileSpeed: 0, description: 'Regenerates 4 HP every 8 seconds.', hpRegen: 4, regenInterval: 8000 },
      { level: 4, damage: 0, cooldown: 99999, projectiles: 0, projectileSpeed: 0, description: 'Regenerates 5 HP every 8 seconds.', hpRegen: 5, regenInterval: 8000 },
      { level: 5, damage: 0, cooldown: 99999, projectiles: 0, projectileSpeed: 0, description: 'Regenerates 5 HP every 6 seconds.', hpRegen: 5, regenInterval: 6000 },
    ],
  },
  aura_do_deus_galo: {
    id: 'aura_do_deus_galo',
    name: 'Aura do deus Galo',
    icon: '🐔',
    levels: [
      { level: 1, damage: 0, cooldown: 99999, projectiles: 0, projectileSpeed: 0, description: 'Creates a damaging aura. Radius: 100.', auraRadius: 100, auraDamagePerSecond: 5, knockback: 0.5 },
      { level: 2, damage: 0, cooldown: 99999, projectiles: 0, projectileSpeed: 0, description: 'Increases aura radius to 125.', auraRadius: 125, auraDamagePerSecond: 7, knockback: 0.5 },
      { level: 3, damage: 0, cooldown: 99999, projectiles: 0, projectileSpeed: 0, description: 'Increases aura radius to 150.', auraRadius: 150, auraDamagePerSecond: 10, knockback: 0.6 },
      { level: 4, damage: 0, cooldown: 99999, projectiles: 0, projectileSpeed: 0, description: 'Increases aura radius to 175.', auraRadius: 175, auraDamagePerSecond: 14, knockback: 0.6 },
      { level: 5, damage: 0, cooldown: 99999, projectiles: 0, projectileSpeed: 0, description: 'Increases aura radius to 200.', auraRadius: 200, auraDamagePerSecond: 20, knockback: 0.7 },
    ],
  },
  kaminari_no_ou: {
    id: 'kaminari_no_ou',
    name: 'Fragmento de Shura: Kaminari-no-Ou',
    icon: '⚡',
    levels: [
        { level: 1, damage: 40, cooldown: 8000, projectiles: 0, projectileSpeed: 0, knockback: 2, explosionDamage: 15, explosionRadius: 60, description: 'Calls a lightning strike on a random enemy, dealing area damage.' },
        { level: 2, damage: 50, cooldown: 7000, projectiles: 0, projectileSpeed: 0, knockback: 2, explosionDamage: 20, explosionRadius: 65, description: 'Faster cooldown and more damage.' },
        { level: 3, damage: 60, cooldown: 6000, projectiles: 0, projectileSpeed: 0, knockback: 3, explosionDamage: 25, explosionRadius: 70, description: 'Cooldown further reduced, area increased.' },
        { level: 4, damage: 70, cooldown: 5000, projectiles: 0, projectileSpeed: 0, knockback: 3, explosionDamage: 30, explosionRadius: 75, description: 'Significant cooldown and damage boost.' },
        { level: 5, damage: 90, cooldown: 3500, projectiles: 0, projectileSpeed: 0, knockback: 4, explosionDamage: 40, explosionRadius: 90, description: 'The fury of the lightning god descends frequently.' },
    ],
    fire: (player: Player, enemies: Enemy[], weaponLevel: WeaponLevel): Projectile[] => {
        if (enemies.length === 0) return [];

        const targetEnemy = enemies[Math.floor(Math.random() * enemies.length)];
        const targetPosition = { ...targetEnemy.position };
        const aoeDamage = (weaponLevel.explosionDamage || 0) * player.stats.damageMultiplier;
        const directHitBonusDamage = (weaponLevel.damage * player.stats.damageMultiplier) - aoeDamage;
        const now = Date.now();
        const rand = Math.random();

        const projectiles: Projectile[] = [];

        // 1. Direct hit projectile (small, hits only the main target for bonus damage)
        projectiles.push({
            id: `proj_${now}_${rand}_direct`,
            position: targetPosition,
            size: targetEnemy.size, // Collides only with the main target
            velocity: { x: 0, y: 0 },
            damage: directHitBonusDamage,
            knockback: weaponLevel.knockback,
            lifespan: GAME_TICK_RATE,
            color: 'bg-transparent',
            piercing: false,
            weaponId: 'kaminari_no_ou',
        });

        // 2. AoE damage projectile (large, hits everything in the radius)
        projectiles.push({
            id: `proj_${now}_${rand}_aoe`,
            position: targetPosition,
            size: (weaponLevel.explosionRadius || 0) * 2,
            velocity: { x: 0, y: 0 },
            damage: aoeDamage,
            knockback: weaponLevel.knockback,
            lifespan: GAME_TICK_RATE,
            color: 'bg-transparent',
            piercing: true,
            weaponId: 'kaminari_no_ou',
        });
        
        // 3. Visual effect projectile (no damage, just for show)
         projectiles.push({
            id: `proj_${now}_${rand}_visual`,
            position: targetPosition,
            size: (weaponLevel.explosionRadius || 0) * 2,
            velocity: { x: 0, y: 0 },
            damage: 0,
            lifespan: 150, // Lasts a bit longer to be visible
            color: 'bg-yellow-300',
            piercing: true,
            weaponId: 'kaminari_no_ou_visual',
        });

        return projectiles;
    }
  },
  hikari: {
    id: 'hikari',
    name: 'Fragmento de Shura: Hikari',
    icon: '💫',
    levels: [
      { level: 1, damage: 30, cooldown: 2500, projectiles: 1, projectileSpeed: 10, knockback: 12, description: 'A swift, straight slash that pushes enemies back.' },
      { level: 2, damage: 35, cooldown: 2300, projectiles: 1, projectileSpeed: 10, knockback: 13, description: 'Increased damage and knockback.' },
      { level: 3, damage: 45, cooldown: 2100, projectiles: 1, projectileSpeed: 11, knockback: 14, description: 'Slash becomes faster and more powerful.' },
      { level: 4, damage: 55, cooldown: 1900, projectiles: 1, projectileSpeed: 11, knockback: 15, description: 'Significant damage boost and faster attack.' },
      { level: 5, damage: 70, cooldown: 1500, projectiles: 1, projectileSpeed: 12, knockback: 18, description: 'Unleashes a massive, high-speed slash.' },
    ],
    fire: (player: Player, _enemies: Enemy[], weaponLevel: WeaponLevel, targetDirection?: Vector2D): Projectile[] => {
      const projectiles: Projectile[] = [];
      
      if (!targetDirection || (targetDirection.x === 0 && targetDirection.y === 0)) {
        return []; // Don't fire without a direction
      }

      const velocity = {
        x: targetDirection.x * weaponLevel.projectileSpeed * player.stats.projectileSpeedMultiplier,
        y: targetDirection.y * weaponLevel.projectileSpeed * player.stats.projectileSpeedMultiplier,
      };

      projectiles.push({
        id: `proj_${Date.now()}_${Math.random()}`,
        position: { 
          x: player.position.x + targetDirection.x * (player.size / 2), 
          y: player.position.y + targetDirection.y * (player.size / 2) 
        },
        size: 40,
        velocity,
        damage: weaponLevel.damage * player.stats.damageMultiplier,
        knockback: weaponLevel.knockback,
        lifespan: 250,
        color: 'bg-cyan-300',
        piercing: true,
        weaponId: 'hikari',
      });
      
      return projectiles;
    },
  },
  fibonacci_magicus: {
    id: 'fibonacci_magicus',
    name: 'Fibonacci Magicus',
    icon: '🌀',
    levels: [
      { level: 1, damage: 25, cooldown: 3000, projectiles: 1, projectileSpeed: 8, knockback: 3, description: 'Fires a piercing spiral of energy.' },
      { level: 2, damage: 30, cooldown: 2800, projectiles: 1, projectileSpeed: 8, knockback: 3, description: 'Increased damage.' },
      { level: 3, damage: 35, cooldown: 2500, projectiles: 1, projectileSpeed: 8, knockback: 4, description: 'Faster cooldown and more damage.' },
      { level: 4, damage: 40, cooldown: 2500, projectiles: 1, projectileSpeed: 8, knockback: 4, description: 'Increased damage.' },
      { level: 5, damage: 40, cooldown: 2200, projectiles: 2, projectileSpeed: 8, knockback: 5, description: 'Fires a second spiral in the opposite direction.' },
    ],
    fire: (player: Player, _enemies: Enemy[], weaponLevel: WeaponLevel, targetDirection?: Vector2D): Projectile[] => {
      const projectiles: Projectile[] = [];
      if (!targetDirection || (targetDirection.x === 0 && targetDirection.y === 0)) {
        return []; // Don't fire without a direction
      }

      const baseAngle = Math.atan2(targetDirection.y, targetDirection.x);
      const numProjectiles = weaponLevel.projectiles;

      for (let i = 0; i < numProjectiles; i++) {
        // For 2 projectiles, fire them 180 degrees apart
        const angle = baseAngle + (i * Math.PI);
        
        projectiles.push({
          id: `proj_${Date.now()}_${Math.random()}_${i}`,
          position: { ...player.position },
          size: 22,
          // velocity.x stores rotation speed (rad/sec), velocity.y stores growth speed (px/sec)
          velocity: { x: weaponLevel.projectileSpeed, y: 120 },
          damage: weaponLevel.damage * player.stats.damageMultiplier,
          knockback: weaponLevel.knockback,
          lifespan: 2500, // Spiral lasts for 2.5 seconds
          color: 'bg-purple-400',
          piercing: true,
          weaponId: 'fibonacci_magicus',
          customUpdate: 'fibonacci',
          spawnPosition: { ...player.position },
          currentAngle: angle,
          spawnTime: Date.now(),
        });
      }
      return projectiles;
    },
  },
  baralho_do_malandro: {
    id: 'baralho_do_malandro',
    name: 'O Baralho do Malandro',
    icon: '🃏',
    levels: [
      { level: 1, damage: 20, cooldown: 12000, projectiles: 0, projectileSpeed: 0, knockback: 3, description: 'Saca uma carta aleatória, disparando projéteis.' },
      { level: 2, damage: 25, cooldown: 11000, projectiles: 0, projectileSpeed: 0, knockback: 3, description: 'Dano aumentado, saca cartas mais rápido.' },
      { level: 3, damage: 30, cooldown: 10000, projectiles: 0, projectileSpeed: 0, knockback: 4, description: 'Dano aumentado, saca cartas mais rápido.' },
      { level: 4, damage: 35, cooldown: 9000, projectiles: 0, projectileSpeed: 0, knockback: 4, description: 'Dano aumentado, saca cartas mais rápido.' },
      { level: 5, damage: 45, cooldown: 8000, projectiles: 0, projectileSpeed: 0, knockback: 5, description: 'O baralho está totalmente a seu favor.' },
    ],
    fire: (player: Player, _enemies: Enemy[], weaponLevel: WeaponLevel): Projectile[] => {
      const projectiles: Projectile[] = [];
      const cardValues = [2, 3, 4, 5, 6, 7, 8, 9, 10, 20]; // 20 is Ace
      const drawnValue = cardValues[Math.floor(Math.random() * cardValues.length)];
      const displayText = drawnValue === 20 ? 'A' : String(drawnValue);

      // Create the text display projectile
      projectiles.push({
          id: `proj_card_display_${Date.now()}_${Math.random()}`,
          position: { ...player.position },
          size: 0,
          velocity: { x: 0, y: 0 },
          damage: 0,
          lifespan: 2000, // Display for 2 seconds
          color: 'bg-transparent',
          weaponId: 'baralho_do_malandro_display',
          customUpdate: 'card_display',
          displayText: displayText,
      });
      
      // Create the damaging card projectiles
      for (let i = 0; i < drawnValue; i++) {
        const angle = Math.random() * 2 * Math.PI;
        const speed = (2 + Math.random() * 3) * player.stats.projectileSpeedMultiplier;
        const sizeMultiplier = 0.5 + Math.random() * 2.0; // 50% to 250%
        
        projectiles.push({
          id: `proj_card_${Date.now()}_${i}`,
          position: { ...player.position },
          size: 0, // Using width/height instead
          width: player.size * sizeMultiplier * 0.7, // Cards are usually not square
          height: player.size * sizeMultiplier,
          velocity: {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed,
          },
          damage: weaponLevel.damage * player.stats.damageMultiplier,
          knockback: weaponLevel.knockback,
          lifespan: 4000,
          color: 'bg-white',
          piercing: true,
          weaponId: 'baralho_do_malandro',
        });
      }

      return projectiles;
    },
  },
};