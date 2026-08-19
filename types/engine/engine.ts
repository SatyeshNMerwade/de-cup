import { Match } from '../domain/match';
import { RuleSet } from '../domain/rule';
import { Season } from '../domain/season';

export interface EngineContext {
  season: Season;

  rules: RuleSet;

  matches: Match[];
}

export interface EngineResult<T> {
  success: boolean;

  data: T;

  generatedAt: Date;
}
