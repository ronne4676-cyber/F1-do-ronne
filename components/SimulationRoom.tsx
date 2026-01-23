
import React, { useState, useEffect, useRef } from 'react';
import { Team, RaceResult, RaceStrategy, Weather, Track, Penalty, TireCompound, Driver } from '../types';
import { CALENDAR } from '../constants';
import { generateRaceCommentary, conductBandInterview } from '../services/geminiService';
import { playConfirmSFX, playRaceStartSFX, playNotificationSFX } from '../utils/audio';
import { Play, Flag, Timer, Flame, Scale, Shield, Activity, Sun, Cloud, CloudRain, Zap as StormIcon, Coffee, Pause, Disc, Mic2, Thermometer, Radio, AlertTriangle, FastForward } from 'lucide-react';

interface SimulationRoomProps {
  userTeam: Team;
  rivals: Team[];
  round: number;
  onFinish: (results: RaceResult[], commentary: string, interview?: string) => void;
}

type RaceEvent = 'NORMAL' | 'SAFETY_CAR' | 'VSC' | 'YELLOW_FLAG';

interface ExtendedRaceResult extends RaceResult {
  drivers: Driver[];
}

const SimulationRoom: React.FC<SimulationRoomProps> = ({ userTeam, rivals, round, onFinish }) => {
  const [stage, setStage] = useState<'IDLE' | 'SETUP' | 'QUALIFYING' | 'RACE' | 'RESULTS'>('IDLE');
  const [strategy, setStrategy] = useState<RaceStrategy>(RaceStrategy.BALANCED);
  const [tireCompound, setTireCompound] = useState<TireCompound>(TireCompound.MEDIUM);
  const [nextTireCompound, setNextTireCompound] = useState<TireCompound>(TireCompound.MEDIUM);
  const [isPaused, setIsPaused] = useState(false);
  const [currentLap, setCurrentLap] = useState(0);
  const [grid, setGrid] = useState<ExtendedRaceResult[]>([]);
  const [commentary, setCommentary] = useState<string>('Aguardando sinal verde...');
  const [interview, setInterview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pitPending, setPitPending] = useState(false);
  const [raceEvent, setRaceEvent] = useState<RaceEvent>('NORMAL');
  const [eventLapsRemaining, setEventLapsRemaining] = useState(0);
  
  const currentTrack: Track = CALENDAR[(round - 1) % CALENDAR.length];
  const raceInterval = useRef<number | null>(null);

  const [weather] = useState<Weather>(() => {
    const roll = Math.random();
    if (roll < 0.5) return Weather.SUNNY;
    if (roll < 0.75) return Weather.CLOUDY;
    if (roll < 0.9) return Weather.RAIN;
    return Weather.STORM;
  });

  const calculateLapPerformance = (team: Team, strat: RaceStrategy, wear: number, compound: TireCompound, engineCond: number) => {
    const stats = team.car;
    const driverAvg = team.drivers.reduce((acc, d) => acc + d.ovr, 0) / (team.drivers.length || 1);
    
    let base = (stats.power * 0.4) + (stats.aero * 4.0) + (stats.ers * 1.5);
    
    let tireMult = 1.0;
    if (compound === TireCompound.SOFT) tireMult = 1.05;
    if (compound === TireCompound.HARD) tireMult = 0.95;

    let stratMult = 1.0;
    if (strat === RaceStrategy.AGGRESSIVE) stratMult = 1.08;
    if (strat === RaceStrategy.CONSERVATIVE) stratMult = 0.92;

    let wearPenalty = 0;
    if (wear > 65) wearPenalty = (wear - 65) * 1.8;
    if (wear > 88) wearPenalty = 150; 

    let enginePenalty = engineCond < 35 ? (35 - engineCond) * 0.8 : 0;

    let eventMult = 1.0;
    if (raceEvent === 'SAFETY_CAR' || raceEvent === 'VSC') eventMult = 0.3;

    return ((base + driverAvg * 6) * tireMult * stratMult - wearPenalty - enginePenalty + (Math.random() * 20)) * eventMult;
  };

  const startRace = async () => {
    setLoading(true);
    playConfirmSFX();
    setStage('QUALIFYING');
    await new Promise(r => setTimeout(r, 1000));
    
    const initialTeams: ExtendedRaceResult[] = [userTeam, ...rivals].map((t) => ({
      teamId: t.id,
      teamName: t.name,
      position: 0,
      performance: 0,
      commentary: 'Largada.',
      currentGap: 0,
      tireWear: 0,
      engineCondition: t.engine.condition || 100,
      dnf: false,
      drivers: t.drivers
    }));

    setGrid(initialTeams.sort((a, b) => Math.random() - 0.5).map((t, i) => ({...t, position: i + 1})));
    setStage('RACE');
    playRaceStartSFX();
    setLoading(false);
    setCurrentLap(1);
    setNextTireCompound(TireCompound.MEDIUM);
  };

  useEffect(() => {
    if (stage === 'RACE' && !isPaused && currentLap <= currentTrack.laps) {
      raceInterval.current = window.setInterval(() => {
        setCurrentLap(prev => prev + 1);
        processLap();
      }, 1000);
    } else {
      if (raceInterval.current) clearInterval(raceInterval.current);
    }
    return () => { if (raceInterval.current) clearInterval(raceInterval.current); };
  }, [stage, isPaused, currentLap, raceEvent]);

  const processLap = () => {
    if (raceEvent === 'NORMAL' && Math.random() < 0.04) {
      const roll = Math.random();
      if (roll < 0.4) {
        setRaceEvent('VSC');
        setEventLapsRemaining(2);
        playNotificationSFX();
      } else if (roll < 0.7) {
        setRaceEvent('SAFETY_CAR');
        setEventLapsRemaining(3);
        playNotificationSFX();
      } else {
        setRaceEvent('YELLOW_FLAG');
        setEventLapsRemaining(1);
      }
    } else if (eventLapsRemaining > 0) {
      setEventLapsRemaining(prev => prev - 1);
    } else if (raceEvent !== 'NORMAL') {
      setRaceEvent('NORMAL');
    }

    setGrid(prevGrid => {
      const newGrid = prevGrid.map(team => {
        if (team.dnf) return team;

        const teamData = [userTeam, ...rivals].find(t => t.id === team.teamId);
        if (!teamData) return team;
        
        const isUser = team.teamId === userTeam.id;
        const currentCompound = isUser ? tireCompound : TireCompound.MEDIUM;
        const strat = isUser ? strategy : RaceStrategy.BALANCED;
        
        let lapWear = (raceEvent === 'SAFETY_CAR' || raceEvent === 'VSC') ? 0.3 : 1.0;
        if (currentCompound === TireCompound.SOFT) lapWear *= 2.2;
        if (currentCompound === TireCompound.HARD) lapWear *= 0.65;
        if (strat === RaceStrategy.AGGRESSIVE) lapWear *= 1.4;
        
        const newWear = Math.min(100, team.tireWear + lapWear);
        const engineDamage = (raceEvent === 'NORMAL' ? (Math.random() * 0.4) : 0.1) + (strat === RaceStrategy.AGGRESSIVE ? 0.2 : 0);
        const newEngineCond = Math.max(0, team.engineCondition - engineDamage);

        if (newEngineCond < 15 && Math.random() < 0.08) {
          return { ...team, dnf: true, commentary: 'DNF MOTOR' };
        }
        if (newWear > 92 && Math.random() < 0.12) {
          return { ...team, dnf: true, commentary: 'DNF PNEU' };
        }

        let currentCommentary = '';
        let currentTireWear = newWear;
        let currentPerf = team.performance;

        if (isUser && pitPending) {
          const timeLost = (raceEvent === 'SAFETY_CAR' || raceEvent === 'VSC') ? 12 : 25;
          currentPerf -= timeLost;
          currentTireWear = 0;
          setTireCompound(nextTireCompound);
          setPitPending(false);
          currentCommentary = `Pit Stop Done`;
        } else if (!isUser && team.tireWear > 75) {
          currentPerf -= 25;
          currentTireWear = 0;
          currentCommentary = 'Pit In';
        }

        const lapPerf = calculateLapPerformance(teamData, strat, currentTireWear, currentCompound, newEngineCond);

        return { 
          ...team, 
          performance: currentPerf + lapPerf, 
          tireWear: currentTireWear, 
          engineCondition: newEngineCond,
          commentary: currentCommentary 
        };
      });

      const sorted = [...newGrid].sort((a, b) => {
        if (a.dnf && !b.dnf) return 1;
        if (!a.dnf && b.dnf) return -1;
        return b.performance - a.performance;
      });
      
      return sorted.map((t, i) => {
        const oldPos = prevGrid.find(p => p.teamId === t.teamId)?.position || 0;
        let c = t.commentary;
        if (!t.dnf && !c && oldPos > (i + 1)) c = "GAP CLOSE";
        
        return {
          ...t, 
          position: i + 1,
          commentary: c,
          currentGap: i === 0 ? 0 : (sorted[0].performance - t.performance)
        };
      });
    });

    if (currentLap >= currentTrack.laps) {
      finishRace();
    }
  };

  const finishRace = async () => {
    setStage('RESULTS');
    const comm = await generateRaceCommentary(grid, userTeam.name);
    setCommentary(comm);
    const int = await conductBandInterview(grid, userTeam);
    setInterview(int);
  };

  const handleBoxBox = (compound: TireCompound) => {
    setNextTireCompound(compound);
    setPitPending(true);
    playConfirmSFX();
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden animate-fadeIn max-w-5xl mx-auto shadow-2xl">
      <div className={`p-4 lg:p-6 border-b flex justify-between items-center ${
        raceEvent === 'SAFETY_CAR' ? 'bg-yellow-600 border-yellow-500' :
        raceEvent === 'VSC' ? 'bg-yellow-600/60 border-yellow-500' :
        'bg-slate-800/80 border-slate-700'
      }`}>
        <div className="flex items-center gap-3">
          <div className="bg-red-600 p-1.5 rounded-lg">
            <Timer size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm lg:text-lg font-black italic uppercase text-white">
              {stage === 'RACE' ? `VOLTA ${currentLap}/${currentTrack.laps}` : 'PIT WALL'}
            </h2>
            <p className="text-[8px] lg:text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              {currentTrack.name} • {weather}
            </p>
          </div>
        </div>
        {stage === 'RACE' && (
          <button onClick={() => setIsPaused(!isPaused)} className="p-2 bg-white/10 rounded-lg text-white">
            {isPaused ? <Play size={14} fill="currentColor" /> : <Pause size={14} fill="currentColor" />}
          </button>
        )}
      </div>

      <div className="p-3 lg:p-6 min-h-[400px]">
        {stage === 'IDLE' && (
          <div className="flex flex-col items-center justify-center py-10 space-y-6 text-center">
            <img src={`https://flagsapi.com/${currentTrack.countryCode}/flat/64.png`} className="w-16 rounded shadow-lg" />
            <h3 className="text-3xl font-black italic uppercase text-white">{currentTrack.country}</h3>
            <div className="grid grid-cols-3 gap-2 w-full max-w-md">
              {[TireCompound.SOFT, TireCompound.MEDIUM, TireCompound.HARD].map(t => (
                <button key={t} onClick={() => setTireCompound(t)} className={`p-4 rounded-xl border-2 ${tireCompound === t ? 'border-white bg-white/10' : 'border-slate-800'}`}>
                  <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${t === TireCompound.SOFT ? 'bg-red-500' : t === TireCompound.MEDIUM ? 'bg-yellow-500' : 'bg-slate-300'}`} />
                  <span className="text-[9px] font-black uppercase text-white">{t}</span>
                </button>
              ))}
            </div>
            <button onClick={startRace} className="w-full max-w-xs py-4 bg-emerald-600 text-white rounded-xl font-black uppercase italic tracking-widest shadow-xl">
              Iniciar Largada
            </button>
          </div>
        )}

        {stage === 'RACE' && (
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 space-y-3">
              <div className="bg-slate-950/40 rounded-xl border border-slate-800 overflow-hidden">
                <div className="grid grid-cols-12 text-[7px] font-black text-slate-500 uppercase tracking-widest p-2 bg-slate-900/50">
                  <div className="col-span-1">P</div>
                  <div className="col-span-8">Pilotos / Escuderia</div>
                  <div className="col-span-3 text-right">Intervalo</div>
                </div>
                <div className="divide-y divide-slate-800/50">
                  {grid.map((team, idx) => (
                    <div key={team.teamId} className={`grid grid-cols-12 items-center p-2 text-[10px] ${team.teamId === userTeam.id ? 'bg-blue-600/10' : ''}`}>
                      <div className="col-span-1 font-black text-slate-400">{team.dnf ? 'DNF' : team.position}</div>
                      <div className="col-span-8 flex items-center gap-2">
                        <div className="w-1 h-6 rounded-full" style={{backgroundColor: team.teamId === userTeam.id ? userTeam.color : rivals.find(r => r.id === team.teamId)?.color}} />
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="font-black text-white uppercase truncate text-[9px]">
                              {team.drivers[0]?.name.split(' ').pop()} 
                              <span className="text-slate-500 ml-1">/ {team.drivers[1]?.name.split(' ').pop()}</span>
                            </span>
                          </div>
                          <span className="text-[7px] text-slate-500 font-bold uppercase truncate">{team.teamName}</span>
                        </div>
                        {team.commentary && <span className="text-[6px] bg-white/5 text-blue-400 px-1 rounded border border-blue-500/20 animate-pulse">{team.commentary}</span>}
                      </div>
                      <div className="col-span-3 text-right font-mono text-[9px] text-slate-400">
                        {team.dnf ? '---' : team.position === 1 ? 'LÍDER' : `+${team.currentGap.toFixed(1)}s`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:w-72 space-y-3">
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 space-y-4">
                <div className="flex gap-2">
                  {[RaceStrategy.AGGRESSIVE, RaceStrategy.BALANCED, RaceStrategy.CONSERVATIVE].map(s => (
                    <button key={s} onClick={() => setStrategy(s)} className={`flex-1 p-2 rounded-lg text-[8px] font-black uppercase border-2 transition-all ${strategy === s ? 'bg-blue-600 border-white text-white' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                      {s.slice(0, 4)}
                    </button>
                  ))}
                </div>
                
                <div className="pt-2 border-t border-slate-700/50">
                  <div className="grid grid-cols-3 gap-1 mb-2">
                    {[TireCompound.SOFT, TireCompound.MEDIUM, TireCompound.HARD].map(t => (
                      <button key={t} onClick={() => setNextTireCompound(t)} className={`p-2 rounded-lg border-2 text-[8px] font-black ${nextTireCompound === t ? 'border-emerald-500 bg-emerald-500/10 text-white' : 'border-slate-900 bg-slate-950 text-slate-600'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => handleBoxBox(nextTireCompound)} disabled={pitPending} className={`w-full py-3 rounded-lg font-black uppercase text-xs shadow-lg ${pitPending ? 'bg-slate-700 text-slate-500' : 'bg-white text-slate-950 hover:bg-emerald-400'}`}>
                    {pitPending ? 'PIT IN...' : 'BOX BOX BOX'}
                  </button>
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                 <div className="flex items-center gap-2">
                   <Thermometer size={12} className="text-blue-400" />
                   <span className="text-[9px] font-black text-slate-400 uppercase">Engine</span>
                 </div>
                 <span className="font-mono text-[10px] text-white">{grid.find(t => t.teamId === userTeam.id)?.engineCondition.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        )}

        {stage === 'RESULTS' && (
           <div className="max-w-2xl mx-auto py-10 space-y-6 text-center animate-slideUp">
              <div className="bg-slate-800 border border-slate-700 p-8 rounded-3xl space-y-6 shadow-2xl">
                <Flag size={32} className="mx-auto text-emerald-500" />
                <h3 className="text-2xl font-black italic uppercase text-white">Bandeira Quadriculada</h3>
                <p className="text-slate-400 text-xs italic px-4">"{commentary}"</p>
                
                {interview && (
                  <div className="bg-blue-900/10 border-l-4 border-blue-500 p-4 rounded-r-xl text-left">
                    <p className="text-[10px] text-slate-300 leading-relaxed italic">"{interview}"</p>
                    <p className="text-[8px] font-black text-blue-400 mt-2 uppercase tracking-widest">Mariana Becker • Band F1</p>
                  </div>
                )}

                <button onClick={() => onFinish(grid, commentary, interview || undefined)} className="w-full py-4 bg-white text-slate-950 rounded-xl font-black uppercase italic tracking-widest text-sm shadow-xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-3">
                  Confirmar Resultados <ArrowRight size={18} />
                </button>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

const ArrowRight = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

export default SimulationRoom;
