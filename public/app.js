const supersetUrl = 'http://gb.megapixel.solutions:8088/';
const dashboardId = '5a5981d6-e41a-4d84-af02-b8b8b05863db';

function createButton(text, className, onClick) {
  const btn = document.createElement('button');
  btn.textContent = text;
  btn.className = `button ${className}`;
  btn.addEventListener('click', onClick);
  return btn;
}

function navigateTo(path) {
  history.pushState({}, '', path);
  router();
}

function renderHome() {
  const container = document.createElement('div');
  container.className = 'home';

  const title = document.createElement('h1');
  title.textContent = 'Projects Dashboard';
  container.appendChild(title);

  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'button-container';

  buttonContainer.appendChild(createButton('All Project', 'all-project', () => navigateTo('/dashboard')));
  buttonContainer.appendChild(createButton('CNGH', 'cngh', () => navigateTo('/dashboard/CNGH%20project')));
  buttonContainer.appendChild(createButton('Ftech', 'ftech', () => navigateTo('/dashboard/Ftech')));
  buttonContainer.appendChild(createButton('Upload Excel', 'upload', () => navigateTo('/upload')));

  container.appendChild(buttonContainer);

  return container;
}

async function getGuestToken(orgName) {
  try {
    const loginResponse = await fetch(`${supersetUrl}/api/v1/security/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'deverloper',
        password: 'deverloper',
        provider: 'db',
        refresh: true,
      }),
    });

    if (!loginResponse.ok) throw new Error(`Login failed: ${loginResponse.status}`);

    const loginData = await loginResponse.json();
    const accessToken = loginData.access_token;

    const rlsClauses = orgName
      ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((id) => ({
          dataset: id,
          clause: `organization_name = '${orgName}'`,
        }))
      : [];

    const guestTokenPayload = {
      resources: [{ type: 'dashboard', id: dashboardId }],
      user: {
        username: 'report-viewer',
        first_name: 'Report',
        last_name: 'Viewer',
      },
      rls: rlsClauses,
    };

    const guestTokenResponse = await fetch(`${supersetUrl}/api/v1/security/guest_token/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(guestTokenPayload),
    });

    if (!guestTokenResponse.ok) throw new Error(`Guest token fetch failed: ${guestTokenResponse.status}`);

    const guestTokenData = await guestTokenResponse.json();
    return guestTokenData.token;
  } catch (err) {
    console.error('Error getting guest token:', err);
    alert('Failed to load dashboard.');
    throw err;
  }
}

function embedDashboard(guestToken) {
  supersetEmbeddedSdk.embedDashboard({
    id: dashboardId,
    supersetDomain: supersetUrl,
    mountPoint: document.getElementById('superset-container'),
    fetchGuestToken: () => guestToken,
    dashboardUiConfig: { hideTitle: true },
  });
}

async function renderDashboard(orgName = null) {
  const container = document.createElement('div');
  container.id = 'superset-container';
  container.style.width = '100%';
  container.style.height = '100vh';

  const app = document.getElementById('app');
  app.innerHTML = '';  // clear previous content
  app.appendChild(container);

  try {
    const token = await getGuestToken(orgName);
    embedDashboard(token);
  } catch {
    // handled in getGuestToken
  }

  return container;
}

function renderUploadPage() {
  const container = document.createElement('div');
  container.textContent = 'Upload Page - (Implement upload logic here)';
  container.style.padding = '20px';
  container.style.textAlign = 'center';
  return container;
}

async function router() {
  const path = window.location.pathname;
  const app = document.getElementById('app');
  app.innerHTML = ''; // clear content

  if (path === '/' || path === '/home') {
    app.appendChild(renderHome());
  } else if (path.startsWith('/dashboard')) {
    const parts = path.split('/');
    const orgName = parts.length > 2 ? decodeURIComponent(parts[2]) : null;
    await renderDashboard(orgName);
  } else if (path === '/upload') {
    app.appendChild(renderUploadPage());
  } else {
    app.textContent = '404 Not Found';
  }
}

window.addEventListener('popstate', router);

router();
