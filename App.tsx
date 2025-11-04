

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Player, Enemy, Projectile, ExperienceOrb, LevelUpOption, Attribute as AttrEnum, Vector2D, Turret, SaveData, PlayerWeapon } from './types';
import { GameStatus, Attribute } from './types';
import { useGameLoop } from './hooks/useGameLoop';
import { PLAYER_SIZE, GAME_TICK_RATE, XP_BASE, XP_GROWTH, FLASH_DURATION, ORB_SIZE } from './constants';
import { CHARACTERS } from './data/characters';
import { ENEMIES } from './data/enemies';
import { WEAPONS } from './data/weapons';
import { STAGES } from './data/stages';
import { isColliding, normalize, distance, getClosestEnemy } from './utils';
import { saveGameData, loadGameData } from './gameData';
import GameUI from './components/GameUI';
import LevelUpModal from './components/LevelUpModal';
import StartScreen from './components/StartScreen';
import GameOverScreen from './components/GameOverScreen';

type AimDirection = 'up' | 'down' | 'left' | 'right' | 'none';
type AnimationDirection = 'idle' | 'up' | 'down' | 'left' | 'right';

const ANIMATION_CYCLES: Record<AnimationDirection, number[]> = {
    idle: [0, 1, 2, 3],
    up: [0, 1, 2, 3],
    down: [0, 1, 2, 3],
    left: [0, 1, 2, 3],
    right: [0, 1, 2, 3],
};
const ANIMATION_ROW_MAP: Record<AnimationDirection, number> = {
    idle: 0,
    up: 1,
    down: 2,
    left: 3,
    right: 4,
};
const ANIMATION_SPEED = 150; // ms per frame

const App: React.FC = () => {
    const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.StartScreen);
    const [player, setPlayer] = useState<Player | null>(null);
    const [enemies, setEnemies] = useState<Enemy[]>([]);
    const [projectiles, setProjectiles] = useState<Projectile[]>([]);
    const [turrets, setTurrets] = useState<Turret[]>([]);
    const [orbs, setOrbs] = useState<ExperienceOrb[]>([]);
    const [gameTime, setGameTime] = useState(0);
    const [camera, setCamera] = useState({ x: 0, y: 0 });
    const [levelUpOptions, setLevelUpOptions] = useState<{attribute: LevelUpOption<AttrEnum>[], weapon: LevelUpOption<string>[]}>({attribute: [], weapon: []});
    const [saveData, setSaveData] = useState<SaveData | null>(null);
    const [animationState, setAnimationState] = useState({
        frame: 0,
        direction: 'idle' as AnimationDirection,
        lastUpdate: 0,
    });

    const keysPressed = useRef<Record<string, boolean>>({});
    const mousePosition = useRef({ x: 0, y: 0 });
    const stage = STAGES.forest;
    const stageTimeouts = useRef<number[]>([]);
    const nextWaveIndex = useRef(0);
    
    useEffect(() => {
        setSaveData(loadGameData());
    }, []);

    useEffect(() => {
        if (gameStatus === GameStatus.GameOver && player && saveData) {
            const currentBest = saveData.bestTimes[player.characterId] || 0;
            if (gameTime > currentBest) {
                const newSaveData: SaveData = {
                    ...saveData,
                    bestTimes: {
                        ...saveData.bestTimes,
                        [player.characterId]: gameTime,
                    },
                };
                saveGameData(newSaveData);
                setSaveData(newSaveData);
            }
        }
    }, [gameStatus, player, gameTime, saveData]);

    const initializeGame = useCallback((characterId: string, weaponId: string) => {
        const characterData = CHARACTERS[characterId];
        const startingWeaponId = weaponId;

        if (!startingWeaponId || !WEAPONS[startingWeaponId]) {
            console.error("Invalid or missing starting weapon ID provided:", startingWeaponId);
            return;
        }

        const startingWeapon: PlayerWeapon = {
            id: startingWeaponId,
            level: 1,
            cooldown: WEAPONS[startingWeaponId].levels[0].cooldown,
        };

        if (startingWeaponId === 'baralho_do_malandro') {
            startingWeapon.cooldown = 1; // Set cooldown to near-zero to ensure it fires on the first game tick
        }

        const initialPlayer: Player = {
            id: 'player',
            position: { x: 0, y: 0 },
            size: PLAYER_SIZE,
            stats: { ...characterData.initialStats },
            level: 1,
            xp: 0,
            xpToNextLevel: XP_BASE,
            weapons: [startingWeapon],
            velocity: { x: 0, y: 0 },
            lastHitTimestamp: 0,
            characterId: characterData.id,
            heroicGauge: 0,
            heroicGaugeMax: characterData.heroicGaugeMax,
            isHeroicSkillActive: false,
            heroicSkillDuration: 0,
        };
        setPlayer(initialPlayer);
        setEnemies([]);
        setProjectiles([]);
        setTurrets([]);
        setOrbs([]);
        setGameTime(0);
        setCamera({ x: 0, y: 0 });
        setGameStatus(GameStatus.Playing);
        
        stageTimeouts.current.forEach(clearTimeout);
        stageTimeouts.current = [];
        nextWaveIndex.current = 0;
    }, []);

    const activateHeroicSkill = useCallback(() => {
        if (!player || player.heroicGauge < player.heroicGaugeMax || player.isHeroicSkillActive) return;
        
        const character = CHARACTERS[player.characterId];
        const now = Date.now();

        switch (player.characterId) {
            case 'raime': {
                 const worldMouseX = mousePosition.current.x - window.innerWidth / 2 + player.position.x;
                 const worldMouseY = mousePosition.current.y - window.innerHeight / 2 + player.position.y;
                 const targetDirection = normalize({
                     x: worldMouseX - player.position.x,
                     y: worldMouseY - player.position.y,
                 });
                const heroicProjectile: Projectile = {
                    id: `proj_heroic_${now}`,
                    position: { ...player.position },
                    size: player.size * 7,
                    velocity: { x: targetDirection.x * 6, y: targetDirection.y * 6 },
                    damage: 250 * player.stats.damageMultiplier,
                    lifespan: 5000,
                    color: 'bg-orange-500',
                    weaponId: 'heroic_skill',
                    piercing: true,
                    isHeroic: true,
                    knockback: 15,
                };
                setProjectiles(projs => [...projs, heroicProjectile]);
                break;
            }
            case 'kazu':
                setPlayer(p => p ? { ...p, isHeroicSkillActive: true, heroicSkillDuration: character.heroicSkillDuration } : null);
                break;
            case 'andwyn':
                setEnemies(es => es.filter(e => e.typeId.includes('boss'))); // Assuming bosses have 'boss' in their ID
                break;
            case 'gaeru':
                 setPlayer(p => p ? { ...p, isHeroicSkillActive: true, heroicSkillDuration: character.heroicSkillDuration } : null);
                break;
            case 'thorne': {
                const megaTurret: Turret = {
                    id: `turret_heroic_${now}`,
                    position: { ...player.position },
                    size: 45,
                    lifespan: character.heroicSkillDuration,
                    fireCooldown: 0,
                    weaponId: 'deployable_turret', // Fires similar projectiles
                    weaponLevel: 5, // Use max level stats
                    isMegaTurret: true,
                    lastAngle: 0,
                };
                setTurrets(ts => [...ts, megaTurret]);
                break;
            }
            case 'ito':
                 setPlayer(p => p ? { 
                     ...p, 
                     isHeroicSkillActive: true, 
                     heroicSkillDuration: character.heroicSkillDuration,
                     invulnerableUntil: now + character.heroicSkillDuration,
                } : null);
                break;
        }

        setPlayer(p => p ? { ...p, heroicGauge: 0 } : null);

    }, [player]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { 
            keysPressed.current[e.key.toLowerCase()] = true; 
            if (e.key.toLowerCase() === 'x') {
                activateHeroicSkill();
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.key.toLowerCase()] = false; };
        const handleMouseMove = (e: MouseEvent) => { mousePosition.current = { x: e.clientX, y: e.clientY }; };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, [activateHeroicSkill]);

    const generateLevelUpOptions = useCallback(() => {
        if(!player) return;
        // Attribute Options
        const attributeOptions: LevelUpOption<AttrEnum>[] = [
            { type: 'attribute', id: Attribute.Might, title: 'Might', description: '+10% Damage' },
            { type: 'attribute', id: Attribute.Willpower, title: 'Willpower', description: '+5 Defense' },
            { type: 'attribute', id: Attribute.Insight, title: 'Insight', description: '+20% Max HP' },
            { type: 'attribute', id: Attribute.Dexterity, title: 'Dexterity', description: '+5% Move & Proj. Speed' },
        ];

        // Weapon Options
        const ownedWeapons = player.weapons;
        const upgradeableWeapons = ownedWeapons.filter(w => w.level < WEAPONS[w.id].levels.length);
        const newWeaponIds = Object.keys(WEAPONS).filter(wid => !ownedWeapons.some(w => w.id === wid) && WEAPONS[wid].name !== 'Fist of Fury' && WEAPONS[wid].name !== 'Book of the Celestial' && WEAPONS[wid].name !== 'Dragon Katana' && WEAPONS[wid].name !== 'Kirin Companion' && WEAPONS[wid].name !== 'Deployable Turret' && WEAPONS[wid].name !== 'Luvas do Chef');
        
        const options: LevelUpOption<string>[] = [];
        // Add upgrades
        options.push(...upgradeableWeapons.map(w => ({
            type: 'weapon' as 'weapon',
            id: w.id,
            title: `Upgrade ${WEAPONS[w.id].name}`,
            description: WEAPONS[w.id].levels[w.level].description,
        })));
        // Add new weapons
        if (newWeaponIds.length > 0) {
            options.push(...newWeaponIds.map(wid => ({
                type: 'weapon' as 'weapon',
                id: wid,
                title: `New: ${WEAPONS[wid].name}`,
                description: WEAPONS[wid].levels[0].description,
            })));
        }
        
        // Shuffle and pick 4
        const weaponOptions = options.sort(() => 0.5 - Math.random()).slice(0, 4);

        setLevelUpOptions({ attribute: attributeOptions, weapon: weaponOptions });
    }, [player]);

    const handleAttributeSelect = (attribute: AttrEnum) => {
        if(!player) return;
        setPlayer(p => {
            if(!p) return null;
            const newStats = { ...p.stats };
            switch(attribute) {
                case Attribute.Might: newStats.damageMultiplier *= 1.1; break;
                case Attribute.Willpower: newStats.defense += 5; break;
                case Attribute.Insight: newStats.maxHp *= 1.2; newStats.currentHp = newStats.maxHp; break;
                case Attribute.Dexterity: newStats.moveSpeed *= 1.05; newStats.projectileSpeedMultiplier *= 1.05; break;
            }
            return { ...p, stats: newStats };
        });
        setGameStatus(GameStatus.LevelUpWeapons);
    };

    const handleWeaponSelect = (weaponId: string) => {
        if(!player) return;
        setPlayer(p => {
            if(!p) return null;
            const existingWeapon = p.weapons.find(w => w.id === weaponId);
            if (existingWeapon) {
                const nextLevel = existingWeapon.level + 1;
                return {
                    ...p,
                    weapons: p.weapons.map(w => w.id === weaponId ? { ...w, level: nextLevel } : w)
                };
            } else {
                const weaponData = WEAPONS[weaponId];
                const weaponLevelData = weaponData.levels[0];
                const newPlayerWeapon: PlayerWeapon = {
                    id: weaponId,
                    level: 1,
                    cooldown: weaponLevelData.cooldown,
                };
                if (weaponLevelData.regenInterval) {
                    newPlayerWeapon.passiveCooldown = weaponLevelData.regenInterval;
                }
                if (weaponId === 'baralho_do_malandro') {
                    newPlayerWeapon.cooldown = 0;
                }
                return {
                    ...p,
                    weapons: [...p.weapons, newPlayerWeapon]
                };
            }
        });
        setGameStatus(GameStatus.Playing);
    };


    const gameTick = useCallback(() => {
        if (!player) return;
        const now = Date.now();
        const newGameTime = gameTime + GAME_TICK_RATE / 1000;
        setGameTime(newGameTime);

        // 1. Player Update (Movement, Animation, Heroic Skill)
        setPlayer(p => {
            if (!p) return null;
            let dx = 0;
            let dy = 0;
            if (keysPressed.current['w'] || keysPressed.current['arrowup']) dy -= 1;
            if (keysPressed.current['s'] || keysPressed.current['arrowdown']) dy += 1;
            if (keysPressed.current['a'] || keysPressed.current['arrowleft']) dx -= 1;
            if (keysPressed.current['d'] || keysPressed.current['arrowright']) dx += 1;

            const normalized = normalize({ x: dx, y: dy });
            const newPos = {
                x: p.position.x + normalized.x * p.stats.moveSpeed,
                y: p.position.y + normalized.y * p.stats.moveSpeed,
            };

            // Animation
            setAnimationState(prevState => {
                let newDirection: AnimationDirection = 'idle';
                if (dx === 0 && dy === 0) {
                    newDirection = 'idle';
                } else if (Math.abs(dx) > Math.abs(dy)) {
                    newDirection = dx > 0 ? 'right' : 'left';
                } else {
                    newDirection = dy > 0 ? 'down' : 'up';
                }

                let newFrame = prevState.frame;
                if (now - prevState.lastUpdate > ANIMATION_SPEED) {
                    const cycle = ANIMATION_CYCLES[newDirection];
                    const currentIndex = cycle.indexOf(prevState.frame);
                    newFrame = cycle[(currentIndex + 1) % cycle.length];
                    return { direction: newDirection, frame: newFrame, lastUpdate: now };
                }

                return { ...prevState, direction: newDirection };
            });

            // Heroic skill management
            let newHeroicGauge = p.heroicGauge + (GAME_TICK_RATE / 1000) * 1; // 1 gauge per second
            let newHeroicSkillDuration = p.heroicSkillDuration;
            let newIsHeroicSkillActive = p.isHeroicSkillActive;

            if (newIsHeroicSkillActive) {
                newHeroicSkillDuration -= GAME_TICK_RATE;
                if (newHeroicSkillDuration <= 0) {
                    newIsHeroicSkillActive = false;
                    newHeroicSkillDuration = 0;
                }
            }
            
            return { 
                ...p, 
                position: newPos, 
                velocity: {x: normalized.x, y: normalized.y},
                heroicGauge: Math.min(newHeroicGauge, p.heroicGaugeMax),
                isHeroicSkillActive: newIsHeroicSkillActive,
                heroicSkillDuration: newHeroicSkillDuration,
            };
        });
        
        setCamera({ x: player.position.x, y: player.position.y });
        
        // 2. Weapon Firing & Deploying
        const worldMouseX = mousePosition.current.x - window.innerWidth / 2 + player.position.x;
        const worldMouseY = mousePosition.current.y - window.innerHeight / 2 + player.position.y;
        const targetDirection = normalize({
            x: worldMouseX - player.position.x,
            y: worldMouseY - player.position.y,
        });

        setPlayer(p => {
            if(!p) return null;

            let hpFromRegen = 0;

            const weaponsAfterPassives = p.weapons.map(w => {
                const weaponData = WEAPONS[w.id];
                const weaponLevelData = weaponData.levels[w.level - 1];
        
                if (weaponLevelData.hpRegen && weaponLevelData.regenInterval) {
                    let newPassiveCooldown = (w.passiveCooldown ?? weaponLevelData.regenInterval) - GAME_TICK_RATE;
                    if (newPassiveCooldown <= 0) {
                        hpFromRegen += weaponLevelData.hpRegen;
                        newPassiveCooldown = weaponLevelData.regenInterval;
                    }
                    return { ...w, passiveCooldown: newPassiveCooldown };
                }
                return w;
            });

            const newWeapons = weaponsAfterPassives.map(w => {
                const newCooldown = w.cooldown - GAME_TICK_RATE;
                if (newCooldown <= 0) {
                    const weaponData = WEAPONS[w.id];
                    const weaponLevel = weaponData.levels[w.level - 1];
                    let finalCooldown = weaponLevel.cooldown;

                    // Heroic skill modifications
                    if (p.isHeroicSkillActive) {
                        if (p.characterId === 'kazu' && w.id === 'dragon_katana') finalCooldown = 50;
                        if (p.characterId === 'ito' && w.id === 'chefs_gloves') finalCooldown = 0;
                    }

                    if (weaponData.deploy) {
                        setTurrets(currentTurrets => {
                           const maxDeployed = weaponLevel.maxDeployed || 1;
                           if (currentTurrets.filter(t => t.weaponId === w.id && !t.isMegaTurret).length < maxDeployed) {
                               const turretData = weaponData.deploy!(p, weaponLevel);
                               const newTurret: Turret = {
                                   ...turretData,
                                   id: `turret_${Date.now()}_${Math.random()}`,
                                   position: { ...p.position },
                                   fireCooldown: 0,
                               };
                               return [...currentTurrets, newTurret];
                           }
                           return currentTurrets;
                       });
                    }

                    if (weaponData.fire) {
                        const firedProjectiles = weaponData.fire(p, enemies, weaponLevel, targetDirection);
                        setProjectiles(projs => {
                           let nextProjs = projs;
                           if (w.id === 'kirin_companion') {
                               nextProjs = projs.filter(pr => pr.weaponId !== 'kirin_companion');
                           }
                           return [...nextProjs, ...firedProjectiles];
                       });
                    }
                    return { ...w, cooldown: finalCooldown };
                }
                return { ...w, cooldown: newCooldown };
            });

            const newStats = hpFromRegen > 0
                ? { ...p.stats, currentHp: Math.min(p.stats.maxHp, p.stats.currentHp + hpFromRegen) }
                : p.stats;
            
            return {...p, stats: newStats, weapons: newWeapons};
        });

        // 2.5. Turret Logic (Update and Fire)
        setTurrets(prevTurrets => {
            const newTurretProjectiles: Projectile[] = [];
            const updatedTurrets = prevTurrets.map(turret => {
                let newFireCooldown = turret.fireCooldown - GAME_TICK_RATE;
                const newLifespan = turret.lifespan - GAME_TICK_RATE;

                if (newFireCooldown <= 0) {
                     const turretWeapon = WEAPONS[turret.weaponId];
                     const weaponLevel = turretWeapon.levels[turret.weaponLevel - 1];
                     
                     if (turret.isMegaTurret) {
                        const angleStep = Math.PI / 8;
                        const spiralSpeed = 0.4;
                        const newAngle = (turret.lastAngle || 0) + spiralSpeed;
                         for(let i=0; i<16; i++){
                             const angle = newAngle + (i * angleStep);
                             const direction = {x: Math.cos(angle), y: Math.sin(angle)};
                             newTurretProjectiles.push({
                                id: `proj_mega_${now}_${Math.random()}_${i}`,
                                position: { ...turret.position },
                                size: 18,
                                velocity: {
                                    x: direction.x * weaponLevel.projectileSpeed,
                                    y: direction.y * weaponLevel.projectileSpeed,
                                },
                                damage: weaponLevel.damage * (player?.stats.damageMultiplier || 1),
                                knockback: weaponLevel.knockback,
                                lifespan: 1500,
                                color: 'bg-cyan-400',
                                weaponId: turret.weaponId,
                                piercing: true,
                            });
                         }
                         newFireCooldown = 150;
                         turret.lastAngle = newAngle;

                     } else {
                        const closestEnemy = getClosestEnemy(turret.position, enemies.filter(e => distance(turret.position, e.position) < 400));
                        if (closestEnemy) {
                            const direction = normalize({ x: closestEnemy.position.x - turret.position.x, y: closestEnemy.position.y - turret.position.y });
                            newTurretProjectiles.push({
                                id: `proj_turret_${Date.now()}_${Math.random()}`,
                                position: { ...turret.position },
                                size: 14,
                                velocity: {
                                    x: direction.x * weaponLevel.projectileSpeed * (player?.stats.projectileSpeedMultiplier || 1),
                                    y: direction.y * weaponLevel.projectileSpeed * (player?.stats.projectileSpeedMultiplier || 1),
                                },
                                damage: weaponLevel.damage * (player?.stats.damageMultiplier || 1),
                                knockback: weaponLevel.knockback,
                                lifespan: 2000,
                                color: 'bg-pink-500',
                                weaponId: turret.weaponId,
                            });
                        }
                        newFireCooldown = weaponLevel.turretFireCooldown || 1000;
                     }
                }
                return { ...turret, lifespan: newLifespan, fireCooldown: newFireCooldown };
            });

            if (newTurretProjectiles.length > 0) {
                setProjectiles(projs => [...projs, ...newTurretProjectiles]);
            }

            return updatedTurrets.filter(t => t.lifespan > 0);
        });

        // 3. Projectile Movement & Update
        setProjectiles(projs => {
            const updatedProjectiles = projs.map(p => {
                // Custom update logic
                if (p.weaponId === "spinning_axe") {
                    const newAngle = p.velocity.x + (p.velocity.y / 50);
                    return { ...p, position: { x: player.position.x + 100 * Math.cos(newAngle), y: player.position.y + 100 * Math.sin(newAngle) }, velocity: { ...p.velocity, x: newAngle } };
                }
                if (p.customUpdate === 'serpentine' && p.spawnTime) {
                    const elapsedTime = now - p.spawnTime;
                    const amplitude = 15; const frequency = 0.01;
                    const perpendicular = normalize({ x: -p.velocity.y, y: p.velocity.x });
                    const newOffset = amplitude * Math.sin(elapsedTime * frequency);
                    const oldOffset = amplitude * Math.sin((elapsedTime - GAME_TICK_RATE) * frequency);
                    const deltaOffset = newOffset - oldOffset;
                    return { ...p, position: { x: p.position.x + p.velocity.x + (perpendicular.x * deltaOffset), y: p.position.y + p.velocity.y + (perpendicular.y * deltaOffset) } };
                }
                if (p.customUpdate === 'kirin') {
                    const target = getClosestEnemy(p.position, enemies.filter(e => distance(p.position, e.position) < 400));
                    let targetPosition: Vector2D;
                    if (target) {
                        targetPosition = target.position;
                    } else {
                        const angle = (now / 1000);
                        targetPosition = { x: player.position.x + 60 * Math.cos(angle), y: player.position.y + 60 * Math.sin(angle) };
                    }
                    let speed = p.velocity.y;
                    if(player.isHeroicSkillActive && player.characterId === 'gaeru') speed *= 7.5;
                    const direction = normalize({ x: targetPosition.x - p.position.x, y: targetPosition.y - p.position.y });
                    let newPosition = (distance(p.position, targetPosition) < speed) ? targetPosition : { x: p.position.x + direction.x * speed, y: p.position.y + direction.y * speed };
                    return { ...p, position: newPosition };
                }
                 if (p.customUpdate === 'fibonacci' && p.spawnPosition && p.currentAngle !== undefined && p.spawnTime) {
                    // velocity.x = rotation speed in rad/sec
                    // velocity.y = growth speed in px/sec
                    const rotationPerTick = p.velocity.x * (GAME_TICK_RATE / 1000); 
                    const growthPerTick = p.velocity.y * (GAME_TICK_RATE / 1000);

                    const newAngle = p.currentAngle + rotationPerTick;
                    
                    // elapsed time in ticks
                    const elapsedTicks = (now - p.spawnTime) / GAME_TICK_RATE;
                    const radius = elapsedTicks * growthPerTick;

                    return {
                        ...p,
                        position: {
                            x: p.spawnPosition.x + radius * Math.cos(newAngle),
                            y: p.spawnPosition.y + radius * Math.sin(newAngle),
                        },
                        currentAngle: newAngle,
                    };
                }
                if (p.customUpdate === 'card_display') {
                    return { ...p, position: { ...player.position } };
                }
                // Default movement
                return { ...p, position: { x: p.position.x + p.velocity.x, y: p.position.y + p.velocity.y } };
            });

            return updatedProjectiles.map(p => ({...p, lifespan: p.lifespan - GAME_TICK_RATE})).filter(p => p.lifespan > 0);
        });


        // 4. Enemy Spawning
        while (nextWaveIndex.current < stage.spawnWaves.length && newGameTime >= stage.spawnWaves[nextWaveIndex.current].time) {
            const wave = stage.spawnWaves[nextWaveIndex.current];
            for (let i = 0; i < wave.count; i++) {
                const timeout = window.setTimeout(() => {
                    setPlayer(currentPlayer => {
                        if (!currentPlayer) return null;
                        const angle = Math.random() * 2 * Math.PI;
                        const spawnRadius = Math.max(window.innerWidth, window.innerHeight) / 2 + 50;
                        const pos = { x: currentPlayer.position.x + Math.cos(angle) * spawnRadius, y: currentPlayer.position.y + Math.sin(angle) * spawnRadius };
                        const enemyData = ENEMIES[wave.enemyTypeId];
                        setEnemies(es => [...es, { id: `enemy_${Date.now()}_${Math.random()}`, typeId: wave.enemyTypeId, position: pos, size: enemyData.size, maxHp: enemyData.hp, currentHp: enemyData.hp, speed: enemyData.speed, damage: enemyData.damage, lastHitTimestamp: 0 }]);
                        return currentPlayer;
                    });
                }, i * wave.interval);
                stageTimeouts.current.push(timeout);
            }
            nextWaveIndex.current++;
        }

        // 5. Collision Detection & State Updates
        const damageMap: Map<string, { damage: number; sources: Set<string>; knockback: Vector2D }> = new Map();
        const projectilesToRemove = new Set<string>();

        // Aura Damage
        const auraWeapon = player.weapons.find(w => WEAPONS[w.id].levels[w.level - 1].auraRadius);
        if (auraWeapon) {
            const weaponData = WEAPONS[auraWeapon.id];
            const weaponLevelData = weaponData.levels[auraWeapon.level - 1];
            const auraRadius = weaponLevelData.auraRadius!;
            const auraDamagePerTick = (weaponLevelData.auraDamagePerSecond! * (GAME_TICK_RATE / 1000));
            
            for (const enemy of enemies) {
                if (distance(player.position, enemy.position) < auraRadius) {
                    if (!damageMap.has(enemy.id)) {
                        damageMap.set(enemy.id, { damage: 0, sources: new Set(), knockback: { x: 0, y: 0 } });
                    }
                    const enemyDamage = damageMap.get(enemy.id)!;
                    enemyDamage.damage += auraDamagePerTick;
                    enemyDamage.sources.add(auraWeapon.id);
                    
                    const knockbackStrength = 0.5;
                    const knockbackDir = normalize({ x: enemy.position.x - player.position.x, y: enemy.position.y - player.position.y });
                    enemyDamage.knockback.x += knockbackDir.x * knockbackStrength;
                    enemyDamage.knockback.y += knockbackDir.y * knockbackStrength;
                }
            }
        }

        // Projectiles vs Enemies
        for (const proj of projectiles) {
            if (projectilesToRemove.has(proj.id) || proj.damage === 0) continue;
            for (const enemy of enemies) {
                if (isColliding(proj, enemy)) {
                    if (!damageMap.has(enemy.id)) damageMap.set(enemy.id, { damage: 0, sources: new Set(), knockback: { x: 0, y: 0 } });
                    const enemyDamage = damageMap.get(enemy.id)!;
                    enemyDamage.damage += proj.damage;
                    enemyDamage.sources.add(proj.weaponId);

                    if (proj.knockback) {
                        const knockbackDir = normalize({ x: enemy.position.x - proj.position.x, y: enemy.position.y - proj.position.y });
                        enemyDamage.knockback.x += knockbackDir.x * proj.knockback;
                        enemyDamage.knockback.y += knockbackDir.y * proj.knockback;
                    }

                    if (!proj.piercing) {
                        projectilesToRemove.add(proj.id);
                        break;
                    }
                }
            }
        }
        setProjectiles(projs => projs.filter(p => !projectilesToRemove.has(p.id)));
        
        const bookWeapon = player.weapons.find(w => w.id === 'book_of_the_celestial');
        const explosions = enemies.filter(e => { const d = damageMap.get(e.id); return d && e.currentHp - d.damage <= 0 && d.sources.has('book_of_the_celestial'); }).map(e => { const wl = bookWeapon ? WEAPONS.book_of_the_celestial.levels[bookWeapon.level - 1] : WEAPONS.book_of_the_celestial.levels[0]; return { position: e.position, damage: (wl.explosionDamage || 0) * player.stats.damageMultiplier, radius: wl.explosionRadius || 0 }; });

        let newOrbsFromTick: ExperienceOrb[] = [];
        let survivingEnemies: Enemy[] = [];

        // Main enemy update loop
        for (const e of enemies) {
            const directDamage = damageMap.get(e.id)?.damage || 0;
            let explosionDamage = 0;
            if (explosions.length > 0) { for (const explosion of explosions) { if (distance(e.position, explosion.position) < explosion.radius) { explosionDamage += explosion.damage; } } }
            
            const totalDamage = directDamage + explosionDamage;
            
            if (e.currentHp - totalDamage <= 0) {
                newOrbsFromTick.push({ id: `orb_${now}_${Math.random()}`, position: e.position, size: ORB_SIZE, value: ENEMIES[e.typeId].xp });
            } else {
                const direction = normalize({ x: player.position.x - e.position.x, y: player.position.y - e.position.y });
                const knockback = damageMap.get(e.id)?.knockback || { x: 0, y: 0 };
                survivingEnemies.push({ ...e, position: { x: e.position.x + direction.x * e.speed + knockback.x, y: e.position.y + direction.y * e.speed + knockback.y }, currentHp: e.currentHp - totalDamage, lastHitTimestamp: totalDamage > 0 ? now : e.lastHitTimestamp });
            }
        }
        setEnemies(survivingEnemies);
        
        if(newOrbsFromTick.length > 0) {
            setOrbs(o => [...o, ...newOrbsFromTick]);
            setPlayer(p => p ? { ...p, heroicGauge: Math.min(p.heroicGauge + newOrbsFromTick.length * 8, p.heroicGaugeMax) } : null);
        }

        // Player vs Enemies collision
        setPlayer(p => {
            if (!p || (p.invulnerableUntil && now < p.invulnerableUntil)) return p;
            let totalDamage = 0;
            for (const e of survivingEnemies) { // Use already updated surviving enemies
                if (isColliding(p, e)) {
                    totalDamage += e.damage;
                }
            }
            if (totalDamage > 0 && now > p.lastHitTimestamp + 500) { // 500ms invulnerability
                const damageTaken = Math.max(1, totalDamage - p.stats.defense);
                const newHp = p.stats.currentHp - damageTaken;
                if (newHp <= 0) {
                    setGameStatus(GameStatus.GameOver);
                    return { ...p, stats: { ...p.stats, currentHp: 0 } };
                }
                return { ...p, stats: { ...p.stats, currentHp: newHp }, lastHitTimestamp: now };
            }
            return p;
        });

        // 6. Orb Collection
        const orbsToCollect: string[] = [];
        let xpGained = 0;
        setOrbs(prevOrbs => prevOrbs.map(orb => {
            const direction = normalize({ x: player.position.x - orb.position.x, y: player.position.y - orb.position.y });
            const speed = 10;
            const newPos = {
                x: orb.position.x + direction.x * speed,
                y: orb.position.y + direction.y * speed
            };
            if (distance(newPos, player.position) < player.size / 2) {
                orbsToCollect.push(orb.id);
                xpGained += orb.value;
            }
            return { ...orb, position: newPos };
        }).filter(orb => !orbsToCollect.includes(orb.id)));

        // 7. XP and Level Up
        if (xpGained > 0) {
            setPlayer(p => {
                if (!p) return null;
                const newXp = p.xp + (xpGained * p.stats.xpMultiplier);
                if (newXp >= p.xpToNextLevel) {
                    const newLevel = p.level + 1;
                    const newXpToNext = Math.floor(p.xpToNextLevel * XP_GROWTH);
                    generateLevelUpOptions();
                    setGameStatus(GameStatus.LevelUpAttributes);
                    return { ...p, level: newLevel, xp: newXp - p.xpToNextLevel, xpToNextLevel: newXpToNext };
                }
                return { ...p, xp: newXp };
            });
        }
    }, [player, gameTime, enemies, projectiles, turrets, orbs, generateLevelUpOptions]);


    useGameLoop(gameTick, gameStatus !== GameStatus.Playing);
    
    const worldWidth = 3000;
    const worldHeight = 3000;
    
    // RENDER LOGIC
    if (!player && gameStatus !== GameStatus.StartScreen) return <div>Loading...</div>;

    const renderProjectile = (proj: Projectile) => {
        const key = proj.id;
        let baseClasses = 'absolute rounded-full';
        const style: React.CSSProperties = {
            width: `${proj.width || proj.size}px`,
            height: `${proj.height || proj.size}px`,
            left: proj.position.x,
            top: proj.position.y,
            transform: `translate(-50%, -50%)`,
        };
        
        if (proj.customUpdate === 'card_display' && player) {
            return (
                <div key={key} className="absolute text-yellow-300 font-bold text-4xl" style={{...style, left: player.position.x, top: player.position.y - player.size - 20}}>
                   {proj.displayText}
                </div>
            );
        }
        
        if (proj.weaponId === 'baralho_do_malandro') {
           baseClasses = 'absolute border-2 border-black';
        }

        return <div key={key} className={`${baseClasses} ${proj.color}`} style={style}></div>
    }

    return (
        <div className="w-screen h-screen bg-green-800 relative overflow-hidden">
            {gameStatus === GameStatus.StartScreen && <StartScreen onStart={initializeGame} saveData={saveData} />}
            {gameStatus === GameStatus.GameOver && player && <GameOverScreen score={gameTime} onRestart={() => setGameStatus(GameStatus.StartScreen)} />}
            {gameStatus === GameStatus.LevelUpAttributes && <LevelUpModal mode="attribute" attributeOptions={levelUpOptions.attribute} weaponOptions={levelUpOptions.weapon} onAttributeSelect={handleAttributeSelect} onWeaponSelect={handleWeaponSelect} />}
            {gameStatus === GameStatus.LevelUpWeapons && <LevelUpModal mode="weapon" attributeOptions={levelUpOptions.attribute} weaponOptions={levelUpOptions.weapon} onAttributeSelect={handleAttributeSelect} onWeaponSelect={handleWeaponSelect} />}
            
            {player && (
            <>
                <GameUI player={player} gameTime={gameTime} />
                <div 
                    id="game-world"
                    className="absolute"
                    style={{
                        width: `${worldWidth}px`,
                        height: `${worldHeight}px`,
                        transform: `translate(${-camera.x + window.innerWidth/2}px, ${-camera.y + window.innerHeight/2}px)`,
                    }}
                >
                    {/* Player */}
                    <div
                        className="absolute bg-blue-500 rounded-full"
                        style={{
                            left: player.position.x,
                            top: player.position.y,
                            width: `${player.size}px`,
                            height: `${player.size}px`,
                            transform: 'translate(-50%, -50%)',
                            boxShadow: `0 0 15px ${player.lastHitTimestamp + FLASH_DURATION > Date.now() ? 'rgba(255,255,255,0.8)' : 'transparent'}`,
                            transition: `box-shadow ${FLASH_DURATION/2}ms`,
                        }}
                    />
                    
                     {/* Aura */}
                     {player.weapons.map(w => {
                        const weaponData = WEAPONS[w.id];
                        const weaponLevelData = weaponData.levels[w.level - 1];
                        if (weaponLevelData.auraRadius) {
                            return (
                                <div key={w.id} className="absolute bg-yellow-300 bg-opacity-20 rounded-full border-2 border-yellow-400"
                                    style={{
                                        width: `${weaponLevelData.auraRadius * 2}px`,
                                        height: `${weaponLevelData.auraRadius * 2}px`,
                                        left: player.position.x,
                                        top: player.position.y,
                                        transform: 'translate(-50%, -50%)',
                                    }}
                                ></div>
                            );
                        }
                        return null;
                    })}

                    {/* Enemies */}
                    {enemies.map(enemy => (
                        <div
                            key={enemy.id}
                            className={`absolute rounded-full ${ENEMIES[enemy.typeId].color}`}
                            style={{
                                left: enemy.position.x,
                                top: enemy.position.y,
                                width: `${enemy.size}px`,
                                height: `${enemy.size}px`,
                                transform: 'translate(-50%, -50%)',
                                boxShadow: `0 0 10px ${enemy.lastHitTimestamp + FLASH_DURATION > Date.now() ? 'rgba(255,0,0,0.8)' : 'transparent'}`,
                                transition: `box-shadow ${FLASH_DURATION/2}ms`,
                            }}
                        />
                    ))}

                    {/* Turrets */}
                    {turrets.map(turret => (
                         <div
                            key={turret.id}
                            className={`absolute rounded-md ${turret.isMegaTurret ? 'bg-cyan-600' : 'bg-pink-700'} border-2 border-gray-900`}
                            style={{
                                left: turret.position.x,
                                top: turret.position.y,
                                width: `${turret.size}px`,
                                height: `${turret.size}px`,
                                transform: 'translate(-50%, -50%)',
                            }}
                        />
                    ))}

                    {/* Projectiles */}
                    {projectiles.map(renderProjectile)}
                    
                    {/* Orbs */}
                    {orbs.map(orb => (
                        <div
                            key={orb.id}
                            className="absolute bg-blue-300 rounded-full"
                            style={{
                                left: orb.position.x,
                                top: orb.position.y,
                                width: `${orb.size}px`,
                                height: `${orb.size}px`,
                                transform: 'translate(-50%, -50%)',
                                boxShadow: '0 0 8px rgba(173, 216, 230, 0.8)',
                            }}
                        />
                    ))}
                </div>
            </>
            )}
        </div>
    );
};

export default App;
