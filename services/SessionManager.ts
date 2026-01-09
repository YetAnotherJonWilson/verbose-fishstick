/**
 * Session management for user authentication and data loading
 */

import { getMeditationSessions, getPresets } from './API';
import { storeManager } from './Store';
import {
  restoreSession as restoreAuthSession,
  getUserProfile,
  getSession,
} from './Auth';

/**
 * Update the user info display elements
 */
export async function updateUserInfo(): Promise<void> {
  try {
    const profile = await getUserProfile();

    const userDisplayNameEl = document.getElementById(
      'userDisplayName'
    ) as HTMLElement;
    const userHandleEl = document.getElementById('userHandle') as HTMLElement;
    const userDidEl = document.getElementById('userDid') as HTMLElement;

    userDisplayNameEl.textContent = profile.displayName;
    userHandleEl.textContent = profile.handle;
    userDidEl.textContent = profile.did;
  } catch (error) {
    console.error('Failed to update user info:', error);
  }
}

/**
 * Load user data (meditation sessions and presets) into the store
 */
export async function loadUserData(): Promise<void> {
  if (!getSession()) return;

  try {
    // Fetch meditation sessions and update the Store
    const sessionsResponse = await getMeditationSessions();
    storeManager.setMeditationSessions(sessionsResponse.meditationSessions);
    console.log(
      `Loaded ${sessionsResponse.meditationSessions.length} meditation sessions`
    );

    // Fetch presets and update the Store
    const presetsResponse = await getPresets();
    storeManager.setPresets(presetsResponse.presets);
    console.log(`Loaded ${presetsResponse.presets.length} presets`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to load user data:', errorMsg);
  }
}

/**
 * Attempt to restore an existing session
 * @returns session result if successful, null otherwise
 */
export async function restoreSession(): Promise<{
  session: { sub: string };
  state?: string;
} | null> {
  try {
    return await restoreAuthSession();
  } catch (error) {
    console.error('Session restoration error:', error);
    return null;
  }
}
