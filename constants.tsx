
import { Team, Category, Engine, Driver, CarStats, Track } from './types';

export const CALENDAR: Track[] = [
  { id: 'bhr', name: 'Bahrain International', country: 'Bahrein', countryCode: 'BH', laps: 57, type: 'Balanced' },
  { id: 'jed', name: 'Jeddah Corniche', country: 'Arábia Saudita', countryCode: 'SA', laps: 50, type: 'High Speed' },
  { id: 'mel', name: 'Albert Park', country: 'Austrália', countryCode: 'AU', laps: 58, type: 'Technical' },
  { id: 'suz', name: 'Suzuka Circuit', country: 'Japão', countryCode: 'JP', laps: 53, type: 'Technical' },
  { id: 'mia', name: 'Miami International', country: 'EUA', countryCode: 'US', laps: 57, type: 'Street' },
  { id: 'mon', name: 'Circuit de Monaco', country: 'Mônaco', countryCode: 'MC', laps: 78, type: 'Street' },
  { id: 'sil', name: 'Silverstone Circuit', country: 'Reino Unido', countryCode: 'GB', laps: 52, type: 'High Speed' },
  { id: 'spa', name: 'Spa-Francorchamps', country: 'Bélgica', countryCode: 'BE', laps: 44, type: 'High Speed' },
  { id: 'monz', name: 'Autodromo di Monza', country: 'Itália', countryCode: 'IT', laps: 53, type: 'High Speed' },
  { id: 'int', name: 'Interlagos', country: 'Brasil', countryCode: 'BR', laps: 71, type: 'Technical' },
  { id: 'yasm', name: 'Yas Marina', country: 'Abu Dhabi', countryCode: 'AE', laps: 58, type: 'Balanced' },
];

export const ENGINES: Engine[] = [
  // Added condition: 100 to meet the Engine type requirement
  { id: 'eng_ferrari', name: 'Ferrari Tipo 066/12', brand: 'Ferrari', power: 1000, reliability: 85, cost: 15000000, condition: 100 },
  { id: 'eng_merc', name: 'Mercedes-AMG M15 E', brand: 'Mercedes', power: 990, reliability: 95, cost: 14000000, condition: 100 },
  { id: 'eng_honda', name: 'Honda RBPTH002', brand: 'Honda', power: 995, reliability: 92, cost: 14500000, condition: 100 },
  { id: 'eng_honda_ra624h', name: 'Honda RA624H', brand: 'Honda', power: 970, reliability: 93, cost: 14500000, condition: 100 },
  { id: 'eng_renault', name: 'Renault E-Tech RE24', brand: 'Renault', power: 975, reliability: 80, cost: 11000000, condition: 100 },
];

export const INITIAL_CAR_STATS: CarStats = {
  power: 900,
  aero: 85,
  reliability: 80,
  ers: 50
};

// Piltotos 2025 e Free Agents
export const ALL_DRIVERS: Driver[] = [
  // Red Bull
  { id: 'd_max', name: 'Max Verstappen', ovr: 96, contractYears: 4, salary: 55000000, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Max', number: 1 },
  { id: 'd_checo', name: 'Sergio Perez', ovr: 86, contractYears: 1, salary: 10000000, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Checo', number: 11 },
  // Ferrari
  { id: 'd_ham', name: 'Lewis Hamilton', ovr: 95, contractYears: 2, salary: 50000000, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lewis', number: 44 },
  { id: 'd_leclerc', name: 'Charles Leclerc', ovr: 93, contractYears: 3, salary: 35000000, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charles', number: 16 },
  // Mercedes
  { id: 'd_russell', name: 'George Russell', ovr: 91, contractYears: 2, salary: 18000000, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=George', number: 63 },
  { id: 'd_kimi', name: 'Kimi Antonelli', ovr: 82, contractYears: 3, salary: 2000000, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kimi', number: 12 },
  // McLaren
  { id: 'd_norris', name: 'Lando Norris', ovr: 92, contractYears: 3, salary: 20000000, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lando', number: 4 },
  { id: 'd_piastri', name: 'Oscar Piastri', ovr: 89, contractYears: 3, salary: 12000000, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Oscar', number: 81 },
  // Aston Martin
  { id: 'd_alonso', name: 'Fernando Alonso', ovr: 92, contractYears: 2, salary: 18000000, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fernando', number: 14 },
  { id: 'd_stroll', name: 'Lance Stroll', ovr: 82, contractYears: 1, salary: 10000000, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lance', number: 18 },
  // Alpine
  { id: 'd_gasly', name: 'Pierre Gasly', ovr: 87, contractYears: 2, salary: 15000000, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pierre', number: 10 },
  { id: 'd_doohan', name: 'Jack Doohan', ovr: 78, contractYears: 2, salary: 1000000, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack', number: 7 },
  // Williams
  { id: 'd_albon', name: 'Alex Albon', ovr: 88, contractYears: 2, salary: 12000000, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex', number: 23 },
  { id: 'd_sainz', name: 'Carlos Sainz', ovr: 91, contractYears: 2, salary: 20000000, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos', number: 55 },
  // Haas
  { id: 'd_ocon', name: 'Esteban Ocon', ovr: 86, contractYears: 2, salary: 12000000, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Esteban', number: 31 },
  { id: 'd_bearman', name: 'Oliver Bearman', ovr: 80, contractYears: 2, salary: 1000000, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver', number: 87 },
  // VCARB
  { id: 'd_tsunoda', name: 'Yuki Tsunoda', ovr: 85, contractYears: 1, salary: 5000000, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Yuki', number: 22 },
  { id: 'd_lawson', name: 'Liam Lawson', ovr: 82, contractYears: 1, salary: 2000000, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Liam', number: 30 },
  // Sauber
  { id: 'd_hulkenberg', name: 'Nico Hulkenberg', ovr: 86, contractYears: 2, salary: 8000000, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nico', number: 27 },
  { id: 'd_bortoleto', name: 'Gabriel Bortoleto', ovr: 79, contractYears: 3, salary: 1500000, image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Gabriel', number: 5 },

  // --- FREE AGENTS ---
  { 
    id: 'd_vettel', 
    name: 'Sebastian Vettel', 
    ovr: 92, 
    contractYears: 0, 
    salary: 25000000, 
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sebastian', 
    number: 5,
    history: ['Red Bull Racing (2009-2014)', 'Ferrari (2015-2020)', 'Aston Martin (2021-2022)'],
    interestedTeams: ['Audi', 'Mercedes-AMG']
  },
  { 
    id: 'd_ricciardo', 
    name: 'Daniel Ricciardo', 
    ovr: 84, 
    contractYears: 0, 
    salary: 12000000, 
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ricciardo', 
    number: 3,
    history: ['Red Bull', 'Renault', 'McLaren', 'VCARB'],
    interestedTeams: ['Haas', 'Williams']
  },
  { 
    id: 'd_bottas', 
    name: 'Valtteri Bottas', 
    ovr: 85, 
    contractYears: 0, 
    salary: 10000000, 
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Valtteri', 
    number: 77,
    history: ['Williams', 'Mercedes', 'Sauber'],
    interestedTeams: ['Alpine', 'Sauber']
  },
  { 
    id: 'd_zhou', 
    name: 'Guanyu Zhou', 
    ovr: 80, 
    contractYears: 0, 
    salary: 5000000, 
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zhou', 
    number: 24,
    history: ['Alfa Romeo', 'Sauber'],
    interestedTeams: ['Haas']
  },
  { 
    id: 'd_magnussen', 
    name: 'Kevin Magnussen', 
    ovr: 82, 
    contractYears: 0, 
    salary: 6000000, 
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kevin', 
    number: 20,
    history: ['McLaren', 'Renault', 'Haas'],
    interestedTeams: ['Williams']
  }
];

export const INITIAL_DRIVERS = ALL_DRIVERS.slice(0, 4);

export const TEAM_TEMPLATES = [
  { 
    id: 'red_bull', 
    name: 'Oracle Red Bull Racing', 
    description: 'A força dominante de Milton Keynes, mestres da aerodinâmica liderados por Adrian Newey.', 
    color: '#3671C6', 
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b4/Red_Bull_Racing_logo.svg/512px-Red_Bull_Racing_logo.svg.png',
    bonus: 'Eficiência Aero (+5%)',
    startingFinances: 100000000,
    driverIds: ['d_max', 'd_checo']
  },
  { 
    id: 'mercedes', 
    name: 'Mercedes-AMG Petronas', 
    description: 'Os "Silver Arrows" buscam recuperar seu trono com excelência técnica e consistência.', 
    color: '#27F4D2', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Mercedes_AMG_Petronas_F1_Logo.svg/512px-Mercedes_AMG_Petronas_F1_Logo.svg.png',
    bonus: 'Confiabilidade (+5%)',
    startingFinances: 95000000,
    driverIds: ['d_russell', 'd_kimi']
  },
  { 
    id: 'ferrari', 
    name: 'Scuderia Ferrari', 
    description: 'O coração pulsante da F1. Maranello busca o fim do jejum de títulos com o motor mais potente.', 
    color: '#E80020', 
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d1/Scuderia_Ferrari_logo.svg/400px-Scuderia_Ferrari_logo.svg.png',
    bonus: 'Velocidade Final (+5%)',
    startingFinances: 95000000,
    driverIds: ['d_ham', 'd_leclerc']
  },
  { 
    id: 'mclaren', 
    name: 'McLaren Formula 1 Team', 
    description: 'A equipe Papaia de Woking renascida, focada em inovação e velocidade pura.', 
    color: '#FF8000', 
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/66/McLaren_Racing_logo.svg/512px-McLaren_Racing_logo.svg.png',
    bonus: 'ERS Avançado (+5%)',
    startingFinances: 90000000,
    driverIds: ['d_norris', 'd_piastri']
  },
  { 
    id: 'aston_martin', 
    name: 'Aston Martin Aramco', 
    description: 'Ambição sem limites no novo campus tecnológico em Silverstone.', 
    color: '#229971', 
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/be/Aston_Martin_Aramco_F1_Team_logo.svg/512px-Aston_Martin_Aramco_F1_Team_logo.svg.png',
    bonus: 'P&D Acelerado (-10% custo)',
    startingFinances: 85000000,
    driverIds: ['d_alonso', 'd_stroll']
  },
  { 
    id: 'alpine', 
    name: 'BWT Alpine F1 Team', 
    description: 'A equipe de Enstone representando a excelência esportiva francesa da Renault.', 
    color: '#0093CC', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Alpine_F1_Team_Logo.svg/512px-Alpine_F1_Team_Logo.svg.png',
    bonus: 'Peso Mínimo (+2% Aero)',
    startingFinances: 80000000,
    driverIds: ['d_gasly', 'd_doohan']
  },
  { 
    id: 'williams', 
    name: 'Williams Racing', 
    description: 'Uma das equipes mais vitoriosas da história, focada em retornar ao topo do grid.', 
    color: '#64C4FF', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Williams_Racing_logo_2020.svg/512px-Williams_Racing_logo_2020.svg.png',
    bonus: 'Foco em Qualificação (+3%)',
    startingFinances: 75000000,
    driverIds: ['d_albon', 'd_sainz']
  },
  { 
    id: 'visa_rb', 
    name: 'Visa Cash App RB', 
    description: 'A nova era da equipe de Faenza, combinando energia jovem com tecnologia Red Bull.', 
    color: '#6692FF', 
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e0/Visa_Cash_App_RB_F1_Team_logo.svg/512px-Visa_Cash_App_RB_F1_Team_logo.svg.png',
    bonus: 'Agilidade em Pitstop (+2%)',
    startingFinances: 75000000,
    driverIds: ['d_tsunoda', 'd_lawson']
  },
  { 
    id: 'haas', 
    name: 'MoneyGram Haas F1 Team', 
    description: 'O jeito americano de correr, focada em eficiência máxima e parcerias estratégicas.', 
    color: '#B6BABD', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Haas_F1_Team_logo.svg/512px-Haas_F1_Team_logo.svg.png',
    bonus: 'Economia Financeira (+5M)',
    startingFinances: 70000000,
    driverIds: ['d_ocon', 'd_bearman']
  },
  { 
    id: 'sauber', 
    name: 'Stake F1 Team Kick Sauber', 
    description: 'Identidade vibrante e audaciosa enquanto preparam o caminho para o futuro.', 
    color: '#52E252', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Sauber_F1_Team_logo.svg/512px-Sauber_F1_Team_logo.svg.png',
    bonus: 'Gestão de Pneus (+4%)',
    startingFinances: 70000000,
    driverIds: ['d_hulkenberg', 'd_bortoleto']
  }
];

export const RIVAL_NAMES = TEAM_TEMPLATES.map(t => t.name);

export const PENALTY_REASONS = [
  "Troca de caixa de câmbio fora da alocação",
  "Exceder os limites de pista repetidamente",
  "Causar uma colisão na Curva 1",
  "Liberação insegura durante o pitstop",
  "Exceder o teto orçamentário (Erro administrativo)",
  "Substituição de componente da Unidade de Potência (5º ICE)"
];

export const UPGRADES = {
  power: {
    increment: 10,
    max: 1100,
    baseCost: 4000000,
    costMultiplier: 1.2
  },
  aero: {
    increment: 2,
    max: 100,
    baseCost: 3000000,
    costMultiplier: 1.15
  },
  reliability: {
    increment: 2,
    max: 100,
    baseCost: 2500000,
    costMultiplier: 1.1
  },
  ers: {
    increment: 5,
    max: 100,
    baseCost: 3500000,
    costMultiplier: 1.25
  }
};
