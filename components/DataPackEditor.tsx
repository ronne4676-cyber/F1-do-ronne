
import React, { useState } from 'react';
import { Team, Driver } from '../types';
import { Image, Upload, User, Shield, Check, Save, X, Palette } from 'lucide-react';

interface DataPackEditorProps {
  userTeam: Team;
  rivals: Team[];
  onUpdate: (updatedUser: Team, updatedRivals: Team[]) => void;
}

const DataPackEditor: React.FC<DataPackEditorProps> = ({ userTeam, rivals, onUpdate }) => {
  const [selectedEntity, setSelectedEntity] = useState<{ type: 'team' | 'driver', id: string } | null>(null);
  const [tempUrl, setTempUrl] = useState('');
  const [tempColor, setTempColor] = useState('#ff0000');

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
        updatedUser.color = tempColor;
      } else {
        updatedRivals = updatedRivals.map(r => r.id === selectedEntity.id ? { ...r, logo: tempUrl, color: tempColor } : r);
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
          <Shield className="text-blue-400" size={20} /> Personalização da Identidade
        </h2>
        <p className="text-slate-500 text-sm mb-6">Modifique logos, fotos e as cores oficiais da sua escuderia.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* List Entities */}
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Selecione para Editar</h3>
            
            {allTeams.map(team => (
              <button 
                key={team.id}
                onClick={() => { 
                  setSelectedEntity({ type: 'team', id: team.id }); 
                  setTempUrl(team.logo || '');
                  setTempColor(team.color || '#ff0000');
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${selectedEntity?.id === team.id ? 'bg-blue-600/10 border-blue-500' : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-white/5 p-1 flex items-center justify-center overflow-hidden border border-white/10" style={{ borderColor: team.color }}>
                    {team.logo ? <img src={team.logo} className="w-full h-full object-contain" /> : <Shield size={14} />}
                  </div>
                  <span className="text-xs font-bold text-white uppercase">{team.name}</span>
                </div>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />
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
          <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center">
            {!selectedEntity ? (
              <div className="text-slate-600 text-center">
                <Image size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-sm font-bold italic">Selecione uma equipe ou piloto para editar.</p>
              </div>
            ) : (
              <div className="w-full space-y-6">
                <h4 className="text-xs font-black uppercase tracking-widest text-blue-400 text-center">Configurações de Ativos</h4>
                
                <div className="w-32 h-32 mx-auto rounded-2xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center overflow-hidden shadow-2xl relative" style={{ borderColor: tempColor }}>
                  {tempUrl ? <img src={tempUrl} className="w-full h-full object-contain" /> : <Upload size={32} className="text-slate-600" />}
                </div>

                <div className="space-y-4">
                  {selectedEntity.type === 'team' && (
                    <div>
                      <label className="text-[9px] font-black text-slate-500 uppercase block mb-2 flex items-center gap-2">
                        <Palette size={12} /> Cor Primária da Equipe
                      </label>
                      <div className="flex items-center gap-4 bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <input 
                          type="color" 
                          value={tempColor}
                          onChange={(e) => setTempColor(e.target.value)}
                          className="w-12 h-10 bg-transparent cursor-pointer rounded overflow-hidden"
                        />
                        <span className="text-xs font-mono font-bold text-white uppercase">{tempColor}</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-[9px] font-black text-slate-500 uppercase block mb-2">URL da Imagem</label>
                    <input 
                      type="text" 
                      value={tempUrl}
                      onChange={(e) => setTempUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-white focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button 
                      onClick={() => setSelectedEntity(null)}
                      className="flex-1 py-3 bg-slate-900 text-slate-500 rounded-xl text-[10px] font-black uppercase"
                    >
                      X Cancelar
                    </button>
                    <button 
                      onClick={saveChanges}
                      className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Save size={14} /> Aplicar Mudanças
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
