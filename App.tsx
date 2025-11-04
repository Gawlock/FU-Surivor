
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Player, Enemy, Projectile, ExperienceOrb, LevelUpOption, Attribute as AttrEnum, Vector2D, Turret } from './types';
import { GameStatus, Attribute } from './types';
import { useGameLoop } from './hooks/useGameLoop';
import { PLAYER_SIZE, GAME_TICK_RATE, XP_BASE, XP_GROWTH, FLASH_DURATION, ORB_SIZE } from './constants';
import { CHARACTERS } from './data/characters';
import { ENEMIES } from './data/enemies';
import { WEAPONS } from './data/weapons';
import { STAGES } from './data/stages';
import { isColliding, normalize, distance, getClosestEnemy } from './utils';
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

    const initializeGame = useCallback((characterId: string, weaponId: string) => {
        const characterData = CHARACTERS[characterId];
        const startingWeaponId = weaponId;

        if (!startingWeaponId || !WEAPONS[startingWeaponId]) {
            console.error("Invalid or missing starting weapon ID provided:", startingWeaponId);
            return;
        }

        const initialPlayer: Player = {
            id: 'player',
            position: { x: 0, y: 0 },
            size: PLAYER_SIZE,
            stats: { ...characterData.initialStats },
            level: 1,
            xp: 0,
            xpToNextLevel: XP_BASE,
            weapons: [{
                id: startingWeaponId,
                level: 1,
                cooldown: WEAPONS[startingWeaponId].levels[0].cooldown,
            }],
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
        const newWeaponIds = Object.keys(WEAPONS).filter(wid => !ownedWeapons.some(w => w.id === wid));
        
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
                return {
                    ...p,
                    weapons: [...p.weapons, { id: weaponId, level: 1, cooldown: WEAPONS[weaponId].levels[0].cooldown }]
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
            const newWeapons = p.weapons.map(w => {
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
            return {...p, weapons: newWeapons};
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

        // Projectiles vs Enemies
        for (const proj of projectiles) {
            if (projectilesToRemove.has(proj.id)) continue;
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

        // Player vs Enemies
        if (player.invulnerableUntil && now < player.invulnerableUntil) {
            // Player is invulnerable
        } else {
            let damageToPlayer = 0;
            survivingEnemies.forEach(enemy => { if (isColliding(player, enemy)) { damageToPlayer += Math.max(0, enemy.damage - player.stats.defense); } });
            if (damageToPlayer > 0) {
                setPlayer(p => {
                    if (!p) return null;
                    const newHp = p.stats.currentHp - damageToPlayer;
                    if(newHp <= 0) {
                        setGameStatus(GameStatus.GameOver);
                        return {...p, stats: {...p.stats, currentHp: 0}, lastHitTimestamp: now};
                    }
                    return { ...p, stats: { ...p.stats, currentHp: newHp }, lastHitTimestamp: now };
                });
            }
        }
        
        // Player vs Orbs
        const orbsToRemove = new Set<string>();
        let xpGained = 0;
        orbs.forEach(orb => {
            if (distance(player.position, orb.position) < 150) {
                 const direction = normalize({ x: player.position.x - orb.position.x, y: player.position.y - orb.position.y });
                 orb.position.x += direction.x * 5; orb.position.y += direction.y * 5;
            }
            if (isColliding(player, orb)) { xpGained += orb.value * player.stats.xpMultiplier; orbsToRemove.add(orb.id); }
        });

        if (xpGained > 0) {
            setPlayer(p => {
                if (!p) return null;
                let newXp = p.xp + xpGained;
                let newLevel = p.level;
                let newXpToNext = p.xpToNextLevel;
                while (newXp >= newXpToNext) {
                    newLevel++;
                    newXp -= newXpToNext;
                    newXpToNext = Math.floor(newXpToNext * XP_GROWTH);
                    setGameStatus(GameStatus.LevelUpAttributes);
                    generateLevelUpOptions();
                }
                return { ...p, level: newLevel, xp: newXp, xpToNextLevel: newXpToNext };
            });
        }
        setOrbs(orbs => orbs.filter(orb => !orbsToRemove.has(orb.id)));

    }, [player, enemies, projectiles, orbs, turrets, gameTime, stage.spawnWaves, generateLevelUpOptions]);

    useGameLoop(gameTick, gameStatus !== GameStatus.Playing);

    const renderGameObject = (obj: { id: string, position: {x: number, y: number}, size: number, color?: string, flash?: boolean, shape?: 'circle' | 'square' }) => {
        const screenPos = { x: window.innerWidth / 2 + obj.position.x - camera.x, y: window.innerHeight / 2 + obj.position.y - camera.y };
        const shapeClass = (obj.shape ?? 'circle') === 'circle' ? 'rounded-full' : 'rounded-md';
        const baseClasses = `absolute transition-colors duration-75 ${shapeClass}`;
        const flashClass = obj.flash ? "bg-white" : obj.color;
        return <div key={obj.id} className={`${baseClasses} ${flashClass}`} style={{ left: screenPos.x - obj.size / 2, top: screenPos.y - obj.size / 2, width: obj.size, height: obj.size }} />;
    };

    if (gameStatus === GameStatus.StartScreen) return <StartScreen onStart={initializeGame} />;
    if (gameStatus === GameStatus.GameOver && player) return <GameOverScreen score={gameTime} onRestart={() => setGameStatus(GameStatus.StartScreen)} />;
    if (!player) return <div>Loading...</div>;

    const now = Date.now();
    const playerScreenPos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const heroicGaugePercentage = (player.heroicGauge / player.heroicGaugeMax) * 100;

    const spriteX = animationState.frame * PLAYER_SIZE;
    const spriteY = ANIMATION_ROW_MAP[animationState.direction] * PLAYER_SIZE;

    return (
        <div className="relative w-screen h-screen overflow-hidden bg-gray-800 cursor-none">
             {gameStatus === GameStatus.LevelUpAttributes && <LevelUpModal mode="attribute" attributeOptions={levelUpOptions.attribute} weaponOptions={[]} onAttributeSelect={handleAttributeSelect} onWeaponSelect={() => {}} />}
             {gameStatus === GameStatus.LevelUpWeapons && <LevelUpModal mode="weapon" weaponOptions={levelUpOptions.weapon} attributeOptions={[]} onWeaponSelect={handleWeaponSelect} onAttributeSelect={() => {}}/>}
            
            <GameUI player={player} gameTime={gameTime} />
            
            <div className="game-world">
                {orbs.map(orb => renderGameObject({...orb, color: 'bg-blue-300'}))}
                {turrets.map(t => renderGameObject({...t, color: t.isMegaTurret ? 'bg-cyan-600' : 'bg-gray-500', shape: 'square'}))}
                {enemies.map(e => renderGameObject({...e, color: ENEMIES[e.typeId].color, flash: now - e.lastHitTimestamp < FLASH_DURATION}))}
                {projectiles.map(p => renderGameObject(p))}

                {/* Player and UI Elements attached to Player */}
                <div key={player.id} style={{ left: playerScreenPos.x - player.size / 2, top: playerScreenPos.y - player.size / 2, width: player.size, height: player.size, position: 'absolute' }}>
                     <div 
                        className={`w-full h-full transition-colors duration-75`}
                        style={{
                            backgroundImage: `url('/assets/${player.characterId}_sprite.png')`,
                            backgroundPosition: `-${spriteX}px -${spriteY}px`,
                            imageRendering: 'pixelated',
                            filter: now - player.lastHitTimestamp < FLASH_DURATION ? 'brightness(3)' : 'none'
                        }}
                     />
                    {/* Heroic Gauge Bar */}
                    <div className="absolute -top-4 w-full h-2 bg-gray-600 rounded-full overflow-hidden border border-black">
                         <div className="h-full bg-yellow-400 rounded-full transition-all duration-200" style={{ width: `${heroicGaugePercentage}%`, filter: heroicGaugePercentage >= 100 ? 'drop-shadow(0 0 3px #FFFF00)' : 'none' }}></div>
                    </div>
                </div>
               
                <div 
                  className="absolute border-2 border-white rounded-full pointer-events-none z-50"
                  style={{
                    left: mousePosition.current.x - 8,
                    top: mousePosition.current.y - 8,
                    width: 16,
                    height: 16,
                    opacity: 0.5,
                  }}
                />
            </div>
        </div>
    );
};

export default App;
