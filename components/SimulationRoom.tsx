
import React, { useState, useEffect, useRef } from 'react';
import { Team, RaceResult, RaceStrategy, Weather, Track, Penalty, TireCompound } from '../types';
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

const SimulationRoom: React.FC<SimulationRoomProps> = ({ userTeam, rivals, round, onFinish }) => {
  const [stage, setStage] = useState<'IDLE' | 'SETUP' | 'QUALIFYING' | 'RACE' | 'RESULTS'>('IDLE');
  const [strategy, setStrategy] = useState<RaceStrategy>(RaceStrategy.BALANCED);
  const [tireCompound, setTireCompound] = useState<TireCompound>(TireCompound.MEDIUM);
  const [nextTireCompound, setNextTireCompound] = useState<TireCompound>(TireCompound.MEDIUM);
  const [isPaused, setIsPaused] = useState(false);
  const [currentLap, setCurrentLap] = useState(0);
  const [grid, setGrid] = useState<RaceResult[]>([]);
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
    
    // Tire multiplier
    let tireMult = 1.0;
    if (compound === TireCompound.SOFT) tireMult = 1.05;
    if (compound === TireCompound.HARD) tireMult = 0.95;

    // Strategy multiplier
    let stratMult = 1.0;
    if (strat === RaceStrategy.AGGRESSIVE) stratMult = 1.08;
    if (strat === RaceStrategy.CONSERVATIVE) stratMult = 0.92;

    // Wear penalty (cliff)
    let wearPenalty = 0;
    if (wear > 65) wearPenalty = (wear - 65) * 1.8;
    if (wear > 88) wearPenalty = 150; 

    // Engine integrity penalty
    let enginePenalty = engineCond < 35 ? (35 - engineCond) * 0.8 : 0;

    // Race Event Compression
    let eventMult = 1.0;
    if (raceEvent === 'SAFETY_CAR' || raceEvent === 'VSC') eventMult = 0.3;

    return ((base + driverAvg * 6) * tireMult * stratMult - wearPenalty - enginePenalty + (Math.random() * 20)) * eventMult;
  };

  const startRace = async () => {
    setLoading(true);
    playConfirmSFX();
    setStage('QUALIFYING');
    await new Promise(r => setTimeout(r, 1000));
    
    const initialTeams = [userTeam, ...rivals].map((t) => ({
      teamId: t.id,
      teamName: t.name,
      position: 0,
      performance: 0,
      commentary: 'Largada limpa.',
      currentGap: 0,
      tireWear: 0,
      engineCondition: t.engine.condition || 100,
      dnf: false
    }));

    setGrid(initialTeams.sort((a, b) => Math.random() - 0.5).map((t, i) => ({...t, position: i + 1})));
    setStage('RACE');
    playRaceStartSFX();
    setLoading(false);
    setCurrentLap(1);
    setNextTireCompound(TireCompound.MEDIUM); // Default next choice
  };

  useEffect(() => {
    if (stage === 'RACE' && !isPaused && currentLap <= currentTrack.laps) {
      raceInterval.current = window.setInterval(() => {
        setCurrentLap(prev => prev + 1);
        processLap();
      }, 1200);
    } else {
      if (raceInterval.current) clearInterval(raceInterval.current);
    }
    return () => { if (raceInterval.current) clearInterval(raceInterval.current); };
  }, [stage, isPaused, currentLap, raceEvent]);

  const processLap = () => {
    // Random Events Check
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

        const teamObj = [userTeam, ...rivals].find(t => t.id === team.teamId);
        if (!teamObj) return team;
        
        const isUser = team.teamId === userTeam.id;
        const currentCompound = isUser ? tireCompound : TireCompound.MEDIUM;
        const strat = isUser ? strategy : RaceStrategy.BALANCED;
        
        // Wear Calculation
        let lapWear = (raceEvent === 'SAFETY_CAR' || raceEvent === 'VSC') ? 0.3 : 1.0;
        if (currentCompound === TireCompound.SOFT) lapWear *= 2.2;
        if (currentCompound === TireCompound.HARD) lapWear *= 0.65;
        if (strat === RaceStrategy.AGGRESSIVE) lapWear *= 1.4;
        
        const newWear = Math.min(100, team.tireWear + lapWear);
        const engineDamage = (raceEvent === 'NORMAL' ? (Math.random() * 0.4) : 0.1) + (strat === RaceStrategy.AGGRESSIVE ? 0.2 : 0);
        const newEngineCond = Math.max(0, team.engineCondition - engineDamage);

        // DNF Risk
        if (newEngineCond < 15 && Math.random() < 0.08) {
          return { ...team, dnf: true, commentary: 'DNF: MOTOR' };
        }
        if (newWear > 92 && Math.random() < 0.12) {
          return { ...team, dnf: true, commentary: 'DNF: PNEU' };
        }

        let currentCommentary = '';
        let currentTireWear = newWear;
        let currentPerf = team.performance;

        // Pit Stop Execution
        if (isUser && pitPending) {
          const timeLost = (raceEvent === 'SAFETY_CAR' || raceEvent === 'VSC') ? 12 : 25;
          currentPerf -= timeLost;
          currentTireWear = 0;
          setTireCompound(nextTireCompound);
          setPitPending(false);
          currentCommentary = `Pit Stop: ${nextTireCompound}`;
        } else if (!isUser && team.tireWear > 75) {
          // AI Pit Strategy
          currentPerf -= 25;
          currentTireWear = 0;
          currentCommentary = 'Pit Stop (AI)';
        }

        const lapPerf = calculateLapPerformance(teamObj, strat, currentTireWear, currentCompound, newEngineCond);

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
        if (!t.dnf && !c && oldPos > (i + 1)) c = "ULTRAPASSAGEM";
        
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
    <div className="bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden animate-fadeIn max-w-5xl mx-auto shadow-2xl">
      {/* Race Header Status */}
      <div className={`p-6 border-b transition-colors duration-500 flex justify-between items-center backdrop-blur-md ${
        raceEvent === 'SAFETY_CAR' ? 'bg-yellow-600/90 border-yellow-500' :
        raceEvent === 'VSC' ? 'bg-yellow-600/60 border-yellow-500' :
        raceEvent === 'YELLOW_FLAG' ? 'bg-yellow-900/40 border-yellow-700' :
        'bg-slate-800/80 border-slate-700'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`${raceEvent !== 'NORMAL' ? 'bg-black text-yellow-400 animate-pulse' : 'bg-red-600 text-white'} p-2 rounded-xl shadow-lg`}>
            {raceEvent === 'SAFETY_CAR' ? <AlertTriangle size={24} /> : <Timer size={24} />}
          </div>
          <div>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">
              {stage === 'RACE' ? (
                <div className="flex items-center gap-3">
                  Volta {currentLap}/{currentTrack.laps}
                  {raceEvent !== 'NORMAL' && (
                    <span className="text-xs bg-black/40 px-2 py-0.5 rounded-full border border-yellow-500/50">
                      {raceEvent.replace('_', ' ')}
                    </span>
                  )}
                </div>
              ) : stage === 'IDLE' ? 'Estratégia Inicial' : 'Fim de Prova'}
            </h2>
            <p className="text-slate-300 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
              <Disc size={10} className={stage === 'RACE' && !isPaused ? 'animate-spin' : ''} /> {currentTrack.name} • {weather}
            </p>
          </div>
        </div>

        {stage === 'RACE' && (
          <div className="flex gap-2">
            <button onClick={() => setIsPaused(!isPaused)} className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all border border-white/5">
              {isPaused ? <Play size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />}
            </button>
          </div>
        )}
      </div>

      <div className="p-6 lg:p-8 min-h-[500px]">
        {stage === 'IDLE' && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-12">
            <img src={`https://flagsapi.com/${currentTrack.countryCode}/flat/64.png`} className="w-20 shadow-2xl rounded" />
            <div className="space-y-2">
              <h3 className="text-4xl font-black italic uppercase text-white">{currentTrack.country}</h3>
              <p className="text-slate-500 max-w-sm">Selecione o pneu de largada para {userTeam.name}.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
              {[
                { id: TireCompound.SOFT, name: 'Macio', color: 'bg-red-500', icon: '🔴', desc: 'Ataque inicial' },
                { id: TireCompound.MEDIUM, name: 'Médio', color: 'bg-yellow-500', icon: '🟡', desc: 'Versátil' },
                { id: TireCompound.HARD, name: 'Duro', color: 'bg-slate-100', icon: '⚪', desc: 'Resistência' }
              ].map(t => (
                <button 
                  key={t.id}
                  onClick={() => setTireCompound(t.id)}
                  className={`p-6 rounded-3xl border-2 transition-all text-left group ${tireCompound === t.id ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'}`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-2xl group-hover:scale-110 transition-transform">{t.icon}</span>
                    <div className={`w-4 h-4 rounded-full ${t.color} shadow-[0_0_10px_rgba(255,255,255,0.2)]`} />
                  </div>
                  <h4 className="text-sm font-black uppercase text-white tracking-widest">{t.name}</h4>
                  <p className="text-[10px] text-slate-500 mt-1 font-medium">{t.desc}</p>
                </button>
              ))}
            </div>

            <button onClick={startRace} className="px-12 py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-2xl uppercase italic tracking-widest shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-4">
              <Play size={24} fill="currentColor" /> Ir para o Grid
            </button>
          </div>
        )}

        {stage === 'RACE' && (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 space-y-4">
              <div className="bg-slate-950/40 rounded-3xl border border-slate-800 p-6 shadow-inner">
                <div className="grid grid-cols-12 text-[9px] font-black text-slate-600 uppercase tracking-widest pb-4 border-b border-slate-800/50 mb-4 px-2">
                  <div className="col-span-1">P</div>
                  <div className="col-span-6">Escuderia</div>
                  <div className="col-span-3 text-center">Status Pneu</div>
                  <div className="col-span-2 text-right">Gap</div>
                </div>
                <div className="space-y-1">
                  {grid.map((team, idx) => (
                    <div key={team.teamId} className={`grid grid-cols-12 items-center p-2.5 rounded-xl text-xs font-bold border transition-all ${team.teamId === userTeam.id ? 'bg-blue-600/20 border-blue-500/50 text-white scale-[1.02] shadow-lg' : team.dnf ? 'bg-red-950/20 opacity-50 border-red-900/30' : 'bg-slate-900/30 border-transparent text-slate-400'}`}>
                      <div className="col-span-1 font-black italic">{team.dnf ? 'DNF' : team.position}</div>
                      <div className="col-span-6 flex items-center gap-3">
                        <div className="w-1.5 h-5 rounded-full" style={{backgroundColor: team.teamId === userTeam.id ? userTeam.color : rivals.find(r => r.id === team.teamId)?.color}} />
                        <span className="truncate uppercase tracking-tighter">{team.teamName}</span>
                        {team.commentary && <span className="text-[8px] bg-white/10 text-white px-2 py-0.5 rounded-full border border-white/20 animate-pulse truncate max-w-[80px]">{team.commentary}</span>}
                      </div>
                      <div className="col-span-3 px-4">
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                           <div className={`h-full transition-all duration-700 ${team.tireWear > 70 ? 'bg-red-500' : team.tireWear > 40 ? 'bg-yellow-500' : 'bg-emerald-500'}`} style={{ width: `${team.tireWear}%` }} />
                        </div>
                      </div>
                      <div className="col-span-2 text-right font-mono text-[10px] text-slate-500">
                         {team.dnf ? '---' : team.position === 1 ? 'LÍDER' : `+${team.currentGap.toFixed(1)}s`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Commentary / Strategic Info */}
              <div className="bg-slate-800/30 border border-slate-700 p-4 rounded-2xl flex items-center gap-4">
                <Radio className="text-blue-400 shrink-0" size={18} />
                <p className="text-[10px] font-bold text-slate-300 uppercase italic">
                  {raceEvent === 'SAFETY_CAR' ? 'Direção de Prova: Carro de Segurança na pista. Velocidade reduzida.' : 
                   pitPending ? `Estratégia: Parada confirmada para a próxima volta. Novos pneus ${nextTireCompound}.` :
                   'Engenheiro: Monitorando o desgaste dos pneus e a temperatura do motor.'}
                </p>
              </div>
            </div>

            {/* Strategic Controls */}
            <div className="w-full lg:w-80 space-y-6">
               <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-[2.5rem] space-y-8 shadow-2xl">
                 <div>
                   <div className="flex items-center gap-2 mb-4">
                     <Flame className="text-orange-400" size={18} />
                     <h3 className="text-xs font-black uppercase tracking-widest text-white">Estratégia de Ritmo</h3>
                   </div>
                   <div className="grid grid-cols-1 gap-2">
                      {[
                        { id: RaceStrategy.AGGRESSIVE, label: 'Push (Agressivo)', icon: <FastForward size={14} />, color: 'border-red-500 bg-red-500/10 text-red-400' },
                        { id: RaceStrategy.BALANCED, label: 'Equilibrado', icon: <Scale size={14} />, color: 'border-blue-500 bg-blue-500/10 text-blue-400' },
                        { id: RaceStrategy.CONSERVATIVE, label: 'Poupando (Eco)', icon: <Shield size={14} />, color: 'border-emerald-500 bg-emerald-500/10 text-emerald-400' }
                      ].map(s => (
                        <button 
                          key={s.id} 
                          onClick={() => { setStrategy(s.id); playConfirmSFX(); }}
                          className={`w-full py-4 px-5 rounded-2xl border-2 flex items-center justify-between transition-all group ${strategy === s.id ? s.color : 'border-slate-800 text-slate-500 hover:border-slate-700'}`}
                        >
                           <span className="text-[10px] font-black uppercase italic tracking-tighter">{s.label}</span>
                           <div className="group-hover:scale-110 transition-transform">{s.icon}</div>
                        </button>
                      ))}
                   </div>
                 </div>

                 <div className="pt-6 border-t border-slate-700/50">
                    <div className="flex items-center gap-2 mb-4">
                      <Coffee className="text-emerald-400" size={18} />
                      <h3 className="text-xs font-black uppercase tracking-widest text-white">Menu de Pit Stop</h3>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {[
                        { id: TireCompound.SOFT, color: 'bg-red-500' },
                        { id: TireCompound.MEDIUM, color: 'bg-yellow-500' },
                        { id: TireCompound.HARD, color: 'bg-slate-100' }
                      ].map(t => (
                        <button 
                          key={t.id}
                          onClick={() => { setNextTireCompound(t.id); playConfirmSFX(); }}
                          className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${nextTireCompound === t.id ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-800 bg-slate-900/50'}`}
                        >
                          <div className={`w-3 h-3 rounded-full ${t.color} shadow-sm`} />
                          <span className="text-[8px] font-black text-white uppercase">{t.id}</span>
                        </button>
                      ))}
                    </div>

                    <button 
                      onClick={() => handleBoxBox(nextTireCompound)} 
                      disabled={pitPending} 
                      className={`w-full py-5 rounded-2xl font-black uppercase italic tracking-widest text-lg transition-all shadow-xl flex items-center justify-center gap-3 border-2 ${
                        pitPending ? 'bg-slate-800 text-slate-600 border-slate-700 cursor-not-allowed' : 
                        raceEvent === 'SAFETY_CAR' ? 'bg-white text-emerald-600 border-emerald-500 animate-pulse' :
                        'bg-white text-slate-900 border-white hover:bg-emerald-400 hover:text-white'
                      }`}
                    >
                      {pitPending ? 'RECOLHENDO...' : 'BOX BOX BOX'}
                    </button>
                    {raceEvent === 'SAFETY_CAR' && !pitPending && (
                      <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest mt-3 text-center animate-bounce">
                        Janela Ideal: Pit Stop sob SC!
                      </p>
                    )}
                 </div>
               </div>

               <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-[2rem] space-y-4 shadow-xl">
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                     <span className="uppercase">Saúde do Motor</span>
                     <div className="flex items-center gap-2">
                        <Thermometer size={14} className={grid.find(t => t.teamId === userTeam.id)?.engineCondition < 30 ? 'text-red-500 animate-pulse' : 'text-blue-400'} />
                        <span className="font-mono text-white">{grid.find(t => t.teamId === userTeam.id)?.engineCondition.toFixed(1)}%</span>
                     </div>
                  </div>
                  <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${grid.find(t => t.teamId === userTeam.id)?.engineCondition}%` }} />
                  </div>
               </div>
            </div>
          </div>
        )}

        {stage === 'RESULTS' && (
           <div className="max-w-3xl mx-auto space-y-8 animate-slideUp">
              <div className="bg-slate-800 border border-slate-700 p-10 rounded-[3rem] text-center space-y-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 via-emerald-500 to-blue-600" />
                
                <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] flex items-center justify-center mx-auto mb-2 text-emerald-500 shadow-xl">
                  <Flag size={40} />
                </div>
                
                <div>
                  <h3 className="text-4xl font-black italic uppercase text-white tracking-tighter mb-2">Grand Prix Encerrado</h3>
                  <p className="text-slate-400 italic text-sm leading-relaxed max-w-lg mx-auto">"{commentary}"</p>
                </div>
                
                {interview && (
                  <div className="bg-blue-600/5 border border-blue-500/20 p-8 rounded-[2.5rem] text-left relative group">
                    <div className="absolute -top-3 left-8 bg-blue-600 text-white px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
                      <Mic2 size={12} /> Exclusivo Band F1
                    </div>
                    <p className="text-sm font-medium text-slate-200 leading-relaxed italic pr-12">"{interview}"</p>
                    <div className="mt-6 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-400">
                        <Radio size={20} />
                      </div>
                      <div>
                        <div className="text-[10px] font-black uppercase text-white">Mariana Becker</div>
                        <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Paddock Live • São Paulo</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-6">
                  <button 
                    onClick={() => onFinish(grid, commentary, interview || undefined)}
                    className="w-full py-6 bg-white text-slate-900 rounded-2xl font-black uppercase italic tracking-widest text-xl hover:bg-emerald-400 hover:text-white transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-4"
                  >
                    Confirmar Weekend <ChevronRight size={24} />
                  </button>
                </div>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

const ChevronRight = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18l6-6-6-6" />
  </svg>
);

export default SimulationRoom;
