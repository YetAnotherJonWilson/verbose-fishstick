import { BrowserOAuthClient } from '@atproto/oauth-client-browser';
import { Agent } from '@atproto/api';

// Initialize OAuth client
let oauthClient;
let session = null;

async function initOAuthClient() {
  try {
    oauthClient = new BrowserOAuthClient({
      handleResolver: 'https://bsky.social',
      clientMetadata: undefined,
    });

    console.log('OAuth client initialized');
  } catch (error) {
    console.error('Failed to initialize OAuth client:', error);
    showStatus('loginStatus', `Error: ${error.message}`, true);
  }
}

// Initialize on page load
initOAuthClient();

// Check for existing session on load
window.addEventListener('DOMContentLoaded', async () => {
  await restoreSession();
});

// Login button handler
document.getElementById('loginButton').addEventListener('click', async () => {
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
    console.error('Login error:', error);
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
    console.error('Logout error:', error);
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
        console.log('User just logged in via OAuth callback');
      } else {
        console.log('Restored previous session');
      }
    } else {
      showLoginScreen();
    }
  } catch (error) {
    console.error('Session restoration error:', error);
    showLoginScreen();
  }
}

// Update user info display
async function updateUserInfo() {
  if (!session) return;
  console.log('User session:', session);

  // Create an agent to fetch profile info
  const agent = new Agent(session);

  try {
    // Use describeRepo instead - works with basic atproto scope
    const repo = await agent.com.atproto.repo.describeRepo({
      repo: session.sub,
    });

    document.getElementById('userHandle').textContent = repo.data.handle;
    document.getElementById('userDid').textContent = session.sub;
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    // Fallback: just show DID
    document.getElementById('userHandle').textContent = session.sub;
    document.getElementById('userDid').textContent =
      '(handle unavailable in loopback mode)';
  }
}

// UI Helper functions
function showLoginScreen() {
  document.getElementById('loginSection').classList.add('active');
  document.getElementById('appSection').classList.remove('active');
}

function showAppScreen() {
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
