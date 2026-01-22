
import React, { useState } from 'react';
import { Driver } from '../types';
import { UserPlus, Star, Calendar, RefreshCcw, AlertTriangle, UserCheck, History, Heart, Info, X, DollarSign, Clock } from 'lucide-react';
import { formatCurrency } from '../utils/economy';

interface DriverMarketProps {
  currentDrivers: Driver[];
  availableDrivers: Driver[];
  onHire: (driver: Driver) => void;
  onRenew: (driverId: string, years: number, cost: number) => void;
  finances: number;
}

const DriverMarket: React.FC<DriverMarketProps> = ({ currentDrivers, availableDrivers, onHire, onRenew, finances }) => {
  const [selectedProfile, setSelectedProfile] = useState<Driver | null>(null);
  const [renewalPilot, setRenewalPilot] = useState<string | null>(null);
  const [renewalYears, setRenewalYears] = useState(1);

  const isAtCapacity = currentDrivers.length >= 2;

  const freeAgents = availableDrivers.filter(d => !currentDrivers.some(cd => cd.id === d.id));

  const calculateRenewalCost = (driver: Driver, years: number) => {
    // Custo base de renovação é o salário anual * anos + bônus de 10%
    return Math.floor((driver.salary * years) * 1.1);
  };

  return (
    <div className="space-y-12 animate-fadeIn pb-12">
      {/* Perfil Detalhado Modal */}
      {selectedProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="absolute inset-0 bg-slate-950/80" onClick={() => setSelectedProfile(null)} />
          <div className="relative bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-bounceIn">
            <div className="p-8 pb-4 border-b border-slate-800 flex justify-between items-center">
               <div className="flex items-center gap-4">
                  <img src={selectedProfile.image} alt="" className="w-16 h-16 rounded-2xl border-2 border-slate-700 bg-slate-800" />
                  <div>
                    <h3 className="text-2xl font-black uppercase italic text-white leading-none">{selectedProfile.name}</h3>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Perfil Oficial FIA</p>
                  </div>
               </div>
               <button onClick={() => setSelectedProfile(null)} className="p-2 bg-slate-800 rounded-xl text-slate-500 hover:text-white">
                 <X size={20} />
               </button>
            </div>
            
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <History size={12} className="text-blue-400" /> Histórico de Equipes
                    </h4>
                    <ul className="space-y-2">
                      {selectedProfile.history?.map((h, i) => (
                        <li key={i} className="text-xs font-bold text-slate-300 flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-slate-700" /> {h}
                        </li>
                      )) || <li className="text-xs text-slate-600 italic">Dados históricos indisponíveis.</li>}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <Heart size={12} className="text-red-400" /> Equipes Interessadas
                    </h4>
                    <div className="flex flex-wrap gap-2">
                       {selectedProfile.interestedTeams?.map((team, i) => (
                         <span key={i} className="px-3 py-1 bg-slate-800 rounded-full text-[9px] font-black text-slate-400 border border-slate-700">
                           {team}
                         </span>
                       )) || <span className="text-[9px] text-slate-600">Procurando oportunidades.</span>}
                    </div>
                  </div>
               </div>

               <div className="space-y-6 bg-slate-950/50 p-6 rounded-3xl border border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Habilidade OVR</span>
                    <span className="text-2xl font-black italic text-emerald-400">{selectedProfile.ovr}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase">Salário Anual</span>
                    <span className="text-xl font-black font-mono text-white">{formatCurrency(selectedProfile.salary)}</span>
                  </div>
                  <div className="pt-4 border-t border-slate-800">
                    <p className="text-[9px] text-slate-500 font-bold uppercase mb-2">Bônus de Assinatura (20%): {formatCurrency(selectedProfile.salary * 0.2)}</p>
                    <button
                      disabled={finances < (selectedProfile.salary * 0.2)}
                      onClick={() => {
                        onHire(selectedProfile);
                        setSelectedProfile(null);
                      }}
                      className={`w-full py-4 rounded-xl font-black uppercase italic tracking-widest text-xs transition-all ${finances >= (selectedProfile.salary * 0.2) ? 'bg-white text-slate-950 hover:bg-emerald-400 hover:text-white' : 'bg-slate-800 text-slate-600'}`}
                    >
                      Assinar com a Equipe
                    </button>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid Ativo Section */}
      <section>
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl font-black uppercase italic tracking-tight text-slate-100">Contratos Ativos</h2>
            <p className="text-slate-500 text-sm font-medium">Gestão de folha salarial e extensões.</p>
          </div>
          <div className="bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700 text-xs font-black uppercase tracking-widest text-slate-400">
            Escalação: <span className={isAtCapacity ? 'text-blue-400' : 'text-emerald-400'}>{currentDrivers.length}/2</span>
          </div>
        </div>

        {currentDrivers.length === 0 ? (
          <div className="bg-slate-800/20 border-2 border-dashed border-slate-800 rounded-[2rem] py-16 text-center">
            <UserPlus size={48} className="mx-auto text-slate-700 mb-4" />
            <h3 className="text-xl font-bold text-slate-400">Sem Pilotos</h3>
            <p className="text-slate-500 mt-2">Você precisa contratar pilotos para correr.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentDrivers.map(driver => (
              <div key={driver.id} className="bg-slate-800/50 border border-slate-700 p-6 rounded-[2rem] flex flex-col gap-6 relative overflow-hidden">
                 <div className="flex gap-6">
                   <div className="relative">
                      <img src={driver.image} alt="" className="w-24 h-24 rounded-3xl object-cover border-2 border-slate-700" />
                      <div className="absolute -top-2 -left-2 bg-slate-900 text-white w-8 h-8 rounded-lg flex items-center justify-center font-black italic border border-slate-700 text-xs">#{driver.number || '??'}</div>
                   </div>
                   <div className="flex-1 space-y-4">
                      <div>
                         <h3 className="text-xl font-black uppercase italic text-white leading-tight">{driver.name}</h3>
                         <div className="flex items-center gap-4 mt-1">
                            <span className="text-[9px] font-black text-slate-500 uppercase">OVR: <span className="text-emerald-400">{driver.ovr}</span></span>
                            <span className="text-[9px] font-black text-slate-500 uppercase">Salário/Corrida: <span className="text-emerald-400">{formatCurrency(driver.salary / 5)}</span></span>
                         </div>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase">
                          <span>Duração do Contrato</span>
                          <span className={driver.contractYears < 0.4 ? 'text-red-400 animate-pulse' : 'text-blue-400'}>
                            {driver.contractYears < 0.4 ? 'EXPIRANDO EM BREVE' : `${driver.contractYears.toFixed(1)} ANOS RESTANTES`}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                           <div className={`h-full transition-all duration-1000 ${driver.contractYears < 0.4 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(100, (driver.contractYears / 3) * 100)}%` }} />
                        </div>
                      </div>
                   </div>
                 </div>

                 <div className="pt-4 border-t border-slate-700/50">
                   {renewalPilot === driver.id ? (
                     <div className="space-y-4 animate-fadeIn">
                        <div className="flex items-center gap-4">
                           <div className="flex-1">
                              <label className="text-[9px] font-black text-slate-500 uppercase block mb-2">Anos de Extensão</label>
                              <div className="flex gap-2">
                                 {[1, 2, 3].map(y => (
                                   <button key={y} onClick={() => setRenewalYears(y)} className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${renewalYears === y ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}>{y}y</button>
                                 ))}
                              </div>
                           </div>
                           <div className="flex-1 text-right">
                              <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Custo Total</p>
                              <p className="text-lg font-black font-mono text-emerald-400">{formatCurrency(calculateRenewalCost(driver, renewalYears))}</p>
                           </div>
                        </div>
                        <div className="flex gap-2">
                           <button onClick={() => setRenewalPilot(null)} className="flex-1 py-3 bg-slate-700 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest">Cancelar</button>
                           <button 
                             disabled={finances < calculateRenewalCost(driver, renewalYears)}
                             onClick={() => {
                               onRenew(driver.id, renewalYears, calculateRenewalCost(driver, renewalYears));
                               setRenewalPilot(null);
                             }}
                             className="flex-1 py-3 bg-white text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-400 hover:text-white transition-all"
                           >
                             Confirmar Renovação
                           </button>
                        </div>
                     </div>
                   ) : (
                     <button onClick={() => { setRenewalPilot(driver.id); setRenewalYears(1); }} className="w-full py-3 bg-slate-700/50 hover:bg-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 transition-all flex items-center justify-center gap-2">
                       <RefreshCcw size={14} /> Estender Vínculo
                     </button>
                   )}
                 </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Free Agents Section */}
      <section>
        <div className="flex justify-between items-end mb-8">
           <div className="space-y-1">
             <h2 className="text-2xl font-black uppercase italic tracking-tight text-white">Mercado de Pilotos</h2>
             <p className="text-slate-500 text-sm font-medium">Analise perfis e negocie contratos oficiais.</p>
           </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
           {freeAgents.slice(0, 6).map(driver => (
             <div key={driver.id} className="bg-slate-800/40 border border-slate-800 rounded-[2.5rem] overflow-hidden group hover:border-slate-500 transition-all shadow-xl">
                <div className="h-32 bg-gradient-to-br from-slate-700 to-slate-900 relative">
                   <img src={driver.image} alt="" className="absolute -bottom-4 left-6 w-24 h-24 rounded-2xl border-2 border-slate-700 shadow-2xl bg-slate-800" />
                   <div className="absolute top-4 right-6 text-2xl font-black italic text-white/10">{driver.ovr}</div>
                </div>
                <div className="p-8 pt-8 space-y-4">
                   <h3 className="text-xl font-black uppercase italic text-white truncate">{driver.name}</h3>
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <p className="text-[8px] font-black text-slate-500 uppercase">Salário Esperado</p>
                       <p className="text-xs font-black text-emerald-400">{formatCurrency(driver.salary)}/y</p>
                     </div>
                     <div>
                       <p className="text-[8px] font-black text-slate-500 uppercase">Interesse</p>
                       <p className="text-xs font-black text-blue-400">ALTO</p>
                     </div>
                   </div>
                   <button 
                     onClick={() => setSelectedProfile(driver)}
                     className="w-full py-4 bg-slate-100 hover:bg-white text-slate-950 rounded-2xl font-black uppercase italic tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 shadow-lg"
                   >
                     <Info size={14} /> Analisar Proposta
                   </button>
                </div>
             </div>
           ))}
        </div>
      </section>
      
      {/* Regular Grid Section */}
      <section>
         <h2 className="text-xl font-black uppercase italic text-slate-600 mb-6 flex items-center gap-3">
           <Star size={18} /> Scouting Report 2025
         </h2>
         <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {availableDrivers.map(driver => (
              <div 
                key={driver.id} 
                className={`bg-slate-800/20 border border-slate-800 p-4 rounded-2xl group hover:bg-slate-800/40 transition-all cursor-pointer ${currentDrivers.some(cd => cd.id === driver.id) ? 'opacity-40 grayscale pointer-events-none' : ''}`} 
                onClick={() => setSelectedProfile(driver)}
              >
                 <div className="flex items-center gap-3 mb-2">
                    <img src={driver.image} alt="" className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-700" />
                    <div className="flex-1 min-w-0">
                       <p className="text-[10px] font-black text-white uppercase truncate">{driver.name}</p>
                       <p className="text-[8px] font-bold text-slate-500">#{driver.number || '??'}</p>
                    </div>
                 </div>
                 <div className="flex justify-between items-center">
                    <div className="text-[8px] font-black text-slate-600">OVR {driver.ovr}</div>
                    <div className="text-[8px] font-black text-emerald-600/50">SCOUTED</div>
                 </div>
              </div>
            ))}
         </div>
      </section>
    </div>
  );
};

export default DriverMarket;
