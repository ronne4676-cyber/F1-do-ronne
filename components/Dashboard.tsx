
import React from 'react';
import { Team } from '../types';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { Wallet, Trophy, Cpu, Zap, Wind, ShieldCheck, Activity, AlertTriangle, Clock, User } from 'lucide-react';
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

  const expiringDrivers = team.drivers.filter(d => d.contractYears < 0.4);

  return (
    <div className="space-y-4 lg:space-y-6 animate-fadeIn pb-16 lg:pb-0">
      {expiringDrivers.length > 0 && (
        <div className="bg-red-900/20 border border-red-500/40 p-3 lg:p-4 rounded-xl flex items-center justify-between animate-pulse">
           <div className="flex items-center gap-3">
              <AlertTriangle className="text-red-500" size={18} />
              <div>
                <h4 className="text-[10px] font-black uppercase text-white">Alerta de Contrato</h4>
                <p className="text-[9px] text-red-300">Renove com seus pilotos no Mercado.</p>
              </div>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2 bg-slate-800/40 border border-slate-700/50 p-4 lg:p-6 rounded-2xl lg:rounded-[2rem] flex flex-col md:flex-row gap-4 lg:gap-8 items-center">
          <div className="w-full md:w-1/2 h-[180px] lg:h-[280px]">
            <CarVisualizer stats={team.car} color={team.color} />
          </div>
          <div className="flex-1 w-full space-y-3 lg:space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 lg:w-14 lg:h-14 bg-white/5 rounded-lg p-1.5 border border-white/10 flex items-center justify-center shrink-0" style={{ borderColor: team.color }}>
                {team.logo ? <img src={team.logo} className="max-w-full max-h-full object-contain" /> : <Zap size={18} />}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg lg:text-2xl font-black italic uppercase tracking-tighter text-white truncate">{team.name}</h2>
                <div className="flex gap-1.5 mt-0.5">
                  <span className="bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded text-[7px] font-black uppercase border border-slate-700">
                    {team.category}
                  </span>
                  <span className="bg-emerald-950/40 text-emerald-400 px-1.5 py-0.5 rounded text-[7px] font-black uppercase border border-emerald-900/30">
                    {team.engine.brand}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <StatItem icon={<Wallet size={12} />} label="Saldo" value={formatCurrency(team.finances)} color="text-emerald-400" />
              <StatItem icon={<Trophy size={12} />} label="Pontos" value={team.points.toString()} color="text-white" />
            </div>

            <div className="pt-3 border-t border-slate-700/50">
               <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <User size={10} /> Escalação
               </div>
               <div className={`grid gap-2 ${team.drivers.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {team.drivers.length === 0 ? (
                    <p className="text-[10px] text-red-400 font-black uppercase">Nenhum piloto ativo!</p>
                  ) : (
                    team.drivers.map(d => (
                      <div key={d.id} className="bg-slate-950/40 p-2 rounded-lg border border-slate-800">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[8px] font-bold text-slate-400 uppercase truncate max-w-[80px]">{d.name}</span>
                          <span className={`text-[8px] font-black ${d.contractYears < 0.4 ? 'text-red-400' : 'text-blue-400'}`}>{d.contractYears.toFixed(1)}y</span>
                        </div>
                        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full ${d.contractYears < 0.4 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${(d.contractYears / 3) * 100}%` }} />
                        </div>
                      </div>
                    ))
                  )}
               </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/40 border border-slate-700/50 p-4 rounded-2xl flex flex-col items-center">
          <div className="w-full flex items-center gap-2 mb-2 self-start">
            <Activity className="text-blue-400" size={12} />
            <h3 className="text-[8px] font-black uppercase tracking-widest text-slate-500">Performance</h3>
          </div>
          <div className="h-[150px] lg:h-[220px] w-full max-w-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                <PolarGrid stroke="#334155" strokeWidth={0.5} />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 7, fontWeight: 800 }} />
                <Radar
                  name="Estatísticas"
                  dataKey="A"
                  stroke={team.color || "#ef4444"}
                  fill={team.color || "#ef4444"}
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
        <CompactFeatureCard icon={<Zap size={14} />} label="Potência" value={`${team.car.power} HP`} color="text-orange-400" />
        <CompactFeatureCard icon={<Wind size={14} />} label="Aerodinâmica" value={`${team.car.aero}%`} color="text-blue-400" />
        <CompactFeatureCard icon={<ShieldCheck size={14} />} label="Confiabilidade" value={`${team.car.reliability}%`} color="text-emerald-400" />
        <CompactFeatureCard icon={<Cpu size={14} />} label="Híbrido ERS" value={`${team.car.ers}%`} color="text-cyan-400" />
      </div>
    </div>
  );
};

const StatItem = ({ icon, label, value, color }: any) => (
  <div className="bg-slate-950/40 border border-slate-800/60 p-2 rounded-lg">
    <div className="flex items-center gap-1.5 mb-0.5">
      <span className="text-slate-500 opacity-70">{icon}</span>
      <span className="text-[7px] text-slate-500 font-black uppercase tracking-widest">{label}</span>
    </div>
    <div className={`text-[10px] lg:text-xs font-black font-mono ${color}`}>{value}</div>
  </div>
);

const CompactFeatureCard = ({ icon, label, value, color }: any) => (
  <div className="bg-slate-800/30 border border-slate-700/50 p-3 rounded-xl hover:border-slate-500 transition-all">
    <div className={`mb-1.5 ${color} opacity-80`}>{icon}</div>
    <h4 className="text-[7px] text-slate-500 font-black uppercase tracking-widest mb-0.5 truncate">{label}</h4>
    <div className="text-xs lg:text-lg font-black text-white">{value}</div>
  </div>
);

export default Dashboard;
