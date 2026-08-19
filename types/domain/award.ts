import { AwardCategory } from './tournament';

export enum AwardSource {
  SYSTEM = 'SYSTEM',

  MANUAL = 'MANUAL',
}

export interface Award {
  id: string;

  seasonId: string;

  playerId: string;

  name: string;

  category: AwardCategory;

  description?: string;
}

export interface ManualAwardRequest {
  seasonId: string;

  playerId: string;

  name: string;

  description?: string;
}
