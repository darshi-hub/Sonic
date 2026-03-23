'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, RotateCcw, Trophy, ArrowUp, ArrowDown } from 'lucide-react';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 400;
const GROUND_Y = 320;
const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const BASE_SPEED = 6;

type GameState = 'start' | 'playing' | 'gameover';

interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  vy: number;
  state: 'run' | 'jump' | 'roll';
  rings: number;
  invincibleTimer: number;
}

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'spike' | 'enemy';
  active: boolean;
}

interface Ring {
  x: number;
  y: number;
  radius: number;
  active: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

export default function SonicRunner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>('start');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [rings, setRings] = useState(0);

  // Game state refs to avoid dependency issues in the animation loop
  const stateRef = useRef({
    player: {
      x: 100,
      y: GROUND_Y,
      width: 32,
      height: 48,
      vy: 0,
      state: 'run' as 'run' | 'jump' | 'roll',
      rings: 0,
      invincibleTimer: 0,
    },
    obstacles: [] as Obstacle[],
    ringsList: [] as Ring[],
    particles: [] as Particle[],
    speed: BASE_SPEED,
    distance: 0,
    frames: 0,
    bgOffset1: 0,
    bgOffset2: 0,
    bgOffset3: 0,
    isGameOver: false,
  });

  const keys = useRef<{ [key: string]: boolean }>({});

  const startGame = useCallback(() => {
    stateRef.current = {
      player: {
        x: 100,
        y: GROUND_Y,
        width: 32,
        height: 48,
        vy: 0,
        state: 'run',
        rings: 0,
        invincibleTimer: 0,
      },
      obstacles: [],
      ringsList: [],
      particles: [],
      speed: BASE_SPEED,
      distance: 0,
      frames: 0,
      bgOffset1: 0,
      bgOffset2: 0,
      bgOffset3: 0,
      isGameOver: false,
    };
    setGameState('playing');
    setScore(0);
    setRings(0);
  }, []);

  const spawnParticles = useCallback((x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      stateRef.current.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1,
        maxLife: 20 + Math.random() * 20,
        color,
      });
    }
  }, []);

  const loseRings = useCallback(() => {
    const p = stateRef.current.player;
    if (p.rings > 0) {
      // Scatter rings
      const scatterCount = Math.min(p.rings, 20); // Cap visual scattered rings
      for (let i = 0; i < scatterCount; i++) {
        stateRef.current.ringsList.push({
          x: p.x,
          y: p.y - 20,
          radius: 8,
          active: true,
        });
        spawnParticles(p.x, p.y, '#FFD700', 2);
      }
      p.rings = 0;
      setRings(0);
      p.invincibleTimer = 60; // 1 second of invincibility (assuming 60fps)
    } else {
      stateRef.current.isGameOver = true;
    }
  }, [spawnParticles]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true;
      if (e.code === 'Space' && gameState === 'start') {
        startGame();
      } else if (e.code === 'Space' && gameState === 'gameover') {
        startGame();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, startGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const update = () => {
      if (gameState !== 'playing') return;

      const state = stateRef.current;
      const { player } = state;

      state.frames++;
      state.distance += state.speed / 10;
      state.speed = BASE_SPEED + Math.floor(state.distance / 500); // Slowly increase speed

      // Background parallax
      state.bgOffset1 = (state.bgOffset1 + state.speed * 0.2) % CANVAS_WIDTH;
      state.bgOffset2 = (state.bgOffset2 + state.speed * 0.5) % CANVAS_WIDTH;
      state.bgOffset3 = (state.bgOffset3 + state.speed) % CANVAS_WIDTH;

      // Player Controls & Physics
      if ((keys.current['Space'] || keys.current['ArrowUp']) && player.y === GROUND_Y) {
        player.vy = JUMP_FORCE;
        player.state = 'jump';
      } else if (keys.current['ArrowDown'] && player.y === GROUND_Y) {
        player.state = 'roll';
        player.height = 24;
        player.y = GROUND_Y + 24; // Adjust y to stay on ground
      } else if (!keys.current['ArrowDown'] && player.state === 'roll' && player.y >= GROUND_Y) {
        player.state = 'run';
        player.height = 48;
        player.y = GROUND_Y;
      }

      player.vy += GRAVITY;
      player.y += player.vy;

      // Ground collision
      const currentGroundY = player.state === 'roll' ? GROUND_Y + 24 : GROUND_Y;
      if (player.y > currentGroundY) {
        player.y = currentGroundY;
        player.vy = 0;
        if (player.state === 'jump') {
          player.state = keys.current['ArrowDown'] ? 'roll' : 'run';
          if (player.state === 'run') {
            player.height = 48;
            player.y = GROUND_Y;
          } else {
            player.height = 24;
            player.y = GROUND_Y + 24;
          }
        }
      }

      if (player.invincibleTimer > 0) {
        player.invincibleTimer--;
      }

      // Spawning
      if (state.frames % 60 === 0 && Math.random() > 0.3) {
        // Spawn Obstacle
        const type = Math.random() > 0.5 ? 'spike' : 'enemy';
        state.obstacles.push({
          x: CANVAS_WIDTH,
          y: type === 'spike' ? GROUND_Y + 16 : GROUND_Y + 16,
          width: 32,
          height: 32,
          type,
          active: true,
        });
      }

      if (state.frames % 40 === 0 && Math.random() > 0.4) {
        // Spawn Ring
        // Sometimes spawn in an arc
        const isArc = Math.random() > 0.7;
        if (isArc) {
          for (let i = 0; i < 5; i++) {
            state.ringsList.push({
              x: CANVAS_WIDTH + i * 40,
              y: GROUND_Y - 40 - Math.sin((i / 4) * Math.PI) * 60,
              radius: 12,
              active: true,
            });
          }
        } else {
          state.ringsList.push({
            x: CANVAS_WIDTH,
            y: GROUND_Y - 20 - Math.random() * 60,
            radius: 12,
            active: true,
          });
        }
      }

      // Update Obstacles
      for (let i = state.obstacles.length - 1; i >= 0; i--) {
        const obs = state.obstacles[i];
        obs.x -= state.speed;

        if (obs.x + obs.width < 0) {
          state.obstacles.splice(i, 1);
          continue;
        }

        // Collision
        if (
          obs.active &&
          player.x < obs.x + obs.width &&
          player.x + player.width > obs.x &&
          player.y < obs.y + obs.height &&
          player.y + player.height > obs.y
        ) {
          if (player.state === 'roll' && obs.type === 'enemy') {
            // Destroy enemy
            obs.active = false;
            spawnParticles(obs.x + obs.width / 2, obs.y + obs.height / 2, '#FF4500', 10);
            state.distance += 50; // Bonus score
          } else if (player.invincibleTimer <= 0) {
            loseRings();
          }
        }
      }

      // Update Rings
      for (let i = state.ringsList.length - 1; i >= 0; i--) {
        const ring = state.ringsList[i];
        ring.x -= state.speed;

        if (ring.x + ring.radius < 0) {
          state.ringsList.splice(i, 1);
          continue;
        }

        // Collision
        if (
          ring.active &&
          player.x < ring.x + ring.radius &&
          player.x + player.width > ring.x - ring.radius &&
          player.y < ring.y + ring.radius &&
          player.y + player.height > ring.y - ring.radius
        ) {
          ring.active = false;
          player.rings++;
          setRings(player.rings);
          spawnParticles(ring.x, ring.y, '#FFD700', 3);
        }
      }

      // Update Particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;
        if (p.life >= p.maxLife) {
          state.particles.splice(i, 1);
        }
      }

      if (state.isGameOver) {
        setGameState('gameover');
        setHighScore((prev) => Math.max(prev, Math.floor(state.distance)));
      } else {
        setScore(Math.floor(state.distance));
      }
    };

    const draw = () => {
      const state = stateRef.current;
      const { player } = state;

      // Clear canvas
      ctx.fillStyle = '#87CEEB'; // Sky blue
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw Parallax Background
      // Mountains (Layer 2)
      ctx.fillStyle = '#4682B4';
      for (let i = 0; i < 3; i++) {
        const x = i * 400 - (state.bgOffset2 % 400);
        ctx.beginPath();
        ctx.moveTo(x, GROUND_Y + 48);
        ctx.lineTo(x + 200, GROUND_Y - 100);
        ctx.lineTo(x + 400, GROUND_Y + 48);
        ctx.fill();
      }

      // Ground (Layer 3)
      ctx.fillStyle = '#228B22'; // Grass
      ctx.fillRect(0, GROUND_Y + 48, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_Y - 48);
      
      // Checkerboard pattern for ground
      ctx.fillStyle = '#8B4513'; // Dirt
      const tileSize = 32;
      for (let i = 0; i < CANVAS_WIDTH / tileSize + 2; i++) {
        for (let j = 0; j < 3; j++) {
          if ((i + j) % 2 === 0) {
            ctx.fillRect(i * tileSize - (state.bgOffset3 % tileSize), GROUND_Y + 48 + j * tileSize, tileSize, tileSize);
          }
        }
      }

      // Draw Rings
      ctx.lineWidth = 4;
      state.ringsList.forEach((ring) => {
        if (!ring.active) return;
        ctx.strokeStyle = '#FFD700'; // Gold
        ctx.beginPath();
        // Squeeze ring slightly to look like it's spinning based on frame
        const squeeze = Math.sin(state.frames * 0.1) * ring.radius;
        ctx.ellipse(ring.x, ring.y, Math.abs(squeeze) || 1, ring.radius, 0, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Draw Obstacles
      state.obstacles.forEach((obs) => {
        if (!obs.active) return;
        if (obs.type === 'spike') {
          ctx.fillStyle = '#A9A9A9';
          ctx.beginPath();
          ctx.moveTo(obs.x, obs.y + obs.height);
          ctx.lineTo(obs.x + obs.width / 2, obs.y);
          ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
          ctx.fill();
        } else {
          // Enemy (Crab/Bug)
          ctx.fillStyle = '#FF4500';
          ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
          // Eyes
          ctx.fillStyle = 'white';
          ctx.fillRect(obs.x + 4, obs.y + 8, 8, 8);
          ctx.fillRect(obs.x + 20, obs.y + 8, 8, 8);
          ctx.fillStyle = 'black';
          ctx.fillRect(obs.x + 8, obs.y + 12, 4, 4);
          ctx.fillRect(obs.x + 20, obs.y + 12, 4, 4);
        }
      });

      // Draw Player
      if (player.invincibleTimer === 0 || Math.floor(state.frames / 4) % 2 === 0) {
        ctx.fillStyle = '#0000CD'; // Sonic Blue
        
        if (player.state === 'roll') {
          // Draw rolling ball
          ctx.beginPath();
          ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.height / 2, 0, Math.PI * 2);
          ctx.fill();
          // Draw a spinning highlight
          ctx.fillStyle = 'rgba(255,255,255,0.5)';
          const angle = state.frames * 0.5;
          ctx.beginPath();
          ctx.arc(
            player.x + player.width / 2 + Math.cos(angle) * 8,
            player.y + player.height / 2 + Math.sin(angle) * 8,
            4, 0, Math.PI * 2
          );
          ctx.fill();
        } else {
          // Draw standing/running/jumping body
          ctx.fillRect(player.x, player.y, player.width, player.height);
          
          // Face/Belly
          ctx.fillStyle = '#FFE4B5';
          ctx.fillRect(player.x + 16, player.y + 8, 16, 16); // Face
          ctx.fillRect(player.x + 8, player.y + 24, 16, 16); // Belly
          
          // Eye
          ctx.fillStyle = 'white';
          ctx.fillRect(player.x + 20, player.y + 8, 12, 12);
          ctx.fillStyle = 'black';
          ctx.fillRect(player.x + 28, player.y + 12, 4, 4);
          
          // Shoes
          ctx.fillStyle = '#DC143C';
          if (player.state === 'run') {
            // Animate legs
            const legOffset = Math.sin(state.frames * 0.5) * 8;
            ctx.fillRect(player.x + 4 + legOffset, player.y + 40, 12, 8);
            ctx.fillRect(player.x + 16 - legOffset, player.y + 40, 12, 8);
          } else {
            // Jumping legs
            ctx.fillRect(player.x + 8, player.y + 40, 16, 8);
          }
        }
      }

      // Draw Particles
      state.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 1 - p.life / p.maxLife;
        ctx.fillRect(p.x, p.y, 4, 4);
      });
      ctx.globalAlpha = 1.0;
    };

    const loop = () => {
      update();
      draw();
      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameState, loseRings, spawnParticles]);

  // Mobile controls
  const handleTouchStart = (action: 'jump' | 'roll') => {
    if (gameState !== 'playing') {
      startGame();
      return;
    }
    if (action === 'jump') {
      keys.current['Space'] = true;
    } else {
      keys.current['ArrowDown'] = true;
    }
  };

  const handleTouchEnd = (action: 'jump' | 'roll') => {
    if (action === 'jump') {
      keys.current['Space'] = false;
    } else {
      keys.current['ArrowDown'] = false;
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Game Header / HUD */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10 pointer-events-none">
        <div className="flex gap-6 text-white font-mono text-xl drop-shadow-md">
          <div className="flex flex-col">
            <span className="text-yellow-400 font-bold">SCORE</span>
            <span>{score}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-yellow-400 font-bold">RINGS</span>
            <span>{rings}</span>
          </div>
        </div>
        <div className="flex flex-col text-right text-white font-mono text-xl drop-shadow-md">
          <span className="text-yellow-400 font-bold">HI-SCORE</span>
          <span>{highScore}</span>
        </div>
      </div>

      {/* The Canvas */}
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="w-full h-auto bg-sky-300 rounded-xl shadow-2xl border-4 border-slate-800"
        style={{ imageRendering: 'pixelated' }}
      />

      {/* Mobile Controls Overlay */}
      <div className="absolute inset-0 flex sm:hidden z-20">
        <div 
          className="flex-1 h-full"
          onTouchStart={() => handleTouchStart('roll')}
          onTouchEnd={() => handleTouchEnd('roll')}
        />
        <div 
          className="flex-1 h-full"
          onTouchStart={() => handleTouchStart('jump')}
          onTouchEnd={() => handleTouchEnd('jump')}
        />
      </div>

      {/* Mobile Control Indicators */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between sm:hidden pointer-events-none opacity-50 text-white z-10">
        <div className="flex flex-col items-center bg-black/30 p-2 rounded-lg">
          <ArrowDown size={32} />
          <span className="font-mono text-xs mt-1">TAP TO ROLL</span>
        </div>
        <div className="flex flex-col items-center bg-black/30 p-2 rounded-lg">
          <ArrowUp size={32} />
          <span className="font-mono text-xs mt-1">TAP TO JUMP</span>
        </div>
      </div>

      {/* Overlays */}
      {gameState === 'start' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl z-30 backdrop-blur-sm">
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-blue-400 to-blue-600 mb-2 drop-shadow-lg tracking-tighter italic">
            PIXEL RUNNER
          </h1>
          <p className="text-white font-mono mb-8 text-center px-4">
            Press <kbd className="bg-white/20 px-2 py-1 rounded">SPACE</kbd> or Tap to Start
            <br />
            <span className="text-sm opacity-70 mt-2 block">
              Desktop: SPACE/UP to Jump, DOWN to Roll<br/>
              Mobile: Tap Right to Jump, Tap Left to Roll
            </span>
          </p>
          <button
            onClick={startGame}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-bold text-xl transition-transform hover:scale-105 active:scale-95"
          >
            <Play fill="currentColor" /> Play Now
          </button>
        </div>
      )}

      {gameState === 'gameover' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-xl z-30 backdrop-blur-md">
          <h2 className="text-5xl font-black text-red-500 mb-4 drop-shadow-lg italic">GAME OVER</h2>
          <div className="flex gap-8 mb-8">
            <div className="text-center">
              <p className="text-gray-400 font-mono text-sm">SCORE</p>
              <p className="text-3xl font-bold text-white font-mono">{score}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 font-mono text-sm">BEST</p>
              <p className="text-3xl font-bold text-yellow-400 font-mono flex items-center gap-1 justify-center">
                <Trophy size={20} /> {highScore}
              </p>
            </div>
          </div>
          <button
            onClick={startGame}
            className="flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold text-xl transition-transform hover:scale-105 active:scale-95"
          >
            <RotateCcw /> Play Again
          </button>
        </div>
      )}
    </div>
  );
}
