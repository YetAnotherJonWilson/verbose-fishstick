import { BrowserOAuthClient } from '@atproto/oauth-client-browser';
import { Agent } from '@atproto/api';

let oauthClient;
let session = null;

async function initOAuthClient() {
  try {
    oauthClient = new BrowserOAuthClient({
      handleResolver: 'https://bsky.social',
      clientMetadata: undefined,
    });
  } catch (error) {
    showStatus('loginStatus', `Error: ${error.message}`, true);
  }
}

// Initialize on page load
initOAuthClient();

// Check for existing session on load
window.addEventListener('DOMContentLoaded', async () => {
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
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const handle = document.getElementById('handleInput').value.trim();

  if (!handle) {
    showStatus('loginStatus', 'Please enter your handle', true);
    return;
  }

  try {
    showStatus('loginStatus', 'Redirecting to sign in...');

    // Start OAuth flow - this will redirect the user
    await oauthClient.signIn(handle, {
      state: JSON.stringify({ returnTo: window.location.href }),
      signal: new AbortController().signal,
    });
  } catch (error) {
    showStatus('loginStatus', `Login failed: ${error.message}`, true);
  }
});

// Logout button handler
document.getElementById('logoutButton').addEventListener('click', async () => {
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
    showStatus('appStatus', `Logout failed: ${error.message}`, true);
  }
});

// Restore session from storage
async function restoreSession() {
  try {
    // Try to initialize/restore the session
    const result = await oauthClient.init();

    if (result) {
      session = result.session;
      showAppScreen();
      updateUserInfo();

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

async function updateUserInfo() {
  if (!session) return;

  const agent = new Agent(session);

  try {
    // TODO: Using describeRepo for now to work with basic atproto scope, need to investigate
    // scopes further for getProfile access (and possibly read/write permissions)
    const repo = await agent.com.atproto.repo.describeRepo({
      repo: session.sub,
    });

    document.getElementById('userHandle').textContent = repo.data.handle;
    document.getElementById('userDid').textContent = session.sub;
  } catch (error) {
    // Fallback: just show DID
    document.getElementById('userHandle').textContent = session.sub;
    document.getElementById('userDid').textContent =
      '(handle unavailable in loopback mode)';
  }
}

// UI Helper functions
function showLoadingScreen() {
  document.getElementById('loadingSection').classList.add('active');
  document.getElementById('loginSection').classList.remove('active');
  document.getElementById('appSection').classList.remove('active');
}

function showLoginScreen() {
  document.getElementById('loadingSection').classList.remove('active');
  document.getElementById('loginSection').classList.add('active');
  document.getElementById('appSection').classList.remove('active');
}

function showAppScreen() {
  document.getElementById('loadingSection').classList.remove('active');
  document.getElementById('loginSection').classList.remove('active');
  document.getElementById('appSection').classList.add('active');
}

function showStatus(elementId, message, isError = false) {
  const statusEl = document.getElementById(elementId);
  statusEl.textContent = message;
  statusEl.style.display = 'block';

  if (isError) {
    statusEl.classList.add('error');
  } else {
    statusEl.classList.remove('error');
  }
}
