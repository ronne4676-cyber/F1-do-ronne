
import React, { useState } from 'react';
import { Team, Driver } from '../types';
import { Image, Upload, User, Shield, Check, Save, X } from 'lucide-react';

interface DataPackEditorProps {
  userTeam: Team;
  rivals: Team[];
  onUpdate: (updatedUser: Team, updatedRivals: Team[]) => void;
}

const DataPackEditor: React.FC<DataPackEditorProps> = ({ userTeam, rivals, onUpdate }) => {
  const [selectedEntity, setSelectedEntity] = useState<{ type: 'team' | 'driver', id: string } | null>(null);
  const [tempUrl, setTempUrl] = useState('');

  const allTeams = [userTeam, ...rivals];
  const allDrivers = allTeams.flatMap(t => t.drivers);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveChanges = () => {
    if (!selectedEntity) return;

    let updatedUser = { ...userTeam };
    let updatedRivals = [...rivals];

    if (selectedEntity.type === 'team') {
      if (userTeam.id === selectedEntity.id) {
        updatedUser.logo = tempUrl;
      } else {
        updatedRivals = updatedRivals.map(r => r.id === selectedEntity.id ? { ...r, logo: tempUrl } : r);
      }
    } else {
      updatedUser.drivers = updatedUser.drivers.map(d => d.id === selectedEntity.id ? { ...d, image: tempUrl } : d);
      updatedRivals = updatedRivals.map(r => ({
        ...r,
        drivers: r.drivers.map(d => d.id === selectedEntity.id ? { ...d, image: tempUrl } : d)
      }));
    }

    onUpdate(updatedUser, updatedRivals);
    setSelectedEntity(null);
    setTempUrl('');
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-3xl">
        <h2 className="text-xl font-black uppercase italic tracking-tight mb-4 flex items-center gap-2">
          <Shield className="text-blue-400" size={20} /> Central de Data Packs
        </h2>
        <p className="text-slate-500 text-sm mb-6">Personalize sua experiência injetando logos de equipes e fotos de pilotos customizadas.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* List Entities */}
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Selecione uma Entidade</h3>
            
            {allTeams.map(team => (
              <button 
                key={team.id}
                onClick={() => { setSelectedEntity({ type: 'team', id: team.id }); setTempUrl(team.logo || ''); }}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${selectedEntity?.id === team.id ? 'bg-blue-600/10 border-blue-500' : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-white/5 p-1 flex items-center justify-center overflow-hidden">
                    {team.logo ? <img src={team.logo} className="w-full h-full object-contain" /> : <Shield size={14} />}
                  </div>
                  <span className="text-xs font-bold text-white uppercase">{team.name}</span>
                </div>
                <div className="text-[8px] font-black text-slate-500 uppercase">Equipe</div>
              </button>
            ))}

            <div className="pt-4" />
            
            {allDrivers.map(driver => (
              <button 
                key={driver.id}
                onClick={() => { setSelectedEntity({ type: 'driver', id: driver.id }); setTempUrl(driver.image); }}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${selectedEntity?.id === driver.id ? 'bg-emerald-600/10 border-emerald-500' : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                    <img src={driver.image} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs font-bold text-white uppercase">{driver.name}</span>
                </div>
                <div className="text-[8px] font-black text-slate-500 uppercase">Piloto</div>
              </button>
            ))}
          </div>

          {/* Editor Panel */}
          <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
            {!selectedEntity ? (
              <div className="text-slate-600">
                <Image size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-sm font-bold italic">Selecione uma equipe ou piloto para editar os ativos visuais.</p>
              </div>
            ) : (
              <div className="w-full space-y-6">
                <h4 className="text-xs font-black uppercase tracking-widest text-blue-400">Editor Visual</h4>
                
                <div className="w-32 h-32 mx-auto rounded-2xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center overflow-hidden shadow-2xl">
                  {tempUrl ? <img src={tempUrl} className="w-full h-full object-contain" /> : <Upload size={32} className="text-slate-600" />}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase block mb-2 text-left">URL da Imagem (PNG/JPG)</label>
                    <input 
                      type="text" 
                      value={tempUrl}
                      onChange={(e) => setTempUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="relative">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden" 
                      id="file-upload" 
                    />
                    <label 
                      htmlFor="file-upload" 
                      className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-300 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Upload size={14} /> Carregar Arquivo Local
                    </label>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button 
                      onClick={() => setSelectedEntity(null)}
                      className="flex-1 py-3 bg-slate-900 text-slate-500 rounded-xl text-[10px] font-black uppercase"
                    >
                      Descartar
                    </button>
                    <button 
                      onClick={saveChanges}
                      className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Save size={14} /> Salvar Pack
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataPackEditor;
