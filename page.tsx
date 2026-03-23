import React from 'react';
import SonicRunner from '@/components/SonicRunner';
import { Terminal, Copy } from 'lucide-react';

export default function Page() {
  const upgradedPrompt = `Build a 2D side-scrolling endless runner game inspired by Sonic the Hedgehog using HTML5 Canvas and React. The game should feature a pixel-art aesthetic (using blocky canvas shapes or pixelated sprites). Core mechanics must include: gravity-based jumping, a 'roll' action to destroy specific enemies or slide under obstacles, ring collection for score and survival (taking damage drops rings; taking damage with 0 rings causes game over), progressively increasing run speed, and a multi-layered parallax scrolling background (sky, mountains, ground). Include a start screen, game over screen, and a high score tracking system.`;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans selection:bg-blue-500/30">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header */}
        <header className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">
            Pixel Runner
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            A high-speed 2D canvas runner built entirely in React. Collect rings, roll through enemies, and survive as long as you can.
          </p>
        </header>

        {/* Game Container */}
        <section className="flex justify-center">
          <SonicRunner />
        </section>

        {/* Upgraded Prompt Section */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Terminal className="text-blue-400" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-white">Upgraded Prompt</h2>
          </div>
          
          <p className="text-slate-400 mb-6">
            You asked for an upgraded version of your prompt to generate this game. Here is a highly detailed, structured prompt you can use in the future to get similar or better results:
          </p>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl blur-xl opacity-50 transition-opacity group-hover:opacity-100" />
            <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-6 font-mono text-sm md:text-base leading-relaxed text-slate-300 shadow-inner">
              {upgradedPrompt}
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
