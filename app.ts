import {
  BrowserOAuthClient,
  OAuthSession,
} from '@atproto/oauth-client-browser';
import { Agent } from '@atproto/api';
import { atprotoLoopbackClientMetadata } from '@atproto/oauth-types';
import { getMeditationSessions } from './services/API';
import Store from './services/Store';

// Type definitions
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

// Global variables
let oauthClient: BrowserOAuthClient;
export let session: OAuthSession | null = null;

async function initOAuthClient(): Promise<void> {
  try {
    oauthClient = new BrowserOAuthClient({
      handleResolver: 'https://bsky.social',
      clientMetadata: atprotoLoopbackClientMetadata(
        `http://localhost?${new URLSearchParams([
          ['redirect_uri', `http://127.0.0.1:8080`],
          ['scope', `atproto transition:generic`],
        ])}`
      ),
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    showStatus('loginStatus', `Error: ${errorMsg}`, true);
  }
}

// Initialize on page load
initOAuthClient();

window.addEventListener('DOMContentLoaded', async () => {
  // Check for existing session on load
  // Check both query string and hash fragment
  const queryParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.slice(1)); // Remove the '#'

  const isOAuthCallback =
    queryParams.has('code') ||
    queryParams.has('error') ||
    hashParams.has('code') ||
    hashParams.has('error');

  if (isOAuthCallback) {
    showLoadingScreen();
  }

  await restoreSession();

  // Set up login form event listener
  document
    .getElementById('loginForm')!
    .addEventListener('submit', async (e: Event) => {
      e.preventDefault();

      const handleInput = document.getElementById(
        'handleInput'
      ) as HTMLInputElement;
      const handle = handleInput.value.trim();

      if (!handle) {
        showStatus('loginStatus', 'Please enter your handle', true);
        return;
      }

      try {
        showStatus('loginStatus', 'Redirecting to sign in...');

        // Start OAuth flow with granular permissions for our custom collections
        await oauthClient.signIn(handle, {
          state: JSON.stringify({ returnTo: window.location.href }),
          signal: new AbortController().signal,
        });
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : 'Unknown error';
        showStatus('loginStatus', `Login failed: ${errorMsg}`, true);
      }
    });

  // Set up logout button event listener
  document
    .getElementById('logoutButton')!
    .addEventListener('click', async () => {
      try {
        if (session) {
          await oauthClient.revoke(session.sub);
        }

        // Clear local session
        session = null;

        // Show login screen
        showLoginScreen();
        showStatus('loginStatus', 'Signed out successfully');
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : 'Unknown error';
        showStatus('appStatus', `Logout failed: ${errorMsg}`, true);
      }
    });
});

// Restore session from storage
async function restoreSession(): Promise<void> {
  try {
    // Try to initialize/restore the session
    const result = await oauthClient.init();

    if (result) {
      session = result.session;
      showAppScreen();
      updateUserInfo();
      loadUserData();

      if (result.state) {
        console.log(
          `${session.sub} was successfully authenticated (state: ${result.state})`
        );
      } else {
        console.log(`${session.sub} was restored (last active session)`);
      }
    } else {
      showLoginScreen();
    }
  } catch (error) {
    console.error('Session restoration error:', error);
    showLoginScreen();
  }
}

async function updateUserInfo(): Promise<void> {
  if (!session) return;

  const agent = new Agent(session);

  try {
    // TODO: Using describeRepo for now to work with basic atproto scope, need to investigate
    // scopes further for getProfile access (and possibly read/write permissions)
    const repo = await agent.com.atproto.repo.describeRepo({
      repo: session.sub,
    });

    const userHandleEl = document.getElementById('userHandle') as HTMLElement;
    const userDidEl = document.getElementById('userDid') as HTMLElement;

    userHandleEl.textContent = repo.data.handle;
    userDidEl.textContent = session.sub;
  } catch (error) {
    // Fallback: just show DID
    const userHandleEl = document.getElementById('userHandle') as HTMLElement;
    const userDidEl = document.getElementById('userDid') as HTMLElement;

    userHandleEl.textContent = session.sub;
    userDidEl.textContent = '(handle unavailable in loopback mode)';
  }
}

async function loadUserData(): Promise<void> {
  if (!session) return;

  try {
    // Fetch meditation sessions and update the Store
    const response = await getMeditationSessions();
    Store.meditationSessions = response.meditationSessions;
    console.log(
      `Loaded ${response.meditationSessions.length} meditation sessions`
    );
    console.log(Store.meditationSessions);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to load meditation sessions:', errorMsg);
  }
}

// UI Helper functions
function showLoadingScreen(): void {
  document.getElementById('loadingSection')!.classList.add('active');
  document.getElementById('loginSection')!.classList.remove('active');
  document.getElementById('appSection')!.classList.remove('active');
}

function showLoginScreen(): void {
  document.getElementById('loadingSection')!.classList.remove('active');
  document.getElementById('loginSection')!.classList.add('active');
  document.getElementById('appSection')!.classList.remove('active');
}

function showAppScreen(): void {
  document.getElementById('loadingSection')!.classList.remove('active');
  document.getElementById('loginSection')!.classList.remove('active');
  document.getElementById('appSection')!.classList.add('active');
}

function showStatus(
  elementId: string,
  message: string,
  isError: boolean = false
): void {
  const statusEl = document.getElementById(elementId) as HTMLElement;
  statusEl.textContent = message;
  statusEl.style.display = 'block';

  if (isError) {
    statusEl.classList.add('error');
  } else {
    statusEl.classList.remove('error');
  }
}
