
import React from 'react';
import { CarStats } from '../types';
import { UPGRADES, INITIAL_CAR_STATS } from '../constants';

interface CarVisualizerProps {
  stats: CarStats;
  color?: string;
}

const CarVisualizer: React.FC<CarVisualizerProps> = ({ stats, color = '#ef4444' }) => {
  const powerScale = Math.min(1, Math.max(0, (stats.power - INITIAL_CAR_STATS.power) / (UPGRADES.power.max - INITIAL_CAR_STATS.power)));
  const aeroScale = Math.min(1, Math.max(0, (stats.aero - INITIAL_CAR_STATS.aero) / (UPGRADES.aero.max - INITIAL_CAR_STATS.aero)));
  const reliabilityScale = Math.min(1, Math.max(0, (stats.reliability - INITIAL_CAR_STATS.reliability) / (UPGRADES.reliability.max - INITIAL_CAR_STATS.reliability)));
  const ersScale = Math.min(1, Math.max(0, (stats.ers - INITIAL_CAR_STATS.ers) / (UPGRADES.ers.max - INITIAL_CAR_STATS.ers)));

  const exhaustColor = powerScale > 0.8 ? '#06b6d4' : powerScale > 0.5 ? '#fbbf24' : '#f97316';
  const exhaustPulseSpeed = `${0.15 - (powerScale * 0.1)}s`;

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-slate-900/40 rounded-3xl border border-slate-800 overflow-hidden group">
      <div className="absolute inset-0 opacity-10" 
           style={{ backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
      
      <svg viewBox="0 0 200 400" className="w-full h-full max-h-[300px] drop-shadow-2xl">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation={2 + powerScale * 4} result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          <filter id="ersGlow">
            <feGaussianBlur stdDeviation={1 + ersScale * 15} result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <linearGradient id="carBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} />
            <stop offset="50%" stopColor={color} stopOpacity="0.8" />
            <stop offset="100%" stopColor={color} />
          </linearGradient>

          <linearGradient id="aeroGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0" />
            <stop offset="50%" stopColor="#60a5fa" stopOpacity={0.3 + aeroScale * 0.7} />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
          </linearGradient>

          <radialGradient id="energyCore">
            <stop offset="0%" stopColor={ersScale > 0.8 ? "#fff" : "#22d3ee"} stopOpacity={0.6 + ersScale * 0.4} />
            <stop offset="40%" stopColor="#22d3ee" stopOpacity={0.4 + ersScale * 0.6} />
            <stop offset="100%" stopColor="#0891b2" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Linhas de Fluxo de Ar */}
        <g className="flow-lines">
          {[15, 35, 165, 185].map((x, i) => (
            <rect key={i} x={x} y="0" width={1 + aeroScale * 2} height="180" fill="url(#aeroGrad)">
              <animate attributeName="y" from="-180" to="420" 
                       dur={`${1.0 - aeroScale * 0.8}s`} repeatCount="indefinite" 
                       begin={`${i * 0.12}s`} />
            </rect>
          ))}
        </g>

        {/* Chassi Principal */}
        <path d={`M70,100 Q100,${20 - aeroScale * 15} 130,100 L145,310 Q100,${350 + aeroScale * 15} 55,310 Z`} 
              fill="url(#carBodyGrad)" stroke="#1e293b" strokeWidth="2" />
        
        {/* Cockpit e Detalhes */}
        <path d="M85,150 L115,150 L112,230 L88,230 Z" fill="#020617" />
        <path d="M90,140 L110,140 L108,160 L92,160 Z" fill="#334155" />

        {/* Asas */}
        <rect x="35" y="85" width="130" height={12 + aeroScale * 8} rx="1" fill="#020617" stroke="#334155" />
        <rect x="45" y="325" width="110" height={15 + aeroScale * 10} rx="1" fill="#020617" stroke="#334155" />
        
        {/* Pneus */}
        <rect x="25" y="90" width="30" height="50" rx="4" fill="#020617" />
        <rect x="145" y="90" width="30" height="50" rx="4" fill="#020617" />
        <rect x="20" y="280" width="35" height="60" rx="4" fill="#020617" />
        <rect x="145" y="280" width="35" height="60" rx="4" fill="#020617" />

        {/* ERS Energy Core */}
        <circle cx="100" cy="205" r={12 + ersScale * 20} fill="url(#energyCore)" filter="url(#ersGlow)">
           <animate attributeName="r" values={`${12 + ersScale * 15}; ${18 + ersScale * 25}; ${12 + ersScale * 15}`} 
                    dur={`${1.5 - ersScale * 1.2}s`} repeatCount="indefinite" />
        </circle>

        {/* Escape de Fogo */}
        <g>
          <path d="M92,340 L108,340 L105,370 L95,370 Z" 
                fill={exhaustColor} 
                fillOpacity={0.2 + powerScale * 0.6}>
            <animate attributeName="fillOpacity" values={`${0.2 + powerScale * 0.6}; ${0.5 + powerScale * 0.5}; ${0.2 + powerScale * 0.6}`} 
                     dur={exhaustPulseSpeed} repeatCount="indefinite" />
          </path>
        </g>
      </svg>

      <div className="absolute bottom-4 left-4 flex flex-col gap-1.5">
        <div className="text-[8px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          Livery: {color.toUpperCase()}
        </div>
      </div>
    </div>
  );
};

export default CarVisualizer;
