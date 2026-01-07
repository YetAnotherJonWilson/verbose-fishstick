/**
 * Shared type definitions for the meditation app
 */

export interface SoundInterval {
  time: number;
  soundType: string;
}

export interface MeditationSessionData {
  uri: string;
  cid: string;
  createdAt: string;
  duration: number;
  presetId: string | null;
  notes: string | null;
}

export interface PresetData {
  uri: string;
  cid: string;
  name: string;
  duration: number;
  createdAt: string;
  soundIntervals: SoundInterval[];
}

export interface PaginationOptions {
  limit?: number;
  cursor?: string | null;
  reverse?: boolean;
}

export interface MeditationSessionsResponse {
  meditationSessions: MeditationSessionData[];
  cursor: string | null;
  total: number;
}

export interface PresetsResponse {
  presets: PresetData[];
  cursor: string | null;
  total: number;
}

export interface CreateRecordResponse {
  uri: string;
  cid: string;
  validationStatus?: string;
}

export interface StoreType {
  meditationSessions: MeditationSessionData[];
  presets: PresetData[];
}
