
import React, { useState, useEffect } from 'react';
import { 
  GameState, 
  Team, 
  Category, 
  Driver, 
  RaceResult, 
  Penalty,
  UpgradeRecord,
  CarStats
} from '../types';
import { ENGINES, INITIAL_DRIVERS, TEAM_TEMPLATES, PENALTY_REASONS, UPGRADES, INITIAL_CAR_STATS, CALENDAR } from '../constants';
import { generatePenaltyReport } from '../services/geminiService';
import Dashboard from './Dashboard';
import DriverMarket from './DriverMarket';
import SimulationRoom from './SimulationRoom';
import Upgrades from './Upgrades';
import DevelopmentLog from './DevelopmentLog';
import { LayoutDashboard, Users, Zap, Play, History, ShieldAlert, LogOut, Wrench, Hammer, Calendar as CalendarIcon, Wind, ShieldCheck, Save, Trash2 } from 'lucide-react';

const SAVE_KEY = 'GP_STRATEGIST_SAVE_V1';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'drivers' | 'engines' | 'upgrades' | 'race' | 'history'>('dashboard');
  
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.isSetupComplete) return parsed;
      } catch (e) {
        console.error("Falha ao carregar jogo salvo:", e);
      }
    }

    return {
      userTeam: {} as Team,
      rivalTeams: [],
      currentRound: 1,
      isSetupComplete: false,
      history: []
    };
  });

  const [notification, setNotification] = useState<{title: string, msg: string, type: 'info' | 'error'} | null>(null);

  useEffect(() => {
    if (gameState.isSetupComplete) {
      localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
    }
  }, [gameState]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleFinishTeamSelection = (teamData: { name: string, color: string, finances: number, bonusType: string, logo?: string }) => {
    const userTeam: Team = {
      id: 'user_team_1',
      name: teamData.name,
      category: Category.F1,
      finances: teamData.finances,
      color: teamData.color,
      logo: teamData.logo,
      points: 0,
      car: { ...INITIAL_CAR_STATS },
      drivers: [INITIAL_DRIVERS[0], INITIAL_DRIVERS[2]],
      engine: ENGINES[1],
      penalties: [],
      upgrades: []
    };

    if (teamData.bonusType.includes('ERS')) userTeam.car.ers += 5;
    if (teamData.bonusType.includes('Reliability')) userTeam.car.reliability += 5;
    if (teamData.bonusType.includes('Aero')) userTeam.car.aero += 2;

    const selectedTemplate = TEAM_TEMPLATES.find(t => t.color === teamData.color);
    const rivalTemplates = TEAM_TEMPLATES.filter(t => t.id !== selectedTemplate?.id);

    const rivals: Team[] = rivalTemplates.map((template, idx) => ({
      id: `rival_${idx}`,
      name: template.name,
      category: Category.F1,
      finances: template.startingFinances,
      color: template.color,
      logo: template.logo,
      points: 0,
      car: { 
        power: 850 + Math.random() * 150, 
        aero: 75 + Math.random() * 25, 
        reliability: 70 + Math.random() * 30,
        ers: 40 + Math.random() * 30
      },
      drivers: [],
      engine: ENGINES[Math.floor(Math.random() * ENGINES.length)],
      penalties: [],
      upgrades: []
    }));

    setGameState({
      userTeam,
      rivalTeams: rivals,
      currentRound: 1,
      isSetupComplete: true,
      history: []
    });
  };

  const handleResetGame = () => {
    if (window.confirm("Tem certeza de que deseja resetar seu progresso?")) {
      localStorage.removeItem(SAVE_KEY);
      window.location.reload();
    }
  };

  const handleHireDriver = (driver: Driver) => {
    const cost = driver.salary;
    if (gameState.userTeam.finances >= cost) {
      setGameState(prev => ({
        ...prev,
        userTeam: {
          ...prev.userTeam,
          finances: prev.userTeam.finances - cost,
          drivers: prev.userTeam.drivers.length < 2 
            ? [...prev.userTeam.drivers, { ...driver }] 
            : [prev.userTeam.drivers[1], { ...driver }]
        }
      }));
      setNotification({ title: 'Nova Contratação!', msg: `${driver.name} juntou-se à equipe.`, type: 'info' });
    }
  };

  const handleRenewDriver = (driverId: string, years: number, cost: number) => {
    if (gameState.userTeam.finances >= cost) {
      setGameState(prev => ({
        ...prev,
        userTeam: {
          ...prev.userTeam,
          finances: prev.userTeam.finances - cost,
          drivers: prev.userTeam.drivers.map(d => 
            d.id === driverId ? { ...d, contractYears: d.contractYears + years } : d
          )
        }
      }));
      setNotification({ title: 'Contrato Estendido', msg: `Novo acordo de múltiplos anos assinado.`, type: 'info' });
    }
  };

  const handleSelectEngine = (engine: any) => {
    if (gameState.userTeam.finances >= engine.cost) {
      setGameState(prev => ({
        ...prev,
        userTeam: {
          ...prev.userTeam,
          finances: prev.userTeam.finances - engine.cost,
          engine: engine,
          car: { ...prev.userTeam.car, power: engine.power, reliability: engine.reliability }
        }
      }));
      setNotification({ title: 'Motor Trocado', msg: `Contrato assinado com a ${engine.brand}.`, type: 'info' });
    }
  };

  const handleUpgrade = (stat: keyof CarStats, cost: number) => {
    if (gameState.userTeam.finances >= cost) {
      const newUpgrade: UpgradeRecord = {
        id: Math.random().toString(36).substr(2, 9),
        stat,
        increment: UPGRADES[stat].increment,
        cost,
        timestamp: Date.now()
      };

      setGameState(prev => ({
        ...prev,
        userTeam: {
          ...prev.userTeam,
          finances: prev.userTeam.finances - cost,
          car: {
            ...prev.userTeam.car,
            [stat]: prev.userTeam.car[stat] + UPGRADES[stat].increment
          },
          upgrades: [newUpgrade, ...prev.userTeam.upgrades]
        }
      }));
    }
  };

  const handleRaceFinished = async (results: RaceResult[], aiCommentary: string) => {
    const userResult = results.find(r => r.teamId === gameState.userTeam.id);
    const earnedPoints = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1][(userResult?.position || 11) - 1] || 0;
    const prizeMoney = (20 - (userResult?.position || 20)) * 1000000 + 5000000;
    
    const currentTrack = CALENDAR[(gameState.currentRound - 1) % CALENDAR.length];

    let newPenalty: Penalty | null = null;
    if (Math.random() < 0.3) {
      const reason = PENALTY_REASONS[Math.floor(Math.random() * PENALTY_REASONS.length)];
      const report = await generatePenaltyReport(gameState.userTeam.name, reason);
      newPenalty = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'Decisão dos Comissários',
        pointsLost: 5,
        cost: 2000000,
        reason: report,
        timestamp: Date.now()
      };
    }

    setGameState(prev => {
      const updatedDrivers = prev.userTeam.drivers.map(d => ({
        ...d,
        contractYears: d.contractYears - 0.2
      })).filter(d => d.contractYears > 0);

      const departedAny = updatedDrivers.length < prev.userTeam.drivers.length;

      const updatedUserTeam = {
        ...prev.userTeam,
        points: prev.userTeam.points + Math.max(0, earnedPoints - (newPenalty?.pointsLost || 0)),
        finances: prev.userTeam.finances + prizeMoney - (newPenalty?.cost || 0),
        penalties: newPenalty ? [...prev.userTeam.penalties, newPenalty] : prev.userTeam.penalties,
        drivers: updatedDrivers
      };

      if (departedAny) {
        setTimeout(() => setNotification({ 
          title: 'Contrato Expirado', 
          msg: 'Um piloto deixou a equipe. Substituição imediata requerida!', 
          type: 'error' 
        }), 1000);
      }

      return {
        ...prev,
        userTeam: updatedUserTeam,
        currentRound: prev.currentRound + 1,
        history: [...prev.history, { round: prev.currentRound, trackName: currentTrack.name, results }]
      };
    });

    if (newPenalty) {
      setNotification({ title: 'PENALIDADE FIA', msg: newPenalty.reason, type: 'error' });
    } else {
      setNotification({ title: 'Corrida Concluída', msg: `Finalizou em P${userResult?.position}. Ganhou $${(prizeMoney/1000000).toFixed(1)}M.`, type: 'info' });
    }
    
    setActiveTab('dashboard');
  };

  const labels = {
    dashboard: 'Visão Geral',
    upgrades: 'P&D Melhorias',
    drivers: 'Mercado de Pilotos',
    engines: 'Loja de Motores',
    history: 'Histórico de Corridas',
    race: 'Final de Semana'
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0f172a] text-slate-100">
      <nav className="w-full lg:w-64 bg-slate-900 border-b lg:border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-4 lg:p-6 pb-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-red-600 p-1 rounded-lg shrink-0 flex items-center justify-center overflow-hidden w-8 h-8" style={{ backgroundColor: gameState.userTeam.color }}>
              {gameState.userTeam.logo ? (
                <img src={gameState.userTeam.logo} alt="" className="w-full h-full object-contain brightness-110" />
              ) : (
                <Zap size={18} className="text-white" />
              )}
            </div>
            <h1 className="text-lg font-black italic tracking-tighter uppercase truncate">{gameState.userTeam.name}</h1>
          </div>
          <div className="text-[9px] font-bold text-slate-500 tracking-widest uppercase flex items-center gap-2">
            Team Manager
            <span className="flex items-center gap-1 bg-slate-800 px-1 py-0.5 rounded text-emerald-500">
              <Save size={8} /> Auto
            </span>
          </div>
        </div>

        <div className="flex-1 px-2 space-y-0.5 py-4 overflow-y-auto lg:px-4">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={18} />} label={labels.dashboard} />
          <NavItem active={activeTab === 'upgrades'} onClick={() => setActiveTab('upgrades')} icon={<Wrench size={18} />} label={labels.upgrades} />
          <NavItem active={activeTab === 'drivers'} onClick={() => setActiveTab('drivers')} icon={<Users size={18} />} label={labels.drivers} />
          <NavItem active={activeTab === 'engines'} onClick={() => setActiveTab('engines')} icon={<Zap size={18} />} label={labels.engines} />
          <NavItem active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History size={18} />} label={labels.history} />
          
          <div className="pt-4 px-2">
            <button 
              onClick={() => setActiveTab('race')}
              disabled={gameState.userTeam.drivers.length === 0}
              className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg active:scale-95 text-sm ${gameState.userTeam.drivers.length === 0 ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50' : 'bg-red-600 hover:bg-red-500 text-white'}`}
              style={{ backgroundColor: activeTab === 'race' && gameState.userTeam.drivers.length > 0 ? gameState.userTeam.color : undefined }}
            >
              <Play fill="currentColor" size={16} />
              Próximo GP
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-950/50 border-t border-slate-800 hidden lg:block">
          <button 
            onClick={handleResetGame}
            className="w-full text-slate-500 hover:text-red-500 hover:bg-red-500/10 px-3 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-bold border border-transparent hover:border-red-500/20"
          >
            <Trash2 size={14} /> Resetar Jogo
          </button>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto relative p-4 lg:p-8">
        {notification && (
          <div className={`fixed top-4 right-4 z-50 p-3 rounded-xl border flex gap-3 items-start shadow-2xl animate-bounceIn max-w-[280px] lg:max-w-sm ${notification.type === 'error' ? 'bg-red-900 border-red-700 text-red-100' : 'bg-emerald-900 border-emerald-700 text-emerald-100'}`}>
            <ShieldAlert className="shrink-0" size={18} />
            <div>
              <h5 className="font-bold uppercase tracking-widest text-[9px] mb-0.5">{notification.title}</h5>
              <p className="text-xs opacity-90 leading-tight">{notification.msg}</p>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
             <div>
               <h1 className="text-2xl lg:text-3xl font-black uppercase italic tracking-tight">{labels[activeTab as keyof typeof labels]}</h1>
               <p className="text-slate-500 text-xs">Rumo ao título mundial da FIA.</p>
             </div>
             <div className="flex gap-2 w-full md:w-auto">
               <div className="flex-1 md:flex-none bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg">
                 <div className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Pts</div>
                 <div className="font-mono font-bold text-white text-sm">{gameState.userTeam.points}</div>
               </div>
               <div className="flex-1 md:flex-none bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg">
                 <div className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Saldo</div>
                 <div className="font-mono font-bold text-emerald-400 text-sm">${(gameState.userTeam.finances / 1000000).toFixed(1)}M</div>
               </div>
             </div>
          </div>

          <div className="min-h-[500px]">
            {activeTab === 'dashboard' && <Dashboard team={gameState.userTeam} />}
            {activeTab === 'upgrades' && <Upgrades team={gameState.userTeam} onUpgrade={handleUpgrade} />}
            {activeTab === 'drivers' && (
              <DriverMarket 
                currentDrivers={gameState.userTeam.drivers} 
                availableDrivers={INITIAL_DRIVERS} 
                finances={gameState.userTeam.finances} 
                onHire={handleHireDriver} 
                onRenew={handleRenewDriver}
              />
            )}
            {activeTab === 'engines' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                {ENGINES.map(engine => (
                  <div key={engine.id} className={`bg-slate-800 border p-4 rounded-2xl transition-all ${gameState.userTeam.engine.id === engine.id ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-700'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-slate-900 px-2 py-0.5 rounded text-[8px] font-bold text-slate-400 uppercase tracking-widest border border-slate-700">{engine.brand}</div>
                      <div className="text-lg font-black font-mono text-emerald-400">${(engine.cost/1000000).toFixed(0)}M</div>
                    </div>
                    <h3 className="text-md font-bold mb-2 truncate">{engine.name}</h3>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-700 text-center">
                        <div className="text-[8px] text-slate-500 uppercase font-bold">Potência</div>
                        <div className="text-sm font-black text-white">{engine.power} HP</div>
                      </div>
                      <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-700 text-center">
                        <div className="text-[8px] text-slate-500 uppercase font-bold">Conf.</div>
                        <div className="text-sm font-black text-white">{engine.reliability}%</div>
                      </div>
                    </div>
                    <button 
                      disabled={gameState.userTeam.finances < engine.cost || gameState.userTeam.engine.id === engine.id}
                      onClick={() => handleSelectEngine(engine)}
                      className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all ${gameState.userTeam.engine.id === engine.id ? 'bg-emerald-600 text-white cursor-default' : gameState.userTeam.finances < engine.cost ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-100 text-slate-900 hover:bg-white'}`}
                    >
                      {gameState.userTeam.engine.id === engine.id ? 'Ativo' : 'Contratar'}
                    </button>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'race' && (
              <SimulationRoom 
                userTeam={gameState.userTeam} 
                rivals={gameState.rivalTeams} 
                round={gameState.currentRound}
                onFinish={handleRaceFinished} 
              />
            )}
            {activeTab === 'history' && (
              <div className="space-y-8 animate-fadeIn pb-12">
                <section>
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <History className="text-blue-400" size={18} />
                    Resultados do Grand Prix
                  </h2>
                  {gameState.history.length === 0 ? (
                    <div className="text-center py-12 bg-slate-800/20 border border-slate-800 rounded-2xl text-slate-500 text-xs italic">Nenhuma corrida concluída ainda.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {gameState.history.map(h => (
                        <div key={h.round} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-4">
                          <h3 className="text-sm font-bold mb-3 flex justify-between items-center">
                            <span>Rodada {h.round}: {h.trackName}</span>
                            <span className="text-[8px] font-mono text-slate-500">FIA OFFICIAL</span>
                          </h3>
                          <div className="space-y-1.5">
                            {h.results.slice(0, 3).map(r => (
                              <div key={r.teamId} className={`flex justify-between p-2 rounded-lg border text-xs ${r.teamId === gameState.userTeam.id ? 'bg-red-900/20 border-red-500/50' : 'bg-slate-900/50 border-slate-800'}`}>
                                <span className="font-bold flex items-center gap-2">
                                  <span className={`w-4 h-4 rounded-sm flex items-center justify-center text-[8px] ${r.position === 1 ? 'bg-yellow-500 text-black' : 'bg-slate-700 text-slate-300'}`}>{r.position}</span>
                                  <span className="truncate w-24">{r.teamName}</span>
                                </span>
                                <span className="font-mono text-emerald-400">+{ [25, 18, 15][r.position - 1] || 0} pts</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section>
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Hammer className="text-emerald-400" size={18} />
                    Log de Desenvolvimento
                  </h2>
                  {/* Fix: Added missing 'penalties' prop required by DevelopmentLogProps */}
                  <DevelopmentLog upgrades={gameState.userTeam.upgrades} penalties={gameState.userTeam.penalties} />
                </section>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-bold text-xs ${active ? 'bg-slate-800 text-white border border-slate-700 shadow-sm' : 'text-slate-500 hover:text-white hover:bg-slate-800/50'}`}
  >
    {icon}
    <span className="truncate">{label}</span>
  </button>
);

export default App;
