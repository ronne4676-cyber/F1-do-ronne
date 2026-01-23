
import React, { useState } from 'react';
import { TEAM_TEMPLATES } from '../constants';
import { Zap, Check, ChevronRight, User, Users } from 'lucide-react';

interface TeamSelectionProps {
  onSelect: (teamData: { name: string, color: string, finances: number, bonusType: string, logo?: string, singleDriverMode: boolean }) => void;
}

const TeamSelection: React.FC<TeamSelectionProps> = ({ onSelect }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');
  const [singleDriverMode, setSingleDriverMode] = useState(false);

  const handleConfirm = () => {
    const template = TEAM_TEMPLATES.find(t => t.id === selectedId);
    if (template) {
      onSelect({
        name: customName || template.name,
        color: template.color,
        finances: template.startingFinances,
        bonusType: template.bonus,
        logo: template.logo,
        singleDriverMode
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-start p-4 lg:p-12 relative overflow-x-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] lg:w-[500px] lg:h-[500px] bg-red-600/10 blur-[100px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] lg:w-[500px] lg:h-[500px] bg-blue-600/10 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 w-full max-w-7xl space-y-8 lg:space-y-12 animate-fadeIn py-8">
        <div className="text-center space-y-2 lg:space-y-4">
          <div className="flex items-center justify-center gap-3 lg:gap-4 mb-2">
            <div className="bg-red-600 p-2 lg:p-3 rounded-xl lg:rounded-2xl shadow-lg">
              <Zap size={24} className="text-white lg:w-8 lg:h-8" />
            </div>
            <h1 className="text-3xl lg:text-6xl font-black italic tracking-tighter uppercase text-white drop-shadow-2xl">
              Estrategista GP
            </h1>
          </div>
          <p className="text-slate-400 text-sm lg:text-xl font-medium tracking-tight">Escolha sua equipe e modo de gestão para 2025</p>
        </div>

        {/* Modo de Carreira Selector */}
        <div className="flex justify-center gap-4 mb-8">
          <button 
            onClick={() => setSingleDriverMode(true)}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl border-2 transition-all ${singleDriverMode ? 'bg-white text-slate-950 border-white' : 'bg-slate-900/50 text-slate-500 border-slate-800 hover:border-slate-700'}`}
          >
            <User size={20} />
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest leading-none">Modo</p>
              <p className="text-xs font-bold uppercase italic">Piloto Único</p>
            </div>
          </button>
          <button 
            onClick={() => setSingleDriverMode(false)}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl border-2 transition-all ${!singleDriverMode ? 'bg-white text-slate-950 border-white' : 'bg-slate-900/50 text-slate-500 border-slate-800 hover:border-slate-700'}`}
          >
            <Users size={20} />
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest leading-none">Modo</p>
              <p className="text-xs font-bold uppercase italic">Equipe Completa</p>
            </div>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {TEAM_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => {
                setSelectedId(template.id);
                setCustomName(template.name);
              }}
              className={`relative group p-4 lg:p-6 rounded-2xl border-2 transition-all text-left flex flex-col h-full overflow-hidden ${
                selectedId === template.id 
                  ? 'bg-slate-900 border-white ring-4 ring-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)]' 
                  : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div 
                className="absolute top-0 right-0 w-24 h-24 opacity-5 blur-3xl pointer-events-none"
                style={{ backgroundColor: template.color }}
              />

              <div className="mb-4 w-full h-16 lg:h-20 flex items-center justify-center p-2 bg-white/5 rounded-xl border border-white/10 overflow-hidden backdrop-blur-sm">
                <img 
                  src={template.logo} 
                  alt={template.name} 
                  className="max-h-full max-w-full object-contain brightness-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${template.name.charAt(0)}&background=${template.color.replace('#','')}&color=fff&bold=true`;
                  }}
                />
              </div>

              <h3 className="text-sm lg:text-md font-black italic uppercase tracking-tighter mb-1 text-white truncate w-full">{template.name}</h3>
              <p className="text-[10px] text-slate-500 font-medium leading-tight flex-1 mb-4 line-clamp-3">{template.description}</p>
              
              <div className="space-y-1.5 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Saldo</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-400">${(template.startingFinances / 1000000).toFixed(0)}M</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Vantagem</span>
                  <span className="text-[7px] font-black uppercase tracking-widest text-white px-2 py-0.5 rounded bg-white/5 truncate max-w-[80px]">{template.bonus}</span>
                </div>
              </div>

              {selectedId === template.id && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-white text-slate-950 rounded-full flex items-center justify-center shadow-xl animate-bounceIn">
                  <Check size={10} strokeWidth={4} />
                </div>
              )}
            </button>
          ))}
        </div>

        {selectedId && (
          <div className="sticky bottom-4 lg:relative bg-slate-900 border border-slate-800 p-6 lg:p-8 rounded-2xl lg:rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-slideUp flex flex-col md:flex-row items-center gap-4 lg:gap-8 backdrop-blur-lg">
            <div className="flex-1 space-y-2 lg:space-y-4 w-full text-center md:text-left">
              <label className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500 md:ml-4">Confirmar Nome da Equipe</label>
              <input 
                type="text" 
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Nome da equipe..."
                className="w-full bg-slate-950 border border-slate-800 p-4 lg:p-6 rounded-xl lg:rounded-[1.5rem] text-lg lg:text-xl font-bold italic uppercase tracking-tight text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all placeholder:text-slate-800"
              />
            </div>
            <button 
              onClick={handleConfirm}
              className="w-full md:w-auto px-8 py-4 lg:px-12 lg:py-6 bg-white text-slate-950 rounded-xl lg:rounded-[1.5rem] font-black uppercase italic tracking-widest text-md lg:text-xl flex items-center justify-center gap-3 hover:bg-emerald-400 transition-all shadow-xl group active:scale-95 shrink-0"
            >
              Iniciar {singleDriverMode ? 'Carreira Individual' : 'Gestão de Equipe'}
              <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}
      </div>
      
      <div className="mt-8 text-[8px] text-slate-700 font-mono font-bold uppercase tracking-[0.5em] animate-pulse text-center pb-8">
        Sistema de Inscrição Oficial FIA
      </div>
    </div>
  );
};

export default TeamSelection;
