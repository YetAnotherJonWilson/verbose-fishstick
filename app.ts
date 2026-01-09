import Store from './services/Store';
import { NavigationManager } from './services/Navigation';
import { createButton } from './services/UIComponents';
import {
  showLoadingScreen,
  showLoginScreen,
  showAppScreen,
  showStatus,
} from './services/UIState';
import {
  restoreSession,
  updateUserInfo,
  loadUserData,
} from './services/SessionManager';
import {
  initOAuthClient,
  signIn,
  signOut,
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

  await initializeApp();

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

/**
 * Initialize the app by restoring session and loading user data
 */
async function initializeApp(): Promise<void> {
  const result = await restoreSession();

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
}

/**
 * Initialize the main menu with navigation buttons
 */
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
