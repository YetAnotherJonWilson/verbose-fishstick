import { getMeditationSessions, getPresets } from './services/API';
import Store, { storeManager } from './services/Store';
import { NavigationManager } from './services/Navigation';
import { createButton } from './services/UIComponents';
import {
  initOAuthClient,
  signIn,
  signOut,
  restoreSession as restoreAuthSession,
  getUserProfile,
  getSession,
} from './services/Auth';

// Global variables
declare global {
  interface Window {
    app: any;
  }
  var app: any;
}

window.app = {};
app.store = Store;

let navigationManager: NavigationManager;

// Initialize Auth on page load
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
        await signIn(handle);
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
        // Clean up any active meditation timers before signing out
        if (navigationManager) {
          navigationManager.cleanup();
        }
        await signOut();
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
    const result = await restoreAuthSession();

    if (result) {
      showAppScreen();
      updateUserInfo();
      await loadUserData();
      initializeMainMenu();

      if (result.state) {
        console.log(
          `${result.session.sub} was successfully authenticated (state: ${result.state})`
        );
      } else {
        console.log(`${result.session.sub} was restored (last active session)`);
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

async function loadUserData(): Promise<void> {
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

function initializeMainMenu(): void {
  // Initialize navigation manager
  navigationManager = new NavigationManager();

  // Get menu container
  const menuContainer = document.getElementById('menuContainer');
  if (!menuContainer) return;

  // Clear existing content
  menuContainer.innerHTML = '';

  // Create the two main menu buttons
  const startMeditationBtn = createButton(
    'Start New Meditation',
    'primary',
    () => {
      navigationManager.showNewMeditationForm();
    }
  );

  const viewSessionsBtn = createButton('View Past Sessions', 'primary', () => {
    navigationManager.showPastSessions();
  });

  // Append buttons to container
  menuContainer.appendChild(startMeditationBtn);
  menuContainer.appendChild(viewSessionsBtn);
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
