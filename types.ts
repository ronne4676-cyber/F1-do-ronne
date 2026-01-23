
export enum Category {
  F1 = 'F1',
  F2 = 'F2'
}

export enum RaceStrategy {
  AGGRESSIVE = 'AGGRESSIVE',
  BALANCED = 'BALANCED',
  CONSERVATIVE = 'CONSERVATIVE'
}

export enum Weather {
  SUNNY = 'SUNNY',
  CLOUDY = 'CLOUDY',
  RAIN = 'RAIN',
  STORM = 'STORM'
}

export enum TireCompound {
  SOFT = 'SOFT',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  INTERMEDIATE = 'INTERMEDIATE',
  WET = 'WET'
}

export interface Track {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  laps: number;
  type: 'High Speed' | 'Technical' | 'Street' | 'Balanced';
}

export interface Driver {
  id: string;
  name: string;
  ovr: number;
  contractYears: number;
  salary: number;
  image: string;
  history?: string[];
  interestedTeams?: string[];
  number?: number;
}

export interface Engine {
  id: string;
  name: string;
  power: number;
  reliability: number;
  cost: number;
  brand: 'Ferrari' | 'Mercedes' | 'Renault' | 'Honda' | 'Audi';
  condition: number; // 0-100
}

export interface CarStats {
  power: number;
  aero: number;
  reliability: number;
  ers: number;
}

export interface Penalty {
  id: string;
  type: string;
  pointsLost: number;
  cost: number;
  reason: string;
  timestamp: number;
  secondsToServe?: number;
  isResolved?: boolean;
}

export interface UpgradeRecord {
  id: string;
  stat: 'power' | 'aero' | 'reliability' | 'ers';
  increment: number;
  cost: number;
  timestamp: number;
}

export interface Team {
  id: string;
  name: string;
  category: Category;
  finances: number;
  points: number;
  car: CarStats;
  drivers: Driver[];
  engine: Engine;
  penalties: Penalty[];
  upgrades: UpgradeRecord[];
  color?: string;
  logo?: string;
}

export interface RaceResult {
  teamId: string;
  teamName: string;
  position: number;
  performance: number;
  commentary: string;
  currentGap?: number;
  servedPenalty?: boolean;
  tireWear: number;
  engineCondition: number;
  dnf?: boolean;
}

export interface GameState {
  userTeam: Team;
  rivalTeams: Team[];
  currentRound: number;
  isSetupComplete: boolean;
  history: {
    round: number;
    trackName: string;
    results: RaceResult[];
    interview?: string;
  }[];
}
