
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
import { ENGINES, INITIAL_DRIVERS, TEAM_TEMPLATES, PENALTY_REASONS, UPGRADES, INITIAL_CAR_STATS, CALENDAR, ALL_DRIVERS } from '../constants';
import { generatePenaltyReport } from '../services/geminiService';
import Dashboard from './Dashboard';
import DriverMarket from './DriverMarket';
import SimulationRoom from './SimulationRoom';
import Upgrades from './Upgrades';
import DevelopmentLog from './DevelopmentLog';
import TeamSelection from './TeamSelection';
import DataPackEditor from './DataPackEditor';
import CarVisualizer from './CarVisualizer';
import { playConfirmSFX, playUpgradeSFX, playNotificationSFX } from '../utils/audio';
import { LayoutDashboard, Users, Zap, Play, History, ShieldAlert, Wrench, Hammer, Save, Trash2, Database, Mic2, LogOut, Sparkles } from 'lucide-react';

const SAVE_KEY = 'GP_STRATEGIST_SAVE_V2';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'drivers' | 'engines' | 'upgrades' | 'race' | 'history' | 'datapack'>('dashboard');
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  
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

  // Auto-save effect
  useEffect(() => {
    if (gameState.isSetupComplete) {
      localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
    }
  }, [gameState]);

  useEffect(() => {
    if (notification) {
      playNotificationSFX();
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleManualSave = () => {
    localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
    playConfirmSFX();
    setNotification({ title: 'Jogo Salvo', msg: 'Progresso sincronizado com sucesso.', type: 'info' });
  };

  const handleBackToMenu = () => {
    if (window.confirm("Voltar ao menu principal? Todo progresso não salvo será perdido.")) {
      // Importante: Remover do localStorage para garantir que no próximo load ele não volte pro jogo atual
      localStorage.removeItem(SAVE_KEY);
      
      setGameState({
        userTeam: {} as Team,
        rivalTeams: [],
        currentRound: 1,
        isSetupComplete: false,
        history: []
      });
      setActiveTab('dashboard');
      setShowLaunchModal(false);
    }
  };

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
    setShowLaunchModal(true);
  };

  const handleUpdateDataPack = (updatedUser: Team, updatedRivals: Team[]) => {
    setGameState(prev => ({
      ...prev,
      userTeam: updatedUser,
      rivalTeams: updatedRivals
    }));
    setNotification({ title: 'Ativos Atualizados', msg: 'As cores e logos foram sincronizados.', type: 'info' });
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

  if (!gameState.isSetupComplete) {
    return <TeamSelection onSelect={handleFinishTeamSelection} />;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#0f172a] text-slate-100">
      
      {/* Launch Modal */}
      {showLaunchModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl animate-fadeIn">
          <div className="max-w-xl w-full text-center space-y-6">
            <div className="flex flex-col items-center justify-center">
              <Sparkles className="text-yellow-400 mb-2 animate-bounce" size={40} />
              <h1 className="text-4xl lg:text-6xl font-black italic uppercase tracking-tighter text-white">Car Launch 2025</h1>
              <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[10px] mt-1">A New Era Begins</p>
            </div>
            
            <div className="relative h-[250px] lg:h-[350px] flex items-center justify-center animate-slideUp">
               <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
               <div className="absolute -inset-10 bg-blue-500/10 blur-[80px] rounded-full animate-pulse" style={{ backgroundColor: gameState.userTeam.color + '25' }} />
               <CarVisualizer stats={gameState.userTeam.car} color={gameState.userTeam.color} />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black italic uppercase text-white tracking-tight">{gameState.userTeam.name}</h2>
              <div className="flex gap-2 justify-center">
                <div className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg text-[9px] font-black uppercase text-slate-400">Power: {gameState.userTeam.car.power} HP</div>
                <div className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg text-[9px] font-black uppercase text-slate-400">Aero: {gameState.userTeam.car.aero}%</div>
              </div>
            </div>

            <button 
              onClick={() => setShowLaunchModal(false)}
              className="w-full py-4 bg-white text-slate-950 rounded-xl font-black uppercase italic tracking-widest text-lg hover:bg-emerald-400 hover:text-white transition-all shadow-2xl active:scale-95"
            >
              Iniciar Temporada
            </button>
          </div>
        </div>
      )}

      <nav className="w-full lg:w-64 bg-slate-900 border-b lg:border-r border-slate-800 flex flex-col shrink-0 lg:h-screen lg:sticky lg:top-0">
        <div className="p-4 lg:p-6 pb-2 flex lg:flex-col justify-between items-center lg:items-start gap-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg shrink-0 flex items-center justify-center overflow-hidden" style={{ backgroundColor: gameState.userTeam.color }}>
              {gameState.userTeam.logo ? <img src={gameState.userTeam.logo} className="w-full h-full object-contain" /> : <Zap size={16} className="text-white" />}
            </div>
            <h1 className="text-sm lg:text-lg font-black italic tracking-tighter uppercase truncate max-w-[150px] lg:max-w-none">{gameState.userTeam.name}</h1>
          </div>
          <p className="text-[7px] lg:text-[9px] font-bold text-slate-500 uppercase tracking-widest lg:mt-1">Manager V2.5</p>
        </div>

        <div className="flex lg:flex-col overflow-x-auto lg:overflow-y-auto px-4 lg:px-3 py-2 lg:py-4 gap-1 no-scrollbar flex-1 border-t lg:border-t-0 border-slate-800">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={18} />} label="Início" />
          <NavItem active={activeTab === 'upgrades'} onClick={() => setActiveTab('upgrades')} icon={<Wrench size={18} />} label="P&D" />
          <NavItem active={activeTab === 'drivers'} onClick={() => setActiveTab('drivers')} icon={<Users size={18} />} label="Pilotos" />
          <NavItem active={activeTab === 'datapack'} onClick={() => setActiveTab('datapack')} icon={<Database size={18} />} label="Estilo" />
          <NavItem active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History size={18} />} label="Logs" />
          
          <div className="hidden lg:block pt-4">
            <button 
              onClick={() => setActiveTab('race')}
              disabled={gameState.userTeam.drivers.length === 0}
              className="w-full py-3 bg-red-600 hover:bg-red-500 rounded-xl flex items-center justify-center gap-2 font-bold transition-all shadow-lg active:scale-95 text-xs"
              style={{ backgroundColor: gameState.userTeam.color }}
            >
              <Play fill="currentColor" size={14} /> Próximo GP
            </button>
          </div>
        </div>

        <div className="p-3 lg:p-4 bg-slate-950/50 border-t border-slate-800 grid grid-cols-2 lg:grid-cols-1 gap-2">
          <button onClick={handleManualSave} className="flex-1 py-2.5 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 rounded-lg transition-all flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
            <Save size={12} /> Salvar
          </button>
          <button onClick={handleBackToMenu} className="flex-1 py-2.5 bg-slate-800 hover:bg-red-600/10 text-slate-500 hover:text-red-500 rounded-lg transition-all flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest border border-transparent hover:border-red-500/20">
            <LogOut size={12} /> Sair
          </button>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto p-4 lg:p-8 relative">
        <div className="lg:hidden fixed bottom-6 right-6 z-40">
           <button 
              onClick={() => setActiveTab('race')}
              disabled={gameState.userTeam.drivers.length === 0}
              className="w-14 h-14 rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-transform bg-red-600 text-white"
              style={{ backgroundColor: gameState.userTeam.color }}
            >
              <Play fill="currentColor" size={22} />
            </button>
        </div>

        {notification && (
          <div className="fixed top-4 right-4 z-[100] p-3 rounded-xl border bg-slate-900 border-slate-700 text-slate-100 flex gap-3 items-center shadow-2xl animate-bounceIn max-w-[250px]">
            <div className={`p-1.5 rounded-lg ${notification.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>
              <ShieldAlert size={16} />
            </div>
            <div>
              <h5 className="font-bold text-[9px] uppercase tracking-widest">{notification.title}</h5>
              <p className="text-[10px] opacity-80 leading-tight">{notification.msg}</p>
            </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto space-y-4 lg:space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-3">
             <div>
               <h1 className="text-xl lg:text-3xl font-black uppercase italic tracking-tight">
                 {activeTab === 'dashboard' ? 'Overview' : activeTab === 'datapack' ? 'Team Style' : 'GP Strategist'}
               </h1>
               <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-slate-500 text-[8px] font-bold uppercase tracking-widest">FIA Data Network Active</p>
               </div>
             </div>
             
             <div className="flex gap-2 w-full md:w-auto">
               <div className="flex-1 md:flex-none bg-slate-800/50 border border-slate-700 px-3 py-1.5 rounded-lg flex flex-col justify-center">
                 <div className="text-[7px] text-slate-500 uppercase font-black">Chassi</div>
                 <div className={`font-mono font-bold text-[10px] ${gameState.userTeam.engine.condition < 40 ? 'text-red-400' : 'text-blue-400'}`}>
                   {gameState.userTeam.engine.condition.toFixed(0)}%
                 </div>
               </div>
               <div className="flex-1 md:flex-none bg-slate-800/50 border border-slate-700 px-3 py-1.5 rounded-lg flex flex-col justify-center">
                 <div className="text-[7px] text-slate-500 uppercase font-black">Finanças</div>
                 <div className="font-mono font-bold text-emerald-400 text-[10px]">
                   ${(gameState.userTeam.finances / 1000000).toFixed(1)}M
                 </div>
               </div>
             </div>
          </div>

          <div className="min-h-[400px]">
            {activeTab === 'dashboard' && <Dashboard team={gameState.userTeam} />}
            {activeTab === 'upgrades' && <Upgrades team={gameState.userTeam} onUpgrade={() => {}} />}
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
              <div className="space-y-4 animate-fadeIn pb-20 lg:pb-12">
                 {gameState.history.length === 0 ? (
                   <div className="text-center py-20 text-slate-700 italic text-sm">Nenhum dado de corrida registrado.</div>
                 ) : (
                   gameState.history.map((h, i) => (
                     <div key={i} className="bg-slate-800/30 border border-slate-800 rounded-2xl p-4 lg:p-6">
                        <div className="flex justify-between items-center mb-3">
                           <h3 className="text-sm lg:text-lg font-black uppercase italic text-white">GP de {h.trackName}</h3>
                           <span className="text-[8px] lg:text-[10px] font-black text-slate-500 uppercase tracking-widest">Rodada {h.round}</span>
                        </div>
                        {h.interview && (
                          <div className="bg-blue-900/10 border-l-2 border-blue-500 p-3 rounded-r-lg mb-4 italic text-[11px] text-slate-300">
                             <div className="flex items-center gap-2 mb-1 text-blue-400 not-italic font-black text-[8px] uppercase">
                               <Mic2 size={10} /> Entrevista Paddock
                             </div>
                             "{h.interview}"
                          </div>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                           {h.results.slice(0, 5).map(r => (
                             <div key={r.teamId} className="bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                                <div className="text-[8px] font-black text-slate-500">P{r.position}</div>
                                <div className="text-[10px] font-bold text-white truncate">{r.teamName}</div>
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
  <button 
    onClick={onClick} 
    className={`flex items-center justify-center lg:justify-start gap-2 px-4 lg:px-3 py-2 lg:py-3 rounded-lg lg:rounded-xl transition-all font-bold text-[10px] lg:text-xs min-w-[70px] lg:min-w-0 ${active ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-500 hover:text-white hover:bg-slate-800/50'}`}
  >
    <span className={active ? 'scale-110' : ''}>{icon}</span>
    <span className="hidden sm:inline lg:inline truncate">{label}</span>
  </button>
);

export default App;
