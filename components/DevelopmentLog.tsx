
import React from 'react';
import { UpgradeRecord, Penalty } from '../types';
import { Hammer, Zap, Wind, ShieldCheck, DollarSign, Calendar, Clock, TrendingUp, Cpu, PieChart, ShieldAlert, Gavel, AlertCircle, Trash2 } from 'lucide-react';

interface DevelopmentLogProps {
  upgrades: UpgradeRecord[];
  penalties: Penalty[];
}

const DevelopmentLog: React.FC<DevelopmentLogProps> = ({ upgrades, penalties }) => {
  const totalSpent = upgrades.reduce((sum, u) => sum + u.cost, 0);
  const totalPenaltyCosts = penalties.reduce((sum, p) => sum + p.cost, 0);
  const totalPointsLost = penalties.reduce((sum, p) => sum + p.pointsLost, 0);
  const totalCycles = upgrades.length;
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-12 pb-12 animate-fadeIn">
      {/* Resumo Financeiro e de Impacto */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-900/5 border border-emerald-500/20 p-6 rounded-3xl relative overflow-hidden group shadow-lg">
          <div className="absolute -right-4 -top-4 text-emerald-500/5 group-hover:scale-110 transition-transform">
            <DollarSign size={120} />
          </div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 shadow-lg">
              <DollarSign size={24} />
            </div>
            <div>
              <div className="text-[10px] text-emerald-500/60 uppercase font-black tracking-widest mb-1">Investimento em P&D</div>
              <div className="text-3xl font-black font-mono text-emerald-400">
                ${(totalSpent / 1000000).toFixed(1)}M
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-blue-900/5 border border-blue-500/20 p-6 rounded-3xl relative overflow-hidden group shadow-lg">
          <div className="absolute -right-4 -top-4 text-blue-500/5 group-hover:scale-110 transition-transform">
            <TrendingUp size={120} />
          </div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 shadow-lg">
              <TrendingUp size={24} />
            </div>
            <div>
              <div className="text-[10px] text-blue-500/60 uppercase font-black tracking-widest mb-1">Ciclos de Inovação</div>
              <div className="text-3xl font-black font-mono text-blue-400">
                {totalCycles} <span className="text-xs text-blue-500/50">Upgrades</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500/10 to-red-900/5 border border-red-500/20 p-6 rounded-3xl relative overflow-hidden group shadow-lg">
          <div className="absolute -right-4 -top-4 text-red-500/5 group-hover:scale-110 transition-transform">
            <Gavel size={120} />
          </div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center text-red-400 shadow-lg">
              <ShieldAlert size={24} />
            </div>
            <div>
              <div className="text-[10px] text-red-400/60 uppercase font-black tracking-widest mb-1">Impacto de Penalidades</div>
              <div className="text-3xl font-black font-mono text-red-400">
                ${(totalPenaltyCosts / 1000000).toFixed(1)}M
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Histórico de Upgrades */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black uppercase italic tracking-tight text-white flex items-center gap-3">
              <Hammer className="text-blue-400" size={20} /> Evolução Técnica
            </h3>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Registros de Oficina</span>
          </div>

          <div className="space-y-3">
            {upgrades.length === 0 ? (
              <div className="bg-slate-800/20 border-2 border-dashed border-slate-800 rounded-3xl py-12 text-center text-slate-600 italic text-sm">
                Nenhum upgrade instalado nesta temporada.
              </div>
            ) : (
              upgrades.map((u) => (
                <div key={u.id} className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-2xl flex items-center gap-4 hover:border-slate-500 transition-all group">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 ${
                    u.stat === 'power' ? 'bg-orange-500' : 
                    u.stat === 'aero' ? 'bg-blue-500' : 
                    u.stat === 'reliability' ? 'bg-emerald-500' : 'bg-cyan-500'
                  }`}>
                    {u.stat === 'power' ? <Zap size={18} /> : 
                     u.stat === 'aero' ? <Wind size={18} /> : 
                     u.stat === 'reliability' ? <ShieldCheck size={18} /> : <Cpu size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                      <h4 className="text-xs font-black uppercase text-white truncate">{u.stat === 'power' ? 'Unidade de Potência' : u.stat === 'aero' ? 'Aerodinâmica' : u.stat === 'reliability' ? 'Confiabilidade' : 'Sistemas ERS'}</h4>
                      <span className="text-emerald-400 font-mono font-bold text-[10px]">+{u.increment}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-500 font-medium">{formatDate(u.timestamp)}</span>
                      <span className="text-[9px] font-black text-slate-600 uppercase">Custo: ${(u.cost / 1000000).toFixed(1)}M</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Histórico de Penalidades (FIA Log) */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black uppercase italic tracking-tight text-white flex items-center gap-3">
              <AlertCircle className="text-red-400" size={20} /> Decisões FIA
            </h3>
            <div className="flex gap-4">
              <span className="text-[9px] font-black text-red-500/60 uppercase tracking-widest">Total: -{totalPointsLost} PTS</span>
            </div>
          </div>

          <div className="space-y-3">
            {penalties.length === 0 ? (
              <div className="bg-emerald-500/5 border-2 border-dashed border-emerald-900/20 rounded-3xl py-12 text-center text-emerald-900/40 italic text-sm">
                Ficha limpa! Nenhuma penalidade registrada.
              </div>
            ) : (
              penalties.map((p) => (
                <div key={p.id} className="bg-red-950/20 border border-red-900/30 p-5 rounded-3xl space-y-3 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                    <Gavel size={64} className="text-red-400" />
                  </div>
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-[8px] font-black uppercase tracking-widest border border-red-500/30">
                        {p.type}
                      </span>
                      <h4 className="text-sm font-bold text-white mt-2 leading-tight pr-12">{p.reason}</h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400">
                        <Clock size={14} />
                      </div>
                      <div className="text-[9px] font-bold text-slate-500 uppercase">
                        Data Emissão<br/>
                        <span className="text-slate-300 font-mono">{formatDate(p.timestamp)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
                        <DollarSign size={14} />
                      </div>
                      <div className="text-[9px] font-bold text-slate-500 uppercase">
                        Multa Aplicada<br/>
                        <span className="text-orange-400 font-mono">${(p.cost / 1000000).toFixed(1)}M</span>
                      </div>
                    </div>
                  </div>

                  {p.pointsLost > 0 && (
                    <div className="pt-2 border-t border-red-900/20 flex justify-between items-center">
                      <span className="text-[9px] font-black text-red-500/60 uppercase tracking-widest">Sanção Esportiva</span>
                      <span className="text-xs font-black text-red-400">-{p.pointsLost} Pontos de Equipe</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DevelopmentLog;
