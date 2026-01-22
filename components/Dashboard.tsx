
import React from 'react';
import { Team } from '../types';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { Wallet, Trophy, Cpu, Zap, Wind, ShieldCheck, Activity, AlertTriangle, Clock } from 'lucide-react';
import CarVisualizer from './CarVisualizer';
import { formatCurrency } from '../utils/economy';

interface DashboardProps {
  team: Team;
}

const Dashboard: React.FC<DashboardProps> = ({ team }) => {
  const chartData = [
    { subject: 'Potência', A: team.car.power, fullMark: 1100 },
    { subject: 'Aero', A: team.car.aero * 11, fullMark: 1100 },
    { subject: 'Conf.', A: team.car.reliability * 11, fullMark: 1100 },
    { subject: 'ERS', A: team.car.ers * 11, fullMark: 1100 },
  ];

  // Verifica se há pilotos com contrato perto do fim
  const expiringDrivers = team.drivers.filter(d => d.contractYears < 0.4);

  return (
    <div className="space-y-4 lg:space-y-8 animate-fadeIn">
      {expiringDrivers.length > 0 && (
        <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-2xl flex items-center justify-between animate-pulse">
           <div className="flex items-center gap-4">
              <div className="bg-red-500 p-2 rounded-xl text-white">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h4 className="text-sm font-black uppercase italic text-white">Atenção: Crise de Contratos</h4>
                <p className="text-xs text-red-300">{expiringDrivers.map(d => d.name).join(', ')} estão em fase final de vínculo.</p>
              </div>
           </div>
           <span className="text-[10px] font-black uppercase text-red-400 tracking-widest hidden md:block">Ação Requerida no Mercado</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
        <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700 p-4 lg:p-8 rounded-2xl lg:rounded-[2.5rem] flex flex-col md:flex-row gap-4 lg:gap-8 items-center shadow-xl">
          <div className="w-full md:w-1/2 h-[200px] lg:h-[300px]">
            <CarVisualizer stats={team.car} />
          </div>
          <div className="flex-1 w-full space-y-4">
            <div className="flex items-start gap-4">
              {team.logo && (
                <div className="w-12 h-12 lg:w-16 lg:h-16 bg-white/5 rounded-xl p-2 border border-white/10 flex items-center justify-center shrink-0 backdrop-blur-sm">
                  <img src={team.logo} alt={team.name} className="max-w-full max-h-full object-contain brightness-110" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl lg:text-3xl font-black italic uppercase tracking-tighter text-white mb-1 truncate">{team.name}</h2>
                <div className="flex gap-2">
                  <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-red-500/30">
                    {team.category}
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-emerald-500/30">
                    {team.engine.brand}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <StatItem icon={<Wallet className="text-emerald-400" size={14} />} label="Saldo Disponível" value={formatCurrency(team.finances)} color="text-emerald-400" />
              <StatItem icon={<Trophy className="text-yellow-400" size={14} />} label="Pontos de Equipe" value={team.points.toString()} color="text-white" />
            </div>

            <div className="pt-4 border-t border-slate-700/50">
               <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                  <span className="flex items-center gap-2"><Clock size={12} /> Status dos Contratos</span>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  {team.drivers.map(d => (
                    <div key={d.id} className="bg-slate-900/50 p-2 rounded-xl border border-slate-800">
                      <div className="flex justify-between mb-1">
                        <span className="text-[8px] font-black text-slate-400 uppercase truncate w-20">{d.name}</span>
                        <span className={`text-[8px] font-bold ${d.contractYears < 0.4 ? 'text-red-400' : 'text-blue-400'}`}>{d.contractYears.toFixed(1)}y</span>
                      </div>
                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full ${d.contractYears < 0.4 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${(d.contractYears / 3) * 100}%` }} />
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-2xl shadow-xl flex flex-col items-center">
          <div className="w-full flex items-center gap-2 mb-2 self-start">
            <Activity className="text-blue-400" size={14} />
            <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Desempenho Técnico</h3>
          </div>
          <div className="h-[180px] lg:h-[250px] w-full max-w-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 8, fontWeight: 800 }} />
                <Radar
                  name="Estatísticas"
                  dataKey="A"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        <FeatureCard icon={<Zap />} label="Potência" value={`${team.car.power} HP`} color="text-orange-400" bg="bg-orange-500/10" />
        <FeatureCard icon={<Wind />} label="Aero" value={`${team.car.aero}%`} color="text-blue-400" bg="bg-blue-500/10" />
        <FeatureCard icon={<ShieldCheck />} label="Conf." value={`${team.car.reliability}%`} color="text-emerald-400" bg="bg-emerald-500/10" />
        <FeatureCard icon={<Cpu />} label="ERS" value={`${team.car.ers}%`} color="text-cyan-400" bg="bg-cyan-500/10" />
      </div>
    </div>
  );
};

const StatItem = ({ icon, label, value, color }: any) => (
  <div className="bg-slate-900/50 border border-slate-800 p-2.5 rounded-xl">
    <div className="flex items-center gap-1.5 mb-0.5">
      {icon}
      <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">{label}</span>
    </div>
    <div className={`text-sm font-black font-mono ${color}`}>{value}</div>
  </div>
);

const FeatureCard = ({ icon, label, value, color, bg }: any) => (
  <div className="bg-slate-800/40 border border-slate-700/50 p-3 lg:p-6 rounded-xl lg:rounded-3xl hover:border-slate-500 transition-all group">
    <div className={`w-8 h-8 lg:w-12 lg:h-12 rounded-lg lg:rounded-2xl ${bg} ${color} flex items-center justify-center mb-2 lg:mb-4 shadow-md`}>
      {React.cloneElement(icon as React.ReactElement<any>, { size: 18 })}
    </div>
    <h4 className="text-[8px] lg:text-[10px] text-slate-500 font-black uppercase tracking-widest mb-0.5">{label}</h4>
    <div className="text-md lg:text-2xl font-black text-white">{value}</div>
  </div>
);

export default Dashboard;
