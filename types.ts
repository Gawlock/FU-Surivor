

export interface Vector2D {
  x: number;
  y: number;
}

export interface GameObject {
  id: string;
  position: Vector2D;
  size: number;
}

export enum GameStatus {
  StartScreen,
  StageSelect,
  Playing,
  Paused,
  LevelUpAttributes,
  LevelUpWeapons,
  GameOver,
}

export enum Attribute {
  Might = "Might",
  Willpower = "Willpower",
  Insight = "Insight",
  Dexterity = "Dexterity",
}

export interface PlayerStats {
  maxHp: number;
  currentHp: number;
  moveSpeed: number;
  defense: number;
  damageMultiplier: number;
  projectileSpeedMultiplier: number;
  xpMultiplier: number;
}

export interface Player extends GameObject {
  stats: PlayerStats;
  level: number;
  xp: number;
  xpToNextLevel: number;
  weapons: PlayerWeapon[];
  velocity: Vector2D;
  lastHitTimestamp: number;
  characterId: string;
  heroicGauge: number;
  heroicGaugeMax: number;
  isHeroicSkillActive: boolean;
  heroicSkillDuration: number;
  invulnerableUntil?: number;
  sessionZenit: number;
}

export type EnemyAnimationDirection = 'left' | 'right';

export interface EnemyData {
  name: string;
  hp: number;
  speed: number;
  damage: number;
  size: number;
  xp: number;
  isElite?: boolean;
  spriteSheet: string;
  frameWidth: number;
  frameHeight: number;
  animationFrames: number[];
  animationSpeed: number; // in ms
}

export interface Enemy extends GameObject {
  typeId: string;
  maxHp: number;
  currentHp: number;
  speed: number;
  damage: number;
  lastHitTimestamp: number;
  animationDirection: EnemyAnimationDirection;
  animationFrame: number;
  lastAnimationUpdate: number;
}

export interface Projectile extends GameObject {
  velocity: Vector2D;
  damage: number;
  lifespan: number;
  color: string;
  weaponId: string;
  piercing?: boolean;
  customUpdate?: 'serpentine' | 'kirin' | 'fibonacci' | 'card_display';
  spawnTime?: number;
  isHeroic?: boolean;
  knockback?: number;
  spawnPosition?: Vector2D;
  currentAngle?: number;
  width?: number;
  height?: number;
  displayText?: string;
}

export interface ExperienceOrb extends GameObject {
  value: number;
}

export interface ZenitOrb extends GameObject {
  value: number;
}

export interface PlayerWeapon {
  id: string;
  level: number;
  cooldown: number;
  passiveCooldown?: number;
}

export interface Turret extends GameObject {
  lifespan: number;
  fireCooldown: number;
  weaponId: string;
  weaponLevel: number;
  isMegaTurret?: boolean;
  lastAngle?: number;
}

export interface WeaponLevel {
  level: number;
  damage: number;
  cooldown: number;
  projectiles: number;
  projectileSpeed: number;
  description: string;
  explosionDamage?: number;
  explosionRadius?: number;
  maxDeployed?: number;
  turretLifespan?: number;
  turretFireCooldown?: number;
  knockback?: number;
  hpRegen?: number;
  regenInterval?: number; // in ms
  auraRadius?: number;
  auraDamagePerSecond?: number;
}

export interface WeaponData {
  id: string;
  name: string;
  icon: string;
  levels: WeaponLevel[];
  fire?: (player: Player, enemies: Enemy[], weaponLevel: WeaponLevel, targetDirection?: Vector2D) => Projectile[];
  deploy?: (player: Player, weaponLevel: WeaponLevel) => Omit<Turret, 'id' | 'position' | 'fireCooldown'>;
}

export interface StageData {
  id: string;
  name: string;
  duration: number; // in seconds
  spawnWaves: SpawnWave[];
}

export interface SpawnWave {
  time: number; // seconds into the game
  enemyTypeId: string;
  count: number;
  interval: number; // ms between each enemy in the wave
}

export interface LevelUpOption<T> {
  type: 'attribute' | 'weapon';
  id: T;
  title: string;
  description: string;
}

export interface CharacterData {
    id: string;
    name: string;
    initialStats: PlayerStats;
    initialWeaponId?: string;
    heroicGaugeMax: number;
    heroicSkillDuration: number; // in ms
    spriteSheet: string;
    frameWidth: number;
    frameHeight: number;
}

export type UpgradeId = 'revive' | 'duplicator' | 'speed' | 'projSpeed' | 'damage';

export interface UpgradeInfo {
    level: number;
    active: boolean;
}

export interface SaveData {
  bestTimes: Record<string, number>; // characterId -> time in seconds
  zenit: number;
  upgrades: Record<UpgradeId, UpgradeInfo>;
}