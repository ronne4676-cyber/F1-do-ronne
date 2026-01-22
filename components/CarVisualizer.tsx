
import React from 'react';
import { CarStats } from '../types';
import { UPGRADES, INITIAL_CAR_STATS } from '../constants';

interface CarVisualizerProps {
  stats: CarStats;
}

const CarVisualizer: React.FC<CarVisualizerProps> = ({ stats }) => {
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

          <filter id="heatDistortion">
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" result="noise">
              <animate attributeName="baseFrequency" values="0.05;0.08;0.05" dur="0.8s" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={8 * powerScale} />
          </filter>
          
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

        <g className="flow-lines">
          {[15, 35, 165, 185].map((x, i) => (
            <rect key={i} x={x} y="0" width={1 + aeroScale * 2} height="180" fill="url(#aeroGrad)">
              <animate attributeName="y" from="-180" to="420" 
                       dur={`${1.0 - aeroScale * 0.8}s`} repeatCount="indefinite" 
                       begin={`${i * 0.12}s`} />
            </rect>
          ))}
        </g>

        <path d={`M70,100 Q100,${20 - aeroScale * 15} 130,100 L145,310 Q100,${350 + aeroScale * 15} 55,310 Z`} 
              fill="#0f172a" stroke="#334155" strokeWidth="2" />
        
        <path d="M80,150 L120,150 M80,180 L120,180 M80,210 L120,210" stroke="#1e293b" strokeWidth="1" opacity="0.5" />

        <g fill="#475569" opacity={0.2 + aeroScale * 0.8}>
          <path d="M72,110 L78,105 L84,110 Z" />
          <path d="M116,110 L122,105 L128,110 Z" />
          {aeroScale > 0.6 && (
            <>
              <path d="M68,230 L74,225 L80,230 Z" />
              <path d="M120,230 L126,225 L132,230 Z" />
            </>
          )}
        </g>

        <rect x="35" y="85" width="130" height={12 + aeroScale * 8} rx="1" fill="#020617" stroke="#334155" />
        <rect x="45" y="325" width="110" height={15 + aeroScale * 10} rx="1" fill="#020617" stroke="#334155" />
        <ellipse cx="100" cy="185" rx="14" ry="28" fill="#020617" stroke="#475569" strokeWidth="2" />

        <g opacity={reliabilityScale * 0.5} stroke="#10b981" strokeWidth="0.8">
           <path d="M85,140 L115,280 M115,140 L85,280 M100,100 L100,320" />
           <circle cx="100" cy="185" r="45" fill="none" strokeDasharray="3,3" />
        </g>

        {/* ERS Energy Ring */}
        {ersScale > 0.2 && (
          <circle cx="100" cy="205" r={20 + ersScale * 15} fill="none" stroke="#22d3ee" strokeWidth={1 + ersScale * 2} strokeOpacity={0.2 + ersScale * 0.3} strokeDasharray="10,20">
            <animateTransform attributeName="transform" type="rotate" from="0 100 205" to="360 100 205" dur={`${3 - ersScale * 2.5}s`} repeatCount="indefinite" />
          </circle>
        )}

        {/* ERS Energy Core */}
        <circle cx="100" cy="205" r={12 + ersScale * 20} fill="url(#energyCore)" filter="url(#ersGlow)">
           <animate attributeName="r" values={`${12 + ersScale * 15}; ${18 + ersScale * 25}; ${12 + ersScale * 15}`} 
                    dur={`${1.5 - ersScale * 1.2}s`} repeatCount="indefinite" />
        </circle>

        {/* ERS Lightning Bolt Effects */}
        <g filter="url(#ersGlow)" opacity={0.3 + ersScale * 0.7}>
           <path d="M70,190 L55,210 L70,205 L60,230" fill="none" stroke="#22d3ee" strokeWidth={1.5 + ersScale * 2.5}>
             <animate attributeName="opacity" values="0;1;0" dur={`${0.6 - ersScale * 0.4}s`} repeatCount="indefinite" />
             <animate attributeName="stroke-dasharray" values="0,100;100,0" dur="0.2s" repeatCount="indefinite" />
           </path>
           <path d="M130,190 L145,210 L130,205 L140,230" fill="none" stroke="#22d3ee" strokeWidth={1.5 + ersScale * 2.5}>
             <animate attributeName="opacity" values="0;1;0" dur={`${0.6 - ersScale * 0.4}s`} repeatCount="indefinite" begin="0.1s" />
             <animate attributeName="stroke-dasharray" values="0,100;100,0" dur="0.2s" repeatCount="indefinite" begin="0.1s" />
           </path>
        </g>

        <g filter={powerScale > 0.4 ? "url(#heatDistortion)" : ""}>
          <g filter="url(#glow)">
            <path d="M85,260 L115,260 L110,320 L90,320 Z" 
                  fill={exhaustColor} 
                  fillOpacity={0.2 + powerScale * 0.6}>
              <animate attributeName="fillOpacity" values={`${0.2 + powerScale * 0.6}; ${0.5 + powerScale * 0.5}; ${0.2 + powerScale * 0.6}`} 
                       dur={`${1.2 - powerScale * 1.0}s`} repeatCount="indefinite" />
            </path>
            
            <circle cx="92" cy="340" r={4 + powerScale * 6} fill={exhaustColor} fillOpacity={0.4 + powerScale * 0.6}>
               <animate attributeName="r" values={`${4 + powerScale * 6}; ${6 + powerScale * 8}; ${4 + powerScale * 6}`} 
                        dur={exhaustPulseSpeed} repeatCount="indefinite" />
            </circle>
            <circle cx="108" cy="340" r={4 + powerScale * 6} fill={exhaustColor} fillOpacity={0.4 + powerScale * 0.6}>
               <animate attributeName="r" values={`${4 + powerScale * 6}; ${6 + powerScale * 8}; ${4 + powerScale * 6}`} 
                        dur={exhaustPulseSpeed} repeatCount="indefinite" />
            </circle>
          </g>
        </g>

        <g filter="url(#glow)">
          <path d="M75,120 Q100,95 125,120 L138,290 Q100,325 62,290 Z" 
                fill="none" 
                stroke="#10b981" 
                strokeWidth={1.5 + reliabilityScale * 5}
                strokeOpacity={0.1 + reliabilityScale * 0.8}
                strokeDasharray={reliabilityScale > 0.9 ? "" : "12,6"}>
            <animate attributeName="strokeDashoffset" from="0" to="100" dur="6s" repeatCount="indefinite" />
          </path>
        </g>

        <path d="M60,160 Q100,145 140,160" fill="none" stroke="#60a5fa" strokeWidth="1" strokeOpacity={aeroScale * 0.5} />
        <path d="M55,240 Q100,225 145,240" fill="none" stroke="#60a5fa" strokeWidth="1" strokeOpacity={aeroScale * 0.5} />

      </svg>

      <div className="absolute bottom-4 left-4 flex flex-col gap-1.5">
        <div className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${powerScale > 0.8 ? 'text-cyan-400' : powerScale > 0.5 ? 'text-yellow-400' : 'text-slate-500'}`}>
          <div className={`w-2 h-2 rounded-full ${powerScale > 0.5 ? 'animate-pulse' : ''}`} style={{ backgroundColor: exhaustColor }} />
          Potência BHP: {stats.power}
        </div>
        <div className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${ersScale > 0.8 ? 'text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'text-slate-500'}`}>
          <div className={`w-2 h-2 rounded-full ${ersScale > 0.5 ? 'bg-cyan-400 animate-ping' : 'bg-slate-700'}`} />
          Estado Híbrido: {stats.ers}%
        </div>
      </div>
      
      <div className="absolute top-4 right-4 text-[9px] text-slate-600 font-mono uppercase tracking-[0.2em] font-black text-right">
        Chassi: {reliabilityScale > 0.9 ? 'INDESTRUTÍVEL' : reliabilityScale > 0.7 ? 'OTIMIZADO' : 'DEGRADANDO'}<br/>
        ERS: {ersScale > 0.9 ? 'SUPERCHARGED' : ersScale > 0.5 ? 'ESTÁVEL' : 'DRENO CRÍTICO'}
      </div>
    </div>
  );
};

export default CarVisualizer;
