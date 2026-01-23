import React, { useState, useEffect, useRef } from 'react';
import { Team, RaceResult, RaceStrategy, Weather, Track, TireCompound, Penalty } from '../types';
import { CALENDAR, PENALTY_REASONS } from '../constants';
import { generateRaceCommentary, generatePenaltyReport } from '../services/geminiService';
import { playConfirmSFX, playRaceStartSFX, playNotificationSFX } from '../utils/audio';
import { Timer, Activity, Pause, Play, Flag, Radio, Thermometer, Zap, Gauge, CloudRain, Sun, Cloud, AlertTriangle, Droplets, ShieldCheck, Trophy, Gavel, ShieldAlert, ZapOff } from 'lucide-react';

interface SimulationRoomProps {
  userTeam: Team;
  rivals: Team[];
  round: number;
  onFinish: (results: RaceResult[], commentary: string, newPenalties: Penalty[]) => void;
}

interface PilotEntry {
  id: string;
  name: string;
  teamId: string;
  teamName: string;
  teamColor: string;
  performance: number;
  position: number;
  gapToLeader: number;
  gapToNext: number;
  dnf: boolean;
  tireWear: number;
  tireCompound: TireCompound;
  engineCondition: number;
  isUser: boolean;
  hasDRS: boolean;
  isFastestLap: boolean;
  isPushing: boolean; // Novo: Indica se o piloto está em ritmo de ataque
}

const SimulationRoom: React.FC<SimulationRoomProps> = ({ userTeam, rivals, round, onFinish }) => {
  const [stage, setStage] = useState<'IDLE' | 'RACE' | 'RESULTS'>('IDLE');
  const [currentLap, setCurrentLap] = useState(0);
  const [grid, setGrid] = useState<PilotEntry[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [weather, setWeather] = useState<Weather>(Weather.SUNNY);
  const [tireCompound, setTireCompound] = useState<TireCompound>(TireCompound.MEDIUM);
  const [nextTireCompound, setNextTireCompound] = useState<TireCompound>(TireCompound.MEDIUM);
  const [pitPending, setPitPending] = useState(false);
  const [commentary, setCommentary] = useState('');
  const [safetyCar, setSafetyCar] = useState<'OFF' | 'SC' | 'VSC'>('OFF');
  const [racePenalties, setRacePenalties] = useState<Penalty[]>([]);
  const [activeIncident, setActiveIncident] = useState<string | null>(null);
  const [finalResults, setFinalResults] = useState<RaceResult[]>([]);
  
  const currentTrack = CALENDAR[(round - 1) % CALENDAR.length];
  const raceInterval = useRef<number | null>(null);

  const startRace = () => {
    playConfirmSFX();
    setStage('RACE');
    setCurrentLap(1);
    
    const roll = Math.random();
    setWeather(roll < 0.6 ? Weather.SUNNY : roll < 0.8 ? Weather.CLOUDY : Weather.RAIN);

    const allTeams = [userTeam, ...rivals];
    const initialGrid: PilotEntry[] = [];
    
    allTeams.forEach(team => {
      team.drivers.forEach((driver) => {
        initialGrid.push({
          id: `${team.id}_${driver.id}`,
          name: driver.name,
          teamId: team.id,
          teamName: team.name,
          teamColor: team.color || '#ef4444',
          performance: (initialGrid.length * -0.1), // Pequeno offset para o grid de largada
          position: 0,
          gapToLeader: 0,
          gapToNext: 0,
          dnf: false,
          tireWear: 0,
          tireCompound: team.id === userTeam.id ? tireCompound : (Math.random() > 0.5 ? TireCompound.MEDIUM : TireCompound.SOFT),
          engineCondition: 100,
          isUser: team.id === userTeam.id,
          hasDRS: false,
          isFastestLap: false,
          isPushing: false
        });
      });
    });

    setGrid(initialGrid.sort((a, b) => b.performance - a.performance).map((p, i) => ({ ...p, position: i + 1 })));
    playRaceStartSFX();
  };

  useEffect(() => {
    if (stage === 'RACE' && !isPaused && currentLap <= currentTrack.laps) {
      raceInterval.current = window.setInterval(() => {
        setCurrentLap(prev => prev + 1);
        processLap();
      }, 800); // Um pouco mais rápido para dinamismo
    } else {
      if (raceInterval.current) clearInterval(raceInterval.current);
    }
    return () => { if (raceInterval.current) clearInterval(raceInterval.current); };
  }, [stage, isPaused, currentLap, weather, tireCompound, safetyCar]);

  const triggerIncident = async () => {
    if (activeIncident) return;
    const reason = PENALTY_REASONS[Math.floor(Math.random() * PENALTY_REASONS.length)];
    setActiveIncident(reason);
    playNotificationSFX();

    setTimeout(async () => {
      const report = await generatePenaltyReport(userTeam.name, reason);
      const newPenalty: Penalty = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'Sanção de Corrida',
        pointsLost: Math.floor(Math.random() * 5) + 2,
        cost: (Math.floor(Math.random() * 5) + 1) * 1000000,
        reason: report,
        timestamp: Date.now(),
        isResolved: false
      };
      setRacePenalties(prev => [...prev, newPenalty]);
      setActiveIncident(null);
    }, 2500);
  };

  const processLap = () => {
    if (safetyCar === 'OFF' && Math.random() < 0.012) {
      setSafetyCar(Math.random() > 0.7 ? 'SC' : 'VSC');
      playNotificationSFX();
    } else if (safetyCar !== 'OFF' && Math.random() < 0.25) {
      setSafetyCar('OFF');
    }

    if (Math.random() < 0.015 && stage === 'RACE' && !activeIncident) {
      triggerIncident();
    }

    setGrid(prevGrid => {
      // Evolução da pista: fica 0.05s mais rápida por volta
      const trackEvolution = currentLap * 0.05;

      const updated = prevGrid.map((pilot, idx) => {
        if (pilot.dnf) return pilot;

        // Base de performance mais estável
        let baseGain = pilot.isUser ? (userTeam.car.power * 0.11) : (90 + Math.random() * 0.5);
        
        // Vácuo (Slipstream): Bônus se estiver a menos de 1.8s
        let slipstreamBonus = (pilot.gapToNext > 0 && pilot.gapToNext < 1.8) ? (0.4 + (1.8 - pilot.gapToNext) * 0.5) : 0;
        
        // DRS: Só ativa se vácuo estiver forte (< 1.0s)
        let drsBonus = pilot.hasDRS ? 1.8 : 0;
        
        // Pneus e "Cliff" de performance
        let tireBonus = 0;
        let tireCliff = pilot.tireWear > 75 ? (pilot.tireWear - 75) * 0.15 : 0;
        
        if (pilot.tireCompound === TireCompound.SOFT) tireBonus = 1.8;
        if (pilot.tireCompound === TireCompound.MEDIUM) tireBonus = 0.8;
        
        // Variância aleatória do piloto (Consistência)
        const consistencyFactor = (Math.random() - 0.5) * 0.4;

        // Penalidade Clima
        let weatherPenalty = 0;
        const isWet = weather === Weather.RAIN || weather === Weather.STORM;
        if (isWet) {
          weatherPenalty = (pilot.tireCompound === TireCompound.WET) ? 0 : (pilot.tireCompound === TireCompound.INTERMEDIATE ? 1.5 : 8.0);
        } else {
          weatherPenalty = (pilot.tireCompound === TireCompound.WET) ? 6.0 : (pilot.tireCompound === TireCompound.INTERMEDIATE ? 3.0 : 0);
        }

        // Multiplicador de Safety Car
        let scMultiplier = safetyCar === 'SC' ? 0.1 : (safetyCar === 'VSC' ? 0.6 : 1.0);

        let lapPerformance = (baseGain + trackEvolution + tireBonus + drsBonus + slipstreamBonus - weatherPenalty - tireCliff + consistencyFactor) * scMultiplier;
        
        // Desgaste de pneus
        let wearRate = pilot.tireCompound === TireCompound.SOFT ? 4.2 : 2.2;
        if (isWet && pilot.tireCompound !== TireCompound.WET) wearRate *= 2; // Superaquecimento

        let currentWear = Math.min(100, pilot.tireWear + (wearRate * (pilot.isPushing ? 1.5 : 1)));
        let currentCompound = pilot.tireCompound;

        // Logica de Pit Stop
        if (pilot.isUser && pitPending) {
          lapPerformance -= 24; // Tempo de box
          currentWear = 0;
          currentCompound = nextTireCompound;
          setTireCompound(nextTireCompound);
          setPitPending(false);
        } else if (!pilot.isUser && (pilot.tireWear > 82 || (isWet && pilot.tireCompound !== TireCompound.WET && pilot.tireCompound !== TireCompound.INTERMEDIATE))) {
          lapPerformance -= 24;
          currentWear = 0;
          currentCompound = isWet ? TireCompound.INTERMEDIATE : TireCompound.MEDIUM;
        }

        return { 
          ...pilot, 
          performance: pilot.performance + lapPerformance, 
          tireWear: currentWear, 
          tireCompound: currentCompound,
          engineCondition: Math.max(0, pilot.engineCondition - 0.25),
          isPushing: pilot.isUser ? pitPending : (pilot.gapToNext < 1.0), // Ataca se estiver perto
        };
      });

      const sorted = [...updated].sort((a, b) => b.performance - a.performance);
      
      // Agrupamento agressivo no Safety Car
      if (safetyCar === 'SC') {
        const leaderPerf = sorted[0].performance;
        sorted.forEach((p, i) => {
          // Os carros ficam a exatamente 0.4s um do outro
          p.performance = leaderPerf - (i * 0.4); 
        });
      }

      return sorted.map((p, i) => ({
        ...p,
        position: i + 1,
        gapToLeader: sorted[0].performance - p.performance,
        gapToNext: i === 0 ? 0 : sorted[i-1].performance - p.performance,
        hasDRS: i > 0 && (sorted[i-1].performance - p.performance) < 1.0 && safetyCar === 'OFF'
      }));
    });

    if (currentLap >= currentTrack.laps) finishRace();
  };

  const finishRace = async () => {
    setStage('RESULTS');
    const results: RaceResult[] = grid.map(p => ({
      teamId: p.teamId, teamName: p.teamName, position: p.position,
      performance: p.performance, tireWear: p.tireWear, engineCondition: p.engineCondition,
      commentary: p.dnf ? 'DNF' : 'Finished'
    }));
    setFinalResults(results);
    const comm = await generateRaceCommentary(results, userTeam.name);
    setCommentary(comm);
  };

  const getTireColor = (compound: TireCompound) => {
    switch(compound) {
      case TireCompound.SOFT: return 'bg-red-600';
      case TireCompound.MEDIUM: return 'bg-yellow-500';
      case TireCompound.HARD: return 'bg-slate-300';
      case TireCompound.INTERMEDIATE: return 'bg-emerald-500';
      case TireCompound.WET: return 'bg-blue-600';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="glass rounded-[2rem] overflow-hidden border-white/10 animate-fadeIn relative">
      {/* Alerta de Safety Car */}
      {safetyCar !== 'OFF' && (
        <div className={`absolute top-0 left-0 w-full z-50 p-2 flex items-center justify-center gap-4 animate-pulse ${safetyCar === 'SC' ? 'bg-yellow-500 text-black' : 'bg-orange-600 text-white'}`}>
           <AlertTriangle size={20} />
           <span className="font-black uppercase tracking-widest text-sm">
             {safetyCar === 'SC' ? 'SAFETY CAR DEPLOYED' : 'VIRTUAL SAFETY CAR'}
           </span>
        </div>
      )}

      {/* Alerta de Investigação FIA */}
      {activeIncident && (
        <div className="absolute top-12 left-0 w-full z-[60] p-4 bg-red-600 text-white flex items-center justify-center gap-4 animate-slideDown shadow-2xl">
           <Gavel className="animate-bounce" />
           <div className="text-center">
             <p className="text-[10px] font-black uppercase tracking-widest leading-none">FIA Investigation</p>
             <p className="text-sm font-bold uppercase italic">{activeIncident}</p>
           </div>
        </div>
      )}

      {/* Header */}
      <div className={`p-4 lg:p-6 border-b flex justify-between items-center transition-colors duration-500 ${weather === Weather.RAIN ? 'bg-blue-900/30' : 'bg-slate-900/80'}`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl glass flex items-center justify-center text-white neon-border" style={{ borderColor: userTeam.color }}>
            <Timer size={24} />
          </div>
          <div>
            <h3 className="font-heading text-xl uppercase italic">
              {stage === 'RACE' ? `LAP ${currentLap}/${currentTrack.laps}` : 'Race Control'}
            </h3>
            <div className="flex items-center gap-3">
               <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                 {weather === Weather.SUNNY ? <Sun size={12} className="text-yellow-400" /> : <CloudRain size={12} className="text-blue-400" />}
                 <span>{weather}</span>
               </div>
               <div className="text-[10px] font-black uppercase text-slate-400">Pista: Emborrachando</div>
            </div>
          </div>
        </div>
        
        {stage === 'RACE' && (
          <button onClick={() => setIsPaused(!isPaused)} className="p-3 glass rounded-xl text-white">
            {isPaused ? <Play size={20} fill="currentColor" /> : <Pause size={20} fill="currentColor" />}
          </button>
        )}
      </div>

      <div className="p-4 lg:p-8">
        {stage === 'IDLE' && (
          <div className="max-w-2xl mx-auto py-12 text-center space-y-8">
            <div className="flex flex-col items-center">
              <img src={`https://flagsapi.com/${currentTrack.countryCode}/flat/64.png`} className="w-20 rounded-lg shadow-2xl mb-4" />
              <h4 className="font-heading text-4xl uppercase italic tracking-tighter">{currentTrack.country}</h4>
              <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Estratégia de Partida</p>
            </div>
            
            <div className="glass p-8 rounded-3xl border-white/10 grid grid-cols-2 sm:grid-cols-5 gap-4">
              {[TireCompound.SOFT, TireCompound.MEDIUM, TireCompound.HARD, TireCompound.INTERMEDIATE, TireCompound.WET].map(t => (
                <button key={t} onClick={() => setTireCompound(t)} className={`p-4 rounded-2xl glass border-2 transition-all flex flex-col items-center gap-2 ${tireCompound === t ? 'border-white scale-110' : 'border-transparent opacity-40'}`}>
                  <div className={`w-5 h-5 rounded-full ring-2 ring-white/10 ${getTireColor(t)}`} />
                  <span className="text-[10px] font-black uppercase tracking-tight text-white">{t.slice(0, 3)}</span>
                </button>
              ))}
            </div>

            <button onClick={startRace} className="w-full py-6 bg-white text-slate-950 rounded-[2rem] font-black uppercase italic text-xl shadow-2xl hover:bg-emerald-400 hover:text-white transition-all active:scale-95">
              START RACE
            </button>
          </div>
        )}

        {stage === 'RACE' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Live Timing Board */}
            <div className="lg:col-span-8 space-y-2">
              <div className="grid grid-cols-12 px-5 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest bg-slate-950/40 rounded-t-xl">
                <div className="col-span-1">POS</div>
                <div className="col-span-6">PILOT / TEAM</div>
                <div className="col-span-2 text-center">INTERVAL</div>
                <div className="col-span-3 text-right">GAP LEADER</div>
              </div>
              <div className="space-y-1 h-[500px] overflow-y-auto pr-2 no-scrollbar">
                {grid.map((p) => (
                  <div key={p.id} className={`grid grid-cols-12 items-center px-5 py-3 rounded-2xl transition-all border ${p.isUser ? 'bg-white/10 border-white/20' : 'glass border-white/5'} ${p.dnf ? 'opacity-20' : ''}`}>
                    <div className="col-span-1 font-mono font-black text-xs">{p.dnf ? 'OUT' : p.position}</div>
                    <div className="col-span-6 flex items-center gap-3">
                      <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: p.teamColor }} />
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                           <span className="font-heading text-xs uppercase italic truncate max-w-[120px]">{p.name}</span>
                           <div className={`w-2 h-2 rounded-full ${getTireColor(p.tireCompound)}`} title={p.tireCompound} />
                           {p.hasDRS && <span className="bg-emerald-500 text-[8px] px-1 rounded text-black font-black animate-pulse">DRS</span>}
                           {/* Fixed: Wrapped Zap icon in a span with the title attribute to fix the 'Property title does not exist on type LucideProps' error. */}
                           {p.gapToNext > 0 && p.gapToNext < 1.8 && !p.hasDRS && <span title="Slipstream"><Zap size={10} className="text-yellow-400 animate-pulse" /></span>}
                           {p.isFastestLap && <Trophy size={10} className="text-purple-500" />}
                        </div>
                        <span className="text-[8px] text-slate-500 font-bold uppercase truncate">{p.teamName}</span>
                      </div>
                    </div>
                    <div className="col-span-2 text-center font-mono text-[10px] text-slate-400">
                      {p.dnf ? '--' : p.position === 1 ? 'LÍDER' : `+${p.gapToNext.toFixed(3)}s`}
                    </div>
                    <div className="col-span-3 text-right font-mono text-[10px] font-bold text-white">
                      {p.dnf ? 'RETIRED' : p.position === 1 ? 'INTERVAL' : `+${p.gapToLeader.toFixed(3)}s`}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pit Wall Controls */}
            <div className="lg:col-span-4 space-y-4">
              <div className="glass p-6 rounded-[2.5rem] border-white/10 space-y-8">
                <section className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                      <Activity size={16} className="text-emerald-500" /> PIT WALL
                    </h4>
                    {grid.find(p => p.isUser)?.isPushing && <span className="text-[8px] bg-red-600 px-2 py-0.5 rounded font-black uppercase italic animate-pulse">Pushing</span>}
                  </div>
                  <TelemetryBar label="PNEUS" value={100 - (grid.find(p => p.isUser)?.tireWear || 0)} color={(grid.find(p => p.isUser)?.tireWear || 0) > 75 ? "bg-red-500" : "bg-emerald-500"} icon={<Gauge size={14} />} />
                  <TelemetryBar label="MOTOR" value={grid.find(p => p.isUser)?.engineCondition || 0} color="bg-orange-500" icon={<Thermometer size={14} />} />
                  <TelemetryBar label="ERS" value={userTeam.car.ers} color="bg-cyan-500" icon={<Zap size={14} />} />
                </section>

                <section className="pt-6 border-t border-white/5 space-y-6">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500">
                    <span>PIT STRATEGY</span>
                    <span className="text-emerald-400">NEXT: {nextTireCompound}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {[TireCompound.SOFT, TireCompound.MEDIUM, TireCompound.HARD, TireCompound.INTERMEDIATE, TireCompound.WET].map(t => (
                      <button key={t} onClick={() => setNextTireCompound(t)} className={`p-2 rounded-lg border transition-all flex flex-col items-center gap-1 ${nextTireCompound === t ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/5 bg-white/5 opacity-40'}`}>
                        <div className={`w-3 h-3 rounded-full ${getTireColor(t)}`} />
                        <span className="text-[7px] font-black uppercase">{t.slice(0, 3)}</span>
                      </button>
                    ))}
                  </div>
                  <button 
                    disabled={pitPending}
                    onClick={() => { setPitPending(true); playNotificationSFX(); }}
                    className={`w-full py-5 rounded-2xl font-black uppercase italic tracking-widest text-xs transition-all shadow-xl active:scale-95 ${pitPending ? 'bg-slate-800 text-slate-500' : 'bg-red-600 text-white hover:bg-red-500'}`}
                  >
                    {pitPending ? 'BOX CONFIRMADO' : 'SOLICITAR BOX'}
                  </button>
                </section>
              </div>
            </div>
          </div>
        )}

        {stage === 'RESULTS' && (
          <div className="max-w-2xl mx-auto py-12 text-center space-y-8 animate-slideUp">
             <div className="glass p-12 rounded-[3.5rem] border-white/10 space-y-8">
                <Flag size={64} className="mx-auto text-emerald-500" />
                <h3 className="font-heading text-4xl uppercase italic tracking-tighter text-white">BANDEIRA QUADRICULADA</h3>
                <p className="text-slate-400 italic text-sm leading-relaxed px-8">"{commentary}"</p>
                <button onClick={() => onFinish(finalResults, commentary, racePenalties)} className="w-full py-6 bg-white text-slate-950 rounded-[2rem] font-black uppercase italic text-xl shadow-2xl active:scale-95">
                  FINALIZAR SESSÃO
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

const TelemetryBar = ({ label, value, color, icon }: any) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-500">
      <span className="flex items-center gap-2">{icon} {label}</span>
      <span className="text-white font-mono font-bold">{value.toFixed(0)}%</span>
    </div>
    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
      <div className={`h-full ${color} transition-all duration-1000`} style={{ width: `${value}%` }} />
    </div>
  </div>
);

export default SimulationRoom;