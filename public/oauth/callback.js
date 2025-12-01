import { BrowserOAuthClient } from '@atproto/oauth-client-browser';

// Handle OAuth callback
async function handleCallback() {
  try {
    // Get the current URL params (contains code, state, etc.)
    const params = new URLSearchParams(window.location.search);

    // Initialize the OAuth client
    const oauthClient = new BrowserOAuthClient({
      handleResolver: 'https://bsky.social',
      clientMetadata: undefined,
    });

    // Complete the OAuth flow
    // The client will automatically handle the callback params
    const session = await oauthClient.callback(params);

    console.log('Login successful!', session);

    // Redirect back to main page
    // The session is automatically stored by the OAuth client
    window.location.href = 'http://127.0.0.1:8080/';
  } catch (error) {
    console.error('Callback error:', error);

    // Show error to user
    document.body.innerHTML = `
            <div class="container">
                <h1>Really Simple Meditation</h1>
                <div class="status error">
                    <strong>Sign in failed:</strong><br>
                    ${error.message}
                </div>
                <a href="http://127.0.0.1:8080/" style="display: inline-block; margin-top: 20px; color: #0085ff;">
                    Return to home
                </a>
            </div>
        `;
  }
}

// Run callback handler
handleCallback();
