
import React, { useState, useEffect } from 'react';
import { GameState, Team, Category, RaceResult, Driver, Penalty } from '../types';
import { ENGINES, INITIAL_DRIVERS, TEAM_TEMPLATES, UPGRADES, CALENDAR, ALL_DRIVERS, INITIAL_CAR_STATS } from '../constants';
import Dashboard from './Dashboard';
import DriverMarket from './DriverMarket';
import SimulationRoom from './SimulationRoom';
import Upgrades from './Upgrades';
import TeamSelection from './TeamSelection';
import DataPackEditor from './DataPackEditor';
import CarVisualizer from './CarVisualizer';
import { playConfirmSFX, playNotificationSFX } from '../utils/audio';
import { LayoutDashboard, Users, Zap, Play, History, Wrench, Database, LogOut, Sparkles, Save, ShieldAlert, ChevronRight, Gavel } from 'lucide-react';

const SAVE_KEY = 'GP_STRATEGIST_SAVE_V3';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'drivers' | 'upgrades' | 'race' | 'history' | 'datapack' | 'stewards'>('dashboard');
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [maxDrivers, setMaxDrivers] = useState(2);
  
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.isSetupComplete) return parsed;
      } catch (e) { console.error(e); }
    }
    return { userTeam: {} as Team, rivalTeams: [], currentRound: 1, isSetupComplete: false, history: [] };
  });

  const [notification, setNotification] = useState<{title: string, msg: string, type: 'info' | 'error'} | null>(null);

  useEffect(() => {
    if (gameState.isSetupComplete) {
      localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
      const rgb = hexToRgb(gameState.userTeam.color || '#ef4444');
      if (rgb) document.documentElement.style.setProperty('--team-color-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
      
      const savedMode = localStorage.getItem('GP_MAX_DRIVERS');
      if(savedMode) setMaxDrivers(parseInt(savedMode));
    }
  }, [gameState]);

  function hexToRgb(hex: string) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
  }

  const handleFinishTeamSelection = (teamData: { name: string, color: string, finances: number, logo?: string, singleDriverMode: boolean }) => {
    const template = TEAM_TEMPLATES.find(t => t.color === teamData.color);
    let officialDrivers = template 
      ? ALL_DRIVERS.filter(d => template.driverIds?.includes(d.id))
      : [ALL_DRIVERS[0], ALL_DRIVERS[1]];

    if (teamData.singleDriverMode) {
      officialDrivers = [officialDrivers[0]];
      setMaxDrivers(1);
      localStorage.setItem('GP_MAX_DRIVERS', '1');
    } else {
      setMaxDrivers(2);
      localStorage.setItem('GP_MAX_DRIVERS', '2');
    }

    const userTeam: Team = {
      id: 'user_team',
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

    const rivals: Team[] = TEAM_TEMPLATES.filter(t => t.id !== template?.id).map((t, idx) => ({
      id: `rival_${idx}`,
      name: t.name,
      category: Category.F1,
      finances: t.startingFinances,
      color: t.color, logo: t.logo, points: 0,
      car: { power: 920, aero: 85, reliability: 80, ers: 50 },
      drivers: ALL_DRIVERS.filter(d => t.driverIds?.includes(d.id)).map(d => ({...d, contractYears: 1})),
      engine: { ...ENGINES[0], condition: 100 },
      penalties: [], upgrades: []
    }));

    setGameState({ userTeam, rivalTeams: rivals, currentRound: 1, isSetupComplete: true, history: [] });
    setShowLaunchModal(true);
  };

  const handleHireDriver = (driver: Driver) => {
    if (gameState.userTeam.drivers.length >= maxDrivers) return;
    const bonus = driver.salary * 0.2;
    setGameState(prev => ({
      ...prev,
      userTeam: {
        ...prev.userTeam,
        finances: prev.userTeam.finances - bonus,
        drivers: [...prev.userTeam.drivers, { ...driver, contractYears: 1 }]
      }
    }));
    playConfirmSFX();
    setNotification({ title: 'Contratação Concluída', msg: `${driver.name} assinou com a equipe.`, type: 'info' });
  };

  const handleFireDriver = (driverId: string) => {
    const driver = gameState.userTeam.drivers.find(d => d.id === driverId);
    if (!driver) return;
    const penalty = driver.salary * 0.25;
    setGameState(prev => ({
      ...prev,
      userTeam: {
        ...prev.userTeam,
        finances: prev.userTeam.finances - penalty,
        drivers: prev.userTeam.drivers.filter(d => d.id !== driverId)
      }
    }));
    setNotification({ title: 'Vínculo Encerrado', msg: `Multa de rescisão: ${penalty / 1000000}M aplicada.`, type: 'error' });
  };

  const handleRenewDriver = (driverId: string, years: number, cost: number) => {
    setGameState(prev => ({
      ...prev,
      userTeam: {
        ...prev.userTeam,
        finances: prev.userTeam.finances - cost,
        drivers: prev.userTeam.drivers.map(d => d.id === driverId ? { ...d, contractYears: d.contractYears + years } : d)
      }
    }));
    setNotification({ title: 'Contrato Renovado', msg: 'Papéis assinados com sucesso.', type: 'info' });
  };

  const handleBackToMenu = () => {
    if (confirm("Resetar carreira atual?")) {
      localStorage.removeItem(SAVE_KEY);
      localStorage.removeItem('GP_MAX_DRIVERS');
      window.location.reload();
    }
  };

  const handleResolvePenalty = (penaltyId: string, choice: 'FINE' | 'POINTS') => {
    const penalty = gameState.userTeam.penalties.find(p => p.id === penaltyId);
    if (!penalty) return;

    setGameState(prev => {
      const updatedUser = { ...prev.userTeam };
      if (choice === 'FINE') updatedUser.finances -= penalty.cost;
      else updatedUser.points = Math.max(0, updatedUser.points - penalty.pointsLost);
      
      updatedUser.penalties = updatedUser.penalties.map(p => 
        p.id === penaltyId ? { ...p, isResolved: true } : p
      );

      return { ...prev, userTeam: updatedUser };
    });

    playConfirmSFX();
    setNotification({ title: 'Sanção Resolvida', msg: choice === 'FINE' ? 'Multa paga à FIA.' : 'Pontos deduzidos do campeonato.', type: 'info' });
  };

  const handleRaceFinished = async (results: RaceResult[], commentary: string, newPenalties: Penalty[]) => {
     const userResult = results.find(r => r.teamId === gameState.userTeam.id);
     
     setGameState(prev => ({
        ...prev,
        userTeam: {
          ...prev.userTeam,
          penalties: [...prev.userTeam.penalties, ...newPenalties]
        },
        currentRound: prev.currentRound + 1,
        history: [...prev.history, { 
          round: prev.currentRound, 
          trackName: CALENDAR[(prev.currentRound - 1) % CALENDAR.length].name, 
          results 
        }]
     }));

     if (newPenalties.length > 0) {
       setNotification({ title: 'FIA Investigação', msg: 'Novas sanções pendentes de resolução.', type: 'error' });
       setActiveTab('stewards');
     } else {
       setActiveTab('dashboard');
     }
  };

  if (!gameState.isSetupComplete) return <TeamSelection onSelect={handleFinishTeamSelection} />;

  const unresolvedPenalties = gameState.userTeam.penalties.filter(p => !p.isResolved);

  return (
    <div className="min-h-screen flex flex-col bg-[#020617] text-slate-100 pb-24 lg:pb-0 lg:flex-row">
      
      {/* Sidebar Desktop */}
      <nav className="hidden lg:flex w-72 bg-slate-900/50 border-r border-white/5 flex-col sticky top-0 h-screen p-6">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl glass flex items-center justify-center neon-border" style={{ borderColor: gameState.userTeam.color }}>
             {gameState.userTeam.logo ? <img src={gameState.userTeam.logo} className="w-6 h-6 object-contain" /> : <Zap size={20} />}
          </div>
          <div>
            <h1 className="font-heading text-lg leading-none uppercase italic">{gameState.userTeam.name}</h1>
            <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">
              {maxDrivers === 1 ? 'Solo Career' : 'Pro Team Manager'}
            </p>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <SideNavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20} />} label="Centro de Comando" />
          <SideNavItem active={activeTab === 'upgrades'} onClick={() => setActiveTab('upgrades')} icon={<Wrench size={20} />} label="Engenharia P&D" />
          <SideNavItem active={activeTab === 'drivers'} onClick={() => setActiveTab('drivers')} icon={<Users size={20} />} label="Gestão de Pilotos" />
          <SideNavItem active={activeTab === 'stewards'} onClick={() => setActiveTab('stewards')} icon={<Gavel size={20} />} label="Comissários FIA" count={unresolvedPenalties.length} />
          <SideNavItem active={activeTab === 'datapack'} onClick={() => setActiveTab('datapack')} icon={<Database size={20} />} label="Identidade Visual" />
          <SideNavItem active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History size={20} />} label="Logs de Dados" />
        </div>

        <div className="pt-6 border-t border-white/5 space-y-3">
          <button onClick={() => { localStorage.setItem(SAVE_KEY, JSON.stringify(gameState)); playNotificationSFX(); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all text-sm font-bold">
            <Save size={18} /> Salvar Sessão
          </button>
          <button onClick={handleBackToMenu} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all text-sm font-bold">
            <LogOut size={18} /> Sair do Jogo
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-10 max-w-7xl mx-auto w-full">
        <header className="flex justify-between items-center mb-8 lg:mb-12">
          <div>
            <h2 className="font-heading text-2xl lg:text-4xl uppercase italic tracking-tighter">
              {activeTab === 'dashboard' ? 'Status da Temporada' : 
               activeTab === 'upgrades' ? 'Desenvolvimento' : 
               activeTab === 'drivers' ? 'Negotiations' : 
               activeTab === 'stewards' ? 'Stewards Office' : 'Configurações'}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Live FIA Data Stream</span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <div className="glass px-4 py-2 rounded-2xl hidden md:block">
              <p className="text-[8px] text-slate-500 uppercase font-black">Capital</p>
              <p className="font-mono text-emerald-400 font-bold text-sm">
                ${(gameState.userTeam.finances / 1000000).toFixed(1)}M
              </p>
            </div>
            <button 
              onClick={() => setActiveTab('race')}
              disabled={gameState.userTeam.drivers.length === 0}
              className="bg-white text-slate-950 px-6 py-3 rounded-2xl font-black uppercase italic text-xs flex items-center gap-2 hover:bg-emerald-400 hover:text-white transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              <Play size={14} fill="currentColor" /> Próximo GP
            </button>
          </div>
        </header>

        <div className="animate-fadeIn">
          {activeTab === 'dashboard' && <Dashboard team={gameState.userTeam} />}
          {activeTab === 'upgrades' && <Upgrades team={gameState.userTeam} onUpgrade={() => {}} />}
          {activeTab === 'drivers' && (
            <DriverMarket 
              currentDrivers={gameState.userTeam.drivers} 
              availableDrivers={ALL_DRIVERS} 
              finances={gameState.userTeam.finances} 
              onHire={handleHireDriver} 
              onFire={handleFireDriver}
              onRenew={handleRenewDriver}
              maxDrivers={maxDrivers}
            />
          )}
          {activeTab === 'stewards' && (
            <div className="max-w-4xl mx-auto space-y-6">
               <div className="bg-red-600/10 border-l-4 border-red-600 p-6 rounded-r-2xl">
                  <h3 className="text-xl font-black uppercase italic text-white flex items-center gap-3">
                    <Gavel className="text-red-500" /> Escritório dos Comissários
                  </h3>
                  <p className="text-slate-400 text-sm mt-1 font-medium">Você tem {unresolvedPenalties.length} infrações aguardando resolução. A FIA exige uma decisão imediata sobre o pagamento de multas ou dedução de pontos.</p>
               </div>

               <div className="space-y-4">
                  {unresolvedPenalties.length === 0 ? (
                    <div className="bg-emerald-900/10 border border-emerald-500/30 p-12 rounded-[2rem] text-center">
                       <ShieldAlert className="mx-auto text-emerald-500 mb-4" size={48} />
                       <h4 className="text-xl font-bold text-white uppercase italic">Nenhuma Sanção Pendente</h4>
                       <p className="text-slate-500 mt-2">Sua equipe está em total conformidade com os regulamentos técnicos e esportivos.</p>
                    </div>
                  ) : (
                    unresolvedPenalties.map(p => (
                      <div key={p.id} className="bg-slate-900/60 border border-slate-800 p-8 rounded-[2rem] space-y-6 animate-slideUp">
                         <div className="flex justify-between items-start">
                           <div className="space-y-1">
                             <span className="bg-red-500 text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded">Infração Detectada</span>
                             <h4 className="text-lg font-bold text-white italic">{p.reason}</h4>
                           </div>
                           <span className="text-[10px] font-mono text-slate-500">{new Date(p.timestamp).toLocaleDateString()}</span>
                         </div>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button 
                              disabled={gameState.userTeam.finances < p.cost}
                              onClick={() => handleResolvePenalty(p.id, 'FINE')}
                              className="group bg-slate-800 hover:bg-white p-6 rounded-2xl text-left transition-all border border-slate-700 hover:border-white shadow-xl"
                            >
                               <div className="flex items-center justify-between mb-4">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900">Opção 01: Pagamento</span>
                                  <ShieldAlert size={16} className="text-emerald-500" />
                               </div>
                               <p className="text-2xl font-black font-mono text-emerald-400 group-hover:text-slate-950">${(p.cost / 1000000).toFixed(1)}M</p>
                               <p className="text-[10px] font-medium text-slate-500 group-hover:text-slate-700 mt-2 uppercase">Dedução imediata do saldo da equipe.</p>
                            </button>

                            <button 
                              onClick={() => handleResolvePenalty(p.id, 'POINTS')}
                              className="group bg-slate-800 hover:bg-white p-6 rounded-2xl text-left transition-all border border-slate-700 hover:border-white shadow-xl"
                            >
                               <div className="flex items-center justify-between mb-4">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900">Opção 02: Sanção Esportiva</span>
                                  <ShieldAlert size={16} className="text-red-500" />
                               </div>
                               <p className="text-2xl font-black font-mono text-red-500 group-hover:text-slate-950">-{p.pointsLost} PTS</p>
                               <p className="text-[10px] font-medium text-slate-500 group-hover:text-slate-700 mt-2 uppercase">Dedução da tabela do campeonato.</p>
                            </button>
                         </div>
                      </div>
                    ))
                  )}
               </div>
            </div>
          )}
          {activeTab === 'datapack' && <DataPackEditor userTeam={gameState.userTeam} rivals={gameState.rivalTeams} onUpdate={() => {}} />}
          {activeTab === 'race' && <SimulationRoom userTeam={gameState.userTeam} rivals={gameState.rivalTeams} round={gameState.currentRound} onFinish={handleRaceFinished} />}
          {activeTab === 'history' && (
             <div className="space-y-4">
                {gameState.history.length === 0 ? (
                  <p className="text-center py-20 text-slate-600">Nenhum histórico de corrida.</p>
                ) : (
                  gameState.history.map((h, i) => (
                    <div key={i} className="glass p-6 rounded-2xl">
                       <h4 className="font-heading text-white uppercase italic">{h.trackName}</h4>
                    </div>
                  ))
                )}
             </div>
          )}
        </div>
      </main>

      <nav className="lg:hidden fixed bottom-0 left-0 w-full glass border-t border-white/10 z-50 px-2 py-3 pb-safe">
        <div className="flex justify-around items-center">
          <BottomNavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20} />} label="Status" />
          <BottomNavItem active={activeTab === 'upgrades'} onClick={() => setActiveTab('upgrades')} icon={<Wrench size={20} />} label="Engenharia" />
          <BottomNavItem active={activeTab === 'drivers'} onClick={() => setActiveTab('drivers')} icon={<Users size={20} />} label="Grid" />
          <BottomNavItem active={activeTab === 'stewards'} onClick={() => setActiveTab('stewards')} icon={<Gavel size={20} />} label="FIA" />
          <BottomNavItem active={activeTab === 'datapack'} onClick={() => setActiveTab('datapack')} icon={<Database size={20} />} label="Estilo" />
        </div>
      </nav>

      {showLaunchModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl animate-fadeIn p-6">
          <div className="max-w-xl w-full text-center space-y-8">
            <Sparkles className="mx-auto text-yellow-400 animate-bounce" size={48} />
            <h1 className="font-heading text-5xl lg:text-7xl uppercase italic tracking-tighter text-white">Shakedown 2025</h1>
            <div className="relative h-64 lg:h-96 glass rounded-[3rem] p-8 neon-border flex items-center justify-center overflow-hidden" style={{ borderColor: gameState.userTeam.color }}>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
              <CarVisualizer stats={gameState.userTeam.car} color={gameState.userTeam.color} />
            </div>
            <button 
              onClick={() => setShowLaunchModal(false)}
              className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black uppercase italic text-xl shadow-2xl active:scale-95 transition-all"
            >
              Liberar Pitlane
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const SideNavItem = ({ active, onClick, icon, label, count }: any) => (
  <button onClick={onClick} className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all font-bold text-sm ${active ? 'bg-white text-slate-950 shadow-xl scale-[1.02]' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}>
    <div className="flex items-center gap-4">
      {icon} <span>{label}</span>
    </div>
    {count > 0 && <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">{count}</span>}
  </button>
);

const BottomNavItem = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-white' : 'text-slate-500'}`}>
    <div className={`p-2 rounded-xl ${active ? 'bg-white/10' : ''}`}>
      {icon}
    </div>
    <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

export default App;
