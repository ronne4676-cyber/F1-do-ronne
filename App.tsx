
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
} from './types';
import { ENGINES, INITIAL_DRIVERS, TEAM_TEMPLATES, PENALTY_REASONS, UPGRADES, INITIAL_CAR_STATS, CALENDAR, ALL_DRIVERS } from './constants';
import { generatePenaltyReport } from './services/geminiService';
import Dashboard from './components/Dashboard';
import DriverMarket from './components/DriverMarket';
import SimulationRoom from './components/SimulationRoom';
import Upgrades from './components/Upgrades';
import DevelopmentLog from './components/DevelopmentLog';
import TeamSelection from './components/TeamSelection';
import DataPackEditor from './components/DataPackEditor';
import { playConfirmSFX, playUpgradeSFX, playNotificationSFX } from './utils/audio';
// Fixed: Added Mic2 to the lucide-react imports list
import { LayoutDashboard, Users, Zap, Play, History, ShieldAlert, Wrench, Hammer, Save, Trash2, Database, Mic2 } from 'lucide-react';

const SAVE_KEY = 'GP_STRATEGIST_SAVE_V2';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'drivers' | 'engines' | 'upgrades' | 'race' | 'history' | 'datapack'>('dashboard');
  
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
      playNotificationSFX();
      const timer = setTimeout(() => setNotification(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleFinishTeamSelection = (teamData: { name: string, color: string, finances: number, bonusType: string, logo?: string }) => {
    const template = TEAM_TEMPLATES.find(t => t.color === teamData.color);
    const officialDrivers = template 
      ? ALL_DRIVERS.filter(d => template.driverIds?.includes(d.id))
      : [INITIAL_DRIVERS[0], INITIAL_DRIVERS[2]];

    const userTeam: Team = {
      id: 'user_team_1',
      name: teamData.name,
      category: Category.F1,
      finances: teamData.finances,
      color: teamData.color,
      logo: teamData.logo,
      points: 0,
      car: { ...INITIAL_CAR_STATS },
      drivers: officialDrivers.map(d => ({...d, contractYears: 1})),
      engine: { ...ENGINES[1], condition: 100 },
      penalties: [],
      upgrades: []
    };

    const rivalTemplates = TEAM_TEMPLATES.filter(t => t.id !== template?.id);
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
      drivers: ALL_DRIVERS.filter(d => template.driverIds?.includes(d.id)),
      engine: { ...ENGINES[Math.floor(Math.random() * ENGINES.length)], condition: 100 },
      penalties: [],
      upgrades: []
    }));

    playConfirmSFX();
    setGameState({
      userTeam,
      rivalTeams: rivals,
      currentRound: 1,
      isSetupComplete: true,
      history: []
    });
  };

  const handleUpdateDataPack = (updatedUser: Team, updatedRivals: Team[]) => {
    setGameState(prev => ({
      ...prev,
      userTeam: updatedUser,
      rivalTeams: updatedRivals
    }));
    setNotification({ title: 'Data Pack Atualizado', msg: 'Novos ativos visuais aplicados com sucesso.', type: 'info' });
  };

  const handleRaceFinished = async (results: RaceResult[], aiCommentary: string, interview?: string) => {
    const userResult = results.find(r => r.teamId === gameState.userTeam.id);
    const earnedPoints = userResult?.dnf ? 0 : ([25, 18, 15, 12, 10, 8, 6, 4, 2, 1][(userResult?.position || 11) - 1] || 0);
    const prizeMoney = userResult?.dnf ? 1000000 : ((20 - (userResult?.position || 20)) * 1000000 + 5000000);
    const payroll = gameState.userTeam.drivers.reduce((acc, d) => acc + (d.salary / 5), 0);
    
    setGameState(prev => ({
      ...prev,
      userTeam: {
        ...prev.userTeam,
        points: prev.userTeam.points + earnedPoints,
        finances: prev.userTeam.finances + prizeMoney - payroll,
        engine: { ...prev.userTeam.engine, condition: userResult?.engineCondition || prev.userTeam.engine.condition },
        drivers: prev.userTeam.drivers.map(d => ({ ...d, contractYears: Math.max(0, d.contractYears - 0.2) })).filter(d => d.contractYears > 0)
      },
      currentRound: prev.currentRound + 1,
      history: [...prev.history, { 
        round: prev.currentRound, 
        trackName: CALENDAR[(prev.currentRound - 1) % CALENDAR.length].name, 
        results,
        interview
      }]
    }));

    setNotification({ 
      title: userResult?.dnf ? 'Corrida Encerrada (DNF)' : 'Corrida Concluída', 
      msg: `P${userResult?.position}. Saldo: +$${((prizeMoney - payroll)/1000000).toFixed(1)}M.`, 
      type: userResult?.dnf ? 'error' : 'info' 
    });
    setActiveTab('dashboard');
  };

  const handleMaintenance = () => {
    const cost = 10000000;
    if (gameState.userTeam.finances >= cost) {
      setGameState(prev => ({
        ...prev,
        userTeam: {
          ...prev.userTeam,
          finances: prev.userTeam.finances - cost,
          engine: { ...prev.userTeam.engine, condition: 100 }
        }
      }));
      setNotification({ title: 'Revisão Concluída', msg: 'O motor foi restaurado para 100% de integridade.', type: 'info' });
    }
  };

  if (!gameState.isSetupComplete) {
    return <TeamSelection onSelect={handleFinishTeamSelection} />;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0f172a] text-slate-100">
      <nav className="w-full lg:w-64 bg-slate-900 border-b lg:border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-4 lg:p-6 pb-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-red-600 p-1 rounded-lg shrink-0 flex items-center justify-center overflow-hidden w-8 h-8" style={{ backgroundColor: gameState.userTeam.color }}>
              {gameState.userTeam.logo ? <img src={gameState.userTeam.logo} className="w-full h-full object-contain" /> : <Zap size={18} className="text-white" />}
            </div>
            <h1 className="text-lg font-black italic tracking-tighter uppercase truncate">{gameState.userTeam.name}</h1>
          </div>
          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Team Manager Edition</p>
        </div>

        <div className="flex-1 px-2 space-y-0.5 py-4 overflow-y-auto lg:px-4">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={18} />} label="Dashboard" />
          <NavItem active={activeTab === 'upgrades'} onClick={() => setActiveTab('upgrades')} icon={<Wrench size={18} />} label="P&D" />
          <NavItem active={activeTab === 'drivers'} onClick={() => setActiveTab('drivers')} icon={<Users size={18} />} label="Mercado" />
          <NavItem active={activeTab === 'datapack'} onClick={() => setActiveTab('datapack')} icon={<Database size={18} />} label="Data Pack" />
          <NavItem active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History size={18} />} label="Histórico" />
          
          <div className="pt-4 px-2">
            <button 
              onClick={() => setActiveTab('race')}
              disabled={gameState.userTeam.drivers.length === 0}
              className="w-full py-3 bg-red-600 hover:bg-red-500 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg active:scale-95 text-sm"
            >
              <Play fill="currentColor" size={16} /> Próximo GP
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-950/50 border-t border-slate-800">
          <button onClick={() => { localStorage.removeItem(SAVE_KEY); window.location.reload(); }} className="w-full text-slate-500 hover:text-red-500 px-3 py-2 rounded-lg transition-all flex items-center gap-2 text-[10px] font-bold">
            <Trash2 size={12} /> Resetar Jogo
          </button>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto p-4 lg:p-8">
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
          <div className="flex justify-between items-end">
             <div>
               <h1 className="text-2xl lg:text-3xl font-black uppercase italic tracking-tight">
                 {activeTab === 'dashboard' ? 'Visão Geral' : activeTab === 'datapack' ? 'Editor de Ativos' : 'Estrategista GP'}
               </h1>
               <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Sincronizado com FIA Data Center</p>
               </div>
             </div>
             <div className="flex gap-2">
               <div className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl">
                 <div className="text-[8px] text-slate-500 uppercase font-black">Motor</div>
                 <div className={`font-mono font-bold text-xs ${gameState.userTeam.engine.condition < 40 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>
                   {gameState.userTeam.engine.condition.toFixed(0)}%
                 </div>
               </div>
               <div className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl">
                 <div className="text-[8px] text-slate-500 uppercase font-black">Finanças</div>
                 <div className="font-mono font-bold text-emerald-400 text-xs">
                   ${(gameState.userTeam.finances / 1000000).toFixed(1)}M
                 </div>
               </div>
             </div>
          </div>

          <div className="min-h-[500px]">
            {activeTab === 'dashboard' && <Dashboard team={gameState.userTeam} />}
            {activeTab === 'upgrades' && <Upgrades team={gameState.userTeam} onUpgrade={(s, c) => {}} />}
            {activeTab === 'drivers' && (
              <DriverMarket 
                currentDrivers={gameState.userTeam.drivers} 
                availableDrivers={ALL_DRIVERS} 
                finances={gameState.userTeam.finances} 
                onHire={() => {}} 
                onRenew={() => {}}
              />
            )}
            {activeTab === 'datapack' && (
              <DataPackEditor userTeam={gameState.userTeam} rivals={gameState.rivalTeams} onUpdate={handleUpdateDataPack} />
            )}
            {activeTab === 'race' && (
              <SimulationRoom userTeam={gameState.userTeam} rivals={gameState.rivalTeams} round={gameState.currentRound} onFinish={handleRaceFinished} />
            )}
            {activeTab === 'history' && (
              <div className="space-y-6 animate-fadeIn">
                 {gameState.history.length === 0 ? (
                   <div className="text-center py-20 text-slate-600 italic">Nenhum dado de corrida registrado.</div>
                 ) : (
                   gameState.history.map((h, i) => (
                     <div key={i} className="bg-slate-800/40 border border-slate-800 rounded-3xl p-6">
                        <div className="flex justify-between items-center mb-4">
                           <h3 className="text-lg font-black uppercase italic text-white">GP de {h.trackName}</h3>
                           <span className="text-[10px] font-black text-slate-500 uppercase">Rodada {h.round}</span>
                        </div>
                        {h.interview && (
                          <div className="bg-blue-900/10 border-l-4 border-blue-500 p-4 rounded-r-xl mb-4 italic text-xs text-slate-300">
                             <div className="flex items-center gap-2 mb-1 text-blue-400 not-italic font-black text-[9px]">
                               <Mic2 size={12} /> ENTREVISTA PÓS-RACE
                             </div>
                             "{h.interview}"
                          </div>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                           {h.results.slice(0, 5).map(r => (
                             <div key={r.teamId} className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                                <div className="text-[10px] font-black text-slate-500">P{r.position}</div>
                                <div className="text-xs font-bold text-white truncate">{r.teamName}</div>
                             </div>
                           ))}
                        </div>
                     </div>
                   ))
                 )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-bold text-xs ${active ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-500 hover:text-white hover:bg-slate-800/50'}`}>
    {icon} <span>{label}</span>
  </button>
);

export default App;
