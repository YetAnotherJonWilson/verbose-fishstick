import {
  OAuthSession,
  buildLoopbackClientId,
} from '@atproto/oauth-client-browser';
import { Agent } from '@atproto/api';
import { atprotoLoopbackClientMetadata } from '@atproto/oauth-types';
import { session } from '../app';

// Type definitions (imported from app.ts concepts)
interface SoundInterval {
  time: number;
  soundType: string;
}

interface PaginationOptions {
  limit?: number;
  cursor?: string | null;
  reverse?: boolean;
}

interface MeditationSessionData {
  uri: string;
  cid: string;
  createdAt: string;
  duration: number;
  presetId: string | null;
  notes: string | null;
}

interface MeditationSessionsResponse {
  meditationSessions: MeditationSessionData[];
  cursor: string | null;
  total: number;
}

interface PresetData {
  uri: string;
  cid: string;
  name: string;
  duration: number;
  createdAt: string;
  soundIntervals: SoundInterval[];
}

interface PresetsResponse {
  presets: PresetData[];
  cursor: string | null;
  total: number;
}

interface CreateRecordResponse {
  uri: string;
  cid: string;
  validationStatus?: string;
}

// Helper: Validate session exists
function ensureSession(): OAuthSession {
  if (!session) {
    throw new Error('User not logged in. Please sign in first.');
  }
  return session;
}

// Helper: Create agent instance
function createAgent(): Agent {
  return new Agent(ensureSession());
}

/**
 * Create a new meditation session record
 * @param {number} duration - Duration in seconds (required, must be >= 0)
 * @param {string} presetId - Optional reference to preset used
 * @param {string} notes - Optional user notes (max 1000 chars)
 * @returns {Promise<CreateRecordResponse>} Returns { uri, cid, validationStatus }
 * @throws {Error} If user not logged in or API call fails
 */
async function createMeditationSession(
  duration: number,
  presetId: string | null = null,
  notes: string | null = null
): Promise<CreateRecordResponse> {
  // Parameter validation
  if (typeof duration !== 'number' || duration < 0) {
    throw new Error('Duration must be a non-negative number');
  }

  if (presetId && typeof presetId !== 'string') {
    throw new Error('presetId must be a string');
  }

  if (presetId && presetId.length > 100) {
    throw new Error('presetId cannot exceed 100 characters');
  }

  if (notes && typeof notes !== 'string') {
    throw new Error('notes must be a string');
  }

  if (notes && notes.length > 1000) {
    throw new Error('notes cannot exceed 1000 characters');
  }

  // Build record object
  const record: Record<string, unknown> = {
    $type: 'place.starting.meditationSession',
    createdAt: new Date().toISOString(),
    duration: Math.floor(duration),
  };

  // Add optional fields only if provided
  if (presetId) {
    record.presetId = presetId;
  }
  if (notes) {
    record.notes = notes;
  }

  // Create record via AT Protocol API
  const agent = createAgent();
  const response = await agent.com.atproto.repo.createRecord({
    repo: session!.sub,
    collection: 'place.starting.meditationSession',
    record: record,
  });

  return {
    uri: response.data.uri,
    cid: response.data.cid,
    validationStatus: response.data.validationStatus,
  };
}

/**
 * Create a new meditation preset record
 * @param {string} name - Preset name (required, max 100 chars)
 * @param {number} duration - Duration in seconds (required, must be >= 0)
 * @param {SoundInterval[]} soundIntervals - Optional array of { time, soundType } objects
 * @returns {Promise<CreateRecordResponse>} Returns { uri, cid, validationStatus }
 * @throws {Error} If validation fails or API call fails
 */
async function createPreset(
  name: string,
  duration: number,
  soundIntervals: SoundInterval[] | null = null
): Promise<CreateRecordResponse> {
  // Parameter validation
  if (!name || typeof name !== 'string') {
    throw new Error('name is required and must be a string');
  }

  if (name.length > 100) {
    throw new Error('name cannot exceed 100 characters');
  }

  if (typeof duration !== 'number' || duration < 0) {
    throw new Error('duration must be a non-negative number');
  }

  // Validate sound intervals if provided
  if (soundIntervals) {
    if (!Array.isArray(soundIntervals)) {
      throw new Error('soundIntervals must be an array');
    }

    for (let i = 0; i < soundIntervals.length; i++) {
      const interval = soundIntervals[i];

      if (typeof interval.time !== 'number' || interval.time < 0) {
        throw new Error(
          `soundIntervals[${i}].time must be a non-negative number`
        );
      }

      if (!interval.soundType || typeof interval.soundType !== 'string') {
        throw new Error(
          `soundIntervals[${i}].soundType is required and must be a string`
        );
      }

      if (interval.soundType.length > 50) {
        throw new Error(
          `soundIntervals[${i}].soundType cannot exceed 50 characters`
        );
      }

      if (interval.time > duration) {
        throw new Error(
          `soundIntervals[${i}].time cannot be later than preset duration`
        );
      }
    }
  }

  // Build record object
  const record: Record<string, unknown> = {
    $type: 'place.starting.preset',
    name: name,
    duration: Math.floor(duration),
    createdAt: new Date().toISOString(),
  };

  // Add sound intervals if provided
  if (soundIntervals && soundIntervals.length > 0) {
    record.soundIntervals = soundIntervals;
  }

  // Create record via AT Protocol API
  const agent = createAgent();
  const response = await agent.com.atproto.repo.createRecord({
    repo: session!.sub,
    collection: 'place.starting.preset',
    record: record,
  });

  return {
    uri: response.data.uri,
    cid: response.data.cid,
    validationStatus: response.data.validationStatus,
  };
}

/**
 * Retrieve all meditation sessions with pagination support
 * @param {PaginationOptions} options - Query options
 * @returns {Promise<MeditationSessionsResponse>} Returns { meditationSessions, cursor, total }
 * @throws {Error} If API call fails
 */
async function getMeditationSessions(
  options: PaginationOptions = {}
): Promise<MeditationSessionsResponse> {
  const { limit = 50, cursor = null, reverse = false } = options;

  // Validate pagination parameters
  if (limit < 1 || limit > 100) {
    throw new Error('limit must be between 1 and 100');
  }

  ensureSession();
  const agent = createAgent();

  const queryParams = {
    repo: session!.sub,
    collection: 'place.starting.meditationSession',
    limit: limit,
    reverse: reverse,
    ...(cursor && { cursor }),
  };

  const response = await agent.com.atproto.repo.listRecords(queryParams);

  // Transform response to expose relevant data
  return {
    meditationSessions: response.data.records.map((record) => ({
      uri: record.uri,
      cid: record.cid,
      createdAt: (record.value as Record<string, unknown>).createdAt as string,
      duration: (record.value as Record<string, unknown>).duration as number,
      presetId:
        ((record.value as Record<string, unknown>).presetId as string) || null,
      notes:
        ((record.value as Record<string, unknown>).notes as string) || null,
    })),
    cursor: response.data.cursor || null,
    total: response.data.records.length,
  };
}

/**
 * Retrieve all meditation presets
 * @param {PaginationOptions} options - Query options
 * @returns {Promise<PresetsResponse>} Returns { presets, cursor, total }
 * @throws {Error} If API call fails
 */
async function getPresets(
  options: PaginationOptions = {}
): Promise<PresetsResponse> {
  const { limit = 50, cursor = null, reverse = false } = options;

  // Validate pagination parameters
  if (limit < 1 || limit > 100) {
    throw new Error('limit must be between 1 and 100');
  }

  ensureSession();
  const agent = createAgent();

  const queryParams = {
    repo: session!.sub,
    collection: 'place.starting.preset',
    limit: limit,
    reverse: reverse,
    ...(cursor && { cursor }),
  };

  const response = await agent.com.atproto.repo.listRecords(queryParams);

  // Transform response to expose relevant data
  return {
    presets: response.data.records.map((record) => ({
      uri: record.uri,
      cid: record.cid,
      name: (record.value as Record<string, unknown>).name as string,
      duration: (record.value as Record<string, unknown>).duration as number,
      createdAt: (record.value as Record<string, unknown>).createdAt as string,
      soundIntervals:
        ((record.value as Record<string, unknown>)
          .soundIntervals as SoundInterval[]) || [],
    })),
    cursor: response.data.cursor || null,
    total: response.data.records.length,
  };
}

// Export all API functions
export {
  createMeditationSession,
  createPreset,
  getMeditationSessions,
  getPresets,
};