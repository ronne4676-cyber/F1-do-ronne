
import React, { useState } from 'react';
import { Team, CarStats } from '../types';
import { UPGRADES } from '../constants';
import { calculateUpgradeCost, formatCurrency } from '../utils/economy';
import { 
  Zap, Wind, ShieldCheck, ChevronUp, DollarSign, ArrowRight, 
  Cpu, X, CheckCircle2, AlertCircle, TrendingUp, Info, Activity,
  Flame, Gauge
} from 'lucide-react';

interface UpgradesProps {
  team: Team;
  onUpgrade: (stat: keyof CarStats, cost: number) => void;
}

interface PendingUpgrade {
  stat: keyof CarStats;
  label: string;
  cost: number;
  current: number;
  next: number;
  unit: string;
  icon: React.ReactNode;
  color: string;
}

const Upgrades: React.FC<UpgradesProps> = ({ team, onUpgrade }) => {
  const [pendingUpgrade, setPendingUpgrade] = useState<PendingUpgrade | null>(null);

  const handleConfirmPurchase = () => {
    if (pendingUpgrade) {
      onUpgrade(pendingUpgrade.stat, pendingUpgrade.cost);
      setPendingUpgrade(null);
    }
  };

  const powerCost = calculateUpgradeCost('power', team.car.power);
  const powerNext = Math.min(team.car.power + UPGRADES.power.increment, UPGRADES.power.max);
  const canAffordPower = team.finances >= powerCost;
  const powerMaxed = team.car.power >= UPGRADES.power.max;

  const UpgradeCard = ({ 
    stat, 
    label, 
    shortLabel,
    icon, 
    color, 
    accent,
    unit = ""
  }: { 
    stat: keyof CarStats, 
    label: string, 
    shortLabel?: string,
    icon: React.ReactNode, 
    color: string, 
    accent: string,
    unit?: string
  }) => {
    const cost = calculateUpgradeCost(stat, team.car[stat]);
    const config = UPGRADES[stat];
    const current = team.car[stat];
    const nextValue = Math.min(current + config.increment, config.max);
    const isMaxed = current >= config.max;
    const canAfford = team.finances >= cost;

    return (
      <div className={`bg-slate-800/50 border border-slate-700 p-6 rounded-3xl transition-all hover:border-slate-500 relative overflow-hidden group flex flex-col h-full shadow-lg`}>
        <div className={`absolute -top-24 -right-24 w-48 h-48 opacity-10 blur-[100px] pointer-events-none ${accent}`} />
        
        {stat === 'ers' && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full">
              {[1, 2, 3].map(i => (
                <div key={i} className="absolute inset-0 border border-cyan-400 rounded-full" style={{ animation: `ersPulse ${1.5 + i}s ease-out infinite`, animationDelay: `${i * 0.4}s` }} />
              ))}
            </div>
          </div>
        )}

        {stat === 'aero' && (
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-20">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="absolute h-[1px] bg-blue-400 w-24" style={{ top: `${15 + i * 20}%`, left: '-120px', animation: `aeroFlow ${1.2 + i * 0.4}s linear infinite`, animationDelay: `${i * 0.3}s` }} />
            ))}
          </div>
        )}

        <div className="flex justify-between items-start mb-6">
          <div className={`p-3 rounded-2xl ${accent} text-white shadow-lg z-10`}>
            {icon}
          </div>
          <div className="text-right z-10">
            <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Custo de P&D</div>
            <div className={`text-2xl font-black font-mono ${isMaxed ? 'text-slate-500' : canAfford ? 'text-emerald-400' : 'text-red-400'}`}>
              {isMaxed ? 'MÁXIMO' : formatCurrency(cost)}
            </div>
          </div>
        </div>

        <div className="mb-6 z-10">
          <h3 className="text-xl font-bold tracking-tight mb-1">{label}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-white font-mono">{current}{unit}</span>
            <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Eficiência</span>
          </div>
        </div>

        <div className="flex-1 space-y-4 z-10">
          {!isMaxed && (
            <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-2xl">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-tighter text-slate-500 mb-2">
                <span>Próxima Revisão</span>
                <span className="text-emerald-500">Delta +{config.increment}{unit}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-400 font-mono font-bold text-lg">{current}{unit}</span>
                <ArrowRight size={16} className="text-slate-700" />
                <span className="text-white font-mono font-black text-lg">{nextValue}{unit}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between text-[9px] mb-1">
              <span className="text-slate-500 font-black uppercase tracking-widest">Cap. Desenv.</span>
              <span className="font-mono text-slate-600 font-bold">{config.max}{unit}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/50">
              <div className={`h-full ${color} transition-all duration-1000 ease-out`} style={{ width: `${(current / config.max) * 100}%` }} />
            </div>
          </div>
        </div>

        <button
          disabled={isMaxed || !canAfford}
          onClick={() => setPendingUpgrade({
            stat,
            label,
            cost,
            current,
            next: nextValue,
            unit,
            icon,
            color
          })}
          className={`w-full mt-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg z-10 ${
            isMaxed 
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50' 
              : !canAfford 
                ? 'bg-red-900/20 text-red-400 border border-red-900/50 cursor-not-allowed' 
                : 'bg-white text-slate-900 hover:bg-emerald-400 hover:text-white'
          }`}
        >
          {isMaxed ? 'Pico de Desenvolvimento' : `Comprometer com ${shortLabel || label}`}
        </button>
      </div>
    );
  };

  return (
    <div className="animate-fadeIn pb-12">
      <style>{`
        @keyframes aeroFlow {
          0% { transform: translateX(-120px); opacity: 0; }
          20% { opacity: 0.6; }
          80% { opacity: 0.6; }
          100% { transform: translateX(450px); opacity: 0; }
        }
        @keyframes ersPulse {
          0% { transform: scale(0.5) translate(-50%, -50%); opacity: 0.6; }
          100% { transform: scale(1.8) translate(-50%, -50%); opacity: 0; }
        }
        @keyframes firePulse {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.1); opacity: 0.6; }
        }
      `}</style>

      {pendingUpgrade && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="absolute inset-0 bg-slate-950/90" onClick={() => setPendingUpgrade(null)} />
          <div className="relative bg-slate-900 border border-slate-700 w-full max-w-xl rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden animate-bounceIn">
            <div className="p-8 pb-4 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${pendingUpgrade.color}`}>
                  {pendingUpgrade.icon}
                </div>
                <div>
                  <h4 className="text-2xl font-black uppercase italic tracking-tight text-white leading-none">Autorização Requerida</h4>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Pedido de Alocação de Recursos</p>
                </div>
              </div>
              <button onClick={() => setPendingUpgrade(null)} className="p-2 text-slate-500 hover:text-white transition-colors bg-slate-800 rounded-xl">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-8">
              <section>
                <h5 className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Activity size={12} className="text-blue-400" /> Vetor de Melhoria
                </h5>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/40 border border-slate-700/50 p-6 rounded-3xl text-center">
                    <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Base</div>
                    <div className="text-3xl font-mono font-black text-slate-300">{pendingUpgrade.current}{pendingUpgrade.unit}</div>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-3xl text-center">
                    <div className="text-[10px] text-emerald-500 uppercase font-bold mb-1">Pós-Instalação</div>
                    <div className="text-3xl font-mono font-black text-emerald-400">{pendingUpgrade.next}{pendingUpgrade.unit}</div>
                  </div>
                </div>
              </section>
              <section>
                <h5 className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <DollarSign size={12} className="text-emerald-400" /> Despesa de Capital
                </h5>
                <div className="bg-slate-950/50 border border-slate-800 p-6 rounded-3xl space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-bold uppercase tracking-tighter">Impacto no Orçamento</span>
                    <span className="text-red-400 font-mono font-black">{formatCurrency(pendingUpgrade.cost)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t border-slate-800 pt-4">
                    <span className="text-slate-500 font-bold uppercase tracking-tighter text-xs">Tesouraria Restante</span>
                    <span className="text-emerald-400 font-mono font-black text-lg">{formatCurrency(team.finances - pendingUpgrade.cost)}</span>
                  </div>
                </div>
              </section>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setPendingUpgrade(null)} className="py-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-black uppercase text-xs tracking-widest transition-colors">Declinar Projeto</button>
                <button onClick={handleConfirmPurchase} className="py-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs tracking-widest shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 group">
                  <CheckCircle2 size={16} /> Autorizar Melhoria
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="mb-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gradient-to-r from-orange-600 to-red-600 p-8 rounded-[2rem] relative overflow-hidden shadow-2xl shadow-orange-900/20 flex flex-col md:flex-row items-center gap-8 border-b-4 border-orange-800">
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)' }} />
          <div className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center text-white shrink-0 shadow-inner">
            <Flame size={48} className="animate-pulse" />
          </div>
          <div className="flex-1 space-y-2 text-center md:text-left">
            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Evolução da Unidade de Potência</h2>
            <p className="text-orange-100 font-medium text-sm max-w-md">Comprometa-se com o mapeamento mais recente do ICE para desbloquear desempenho superior em linha reta.</p>
            <div className="flex items-center justify-center md:justify-start gap-4 mt-4">
              <div className="bg-black/20 px-4 py-2 rounded-xl border border-white/10 text-xs font-black uppercase text-white">
                Delta: +10 BHP
              </div>
              <div className="bg-black/20 px-4 py-2 rounded-xl border border-white/10 text-xs font-black uppercase text-white">
                Líder de P&D: Otimizado
              </div>
            </div>
          </div>
          <button 
            disabled={powerMaxed || !canAffordPower}
            onClick={() => setPendingUpgrade({
              stat: 'power',
              label: 'Evolução da Unidade de Potência',
              cost: powerCost,
              current: team.car.power,
              next: powerNext,
              unit: 'HP',
              icon: <Zap size={24} />,
              color: 'bg-orange-500'
            })}
            className={`px-8 py-6 rounded-2xl font-black uppercase italic tracking-widest text-lg transition-all shadow-2xl shrink-0 ${
              powerMaxed ? 'bg-orange-900 text-orange-400 opacity-50 cursor-not-allowed' :
              !canAffordPower ? 'bg-orange-900/50 text-white/50 border border-white/10 cursor-not-allowed' :
              'bg-white text-orange-600 hover:scale-105 active:scale-95 hover:bg-orange-50'
            }`}
          >
            {powerMaxed ? 'No Pico' : `Investir: ${formatCurrency(powerCost)}`}
          </button>
        </div>

        <div className="bg-slate-800/30 border border-slate-700/50 p-8 rounded-[2rem] flex flex-col justify-center items-center gap-4 text-center">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 border border-emerald-500/20">
            <DollarSign size={32} />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Capital Disponível</div>
            <div className="text-4xl font-black font-mono text-emerald-400 tracking-tighter">
              {team.finances.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <UpgradeCard stat="power" label="Unidade de Potência" icon={<Zap size={24} />} color="bg-orange-500" accent="bg-orange-600/20" unit="HP" />
        <UpgradeCard stat="aero" label="Aerodinâmica" shortLabel="Aero" icon={<Wind size={24} />} color="bg-blue-500" accent="bg-blue-600/20" unit="%" />
        <UpgradeCard stat="reliability" label="Confiabilidade" icon={<ShieldCheck size={24} />} color="bg-emerald-500" accent="bg-emerald-600/20" unit="%" />
        <UpgradeCard stat="ers" label="Sistemas ERS" shortLabel="Híbrido" icon={<Cpu size={24} />} color="bg-cyan-500" accent="bg-cyan-600/20" unit="%" />
      </div>
    </div>
  );
};

export default Upgrades;
