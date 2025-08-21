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

  buttonContainer.appendChild(createButton('All Project', 'all-project', () => {
    sessionStorage.removeItem('selectedOrgs'); // clear org selection
    navigateTo('/dashboard');
  }));


  buttonContainer.appendChild(createButton('CNGH', 'cngh', () => {
    const orgs = ['CNGH project'];
    sessionStorage.setItem('selectedOrgs', JSON.stringify(orgs));
    navigateTo('/dashboard');
  }));

  buttonContainer.appendChild(createButton('Ftech', 'ftech', () => {
    const orgs = ['Ftech'];
    sessionStorage.setItem('selectedOrgs', JSON.stringify(orgs));
    navigateTo('/dashboard');
  }));

  buttonContainer.appendChild(createButton('CNGH + Ftech', 'multi-org', () => {
    const orgs = ['CNGH project', 'Ftech'];
    sessionStorage.setItem('selectedOrgs', JSON.stringify(orgs));
    navigateTo('/dashboard');
  }));

  // Upload Excel
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

    const rlsClauses = orgName && (Array.isArray(orgName) ? orgName.length > 0 : true)
      ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map((id) => {
          const clause = Array.isArray(orgName)
            ? `organization_name IN (${orgName.map(name => `'${name}'`).join(", ")})`
            : `organization_name = '${orgName}'`;
          return { dataset: id, clause };
        })
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
  // Try to get org names from sessionStorage
  let orgName = null;
  const storedOrgs = sessionStorage.getItem('selectedOrgs');
  if (storedOrgs) {
    const parsed = JSON.parse(storedOrgs);
    orgName = parsed.length === 1 ? parsed[0] : parsed;
   
  }

    await renderDashboard(orgName);
  } else if (path === '/upload') {
    app.appendChild(renderUploadPage());
  } else {
    app.textContent = '404 Not Found';
  }
}

window.addEventListener('popstate', router);

router();
