export type StrengthLevel = 'fair' | 'strong' | 'veryStrong' | 'weak';

export interface Strength {
  level: StrengthLevel;
  score: number;
  missingKey: string | null;
}
