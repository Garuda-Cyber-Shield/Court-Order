import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IS_VERCEL = !!process.env.VERCEL;
const DATA_DIR = IS_VERCEL ? '/tmp' : path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.txt');

// GitHub Config (For Vercel Persistence)
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO; // e.g., "username/repo-name"
const GITHUB_PATH = 'server/data/users.txt';
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

// Ensure data directory exists (Local)
if (!IS_VERCEL && !fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Global cache to reduce API calls
let cachedUsers = null;
let lastUpdateSha = null;

async function getGithubFile() {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    console.error('❌ GITHUB_TOKEN or GITHUB_REPO missing in env.');
    return { content: '[]', sha: null };
  }
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_PATH}?ref=${GITHUB_BRANCH}`, {
      headers: { 
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    if (!res.ok) {
      if (res.status === 404) return { content: '[]', sha: null };
      throw new Error(`GitHub Fetch Error: ${res.statusText}`);
    }
    const data = await res.json();
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    return { content, sha: data.sha };
  } catch (err) {
    console.error('❌ Failed to fetch from GitHub:', err.message);
    return { content: '[]', sha: null };
  }
}

async function updateGithubFile(content, sha) {
  if (!GITHUB_TOKEN || !GITHUB_REPO) return;
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_PATH}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Database Update [skip ci]',
        content: Buffer.from(content).toString('base64'),
        sha,
        branch: GITHUB_BRANCH
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'GitHub Update Failed');
    lastUpdateSha = data.content.sha;
  } catch (err) {
    console.error('❌ Failed to update GitHub:', err.message);
  }
}

async function readUsers() {
  if (cachedUsers !== null) return cachedUsers;

  if (IS_VERCEL) {
    console.log('☁️ Fetching users from GitHub...');
    const { content, sha } = await getGithubFile();
    lastUpdateSha = sha;
    try {
      cachedUsers = JSON.parse(content);
    } catch {
      cachedUsers = [];
    }
    return cachedUsers;
  } else {
    // Local
    if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]', 'utf-8');
    try {
      cachedUsers = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    } catch {
      cachedUsers = [];
    }
    return cachedUsers;
  }
}

async function writeUsers(users) {
  cachedUsers = users;
  const content = JSON.stringify(users, null, 2);

  if (IS_VERCEL) {
    console.log('☁️ Saving users to GitHub...');
    // We need the latest SHA to update
    if (!lastUpdateSha) {
      const { sha } = await getGithubFile();
      lastUpdateSha = sha;
    }
    await updateGithubFile(content, lastUpdateSha);
  } else {
    // Local
    fs.writeFileSync(USERS_FILE, content, 'utf-8');
  }
}

const db = {
  async getAllUsers() {
    return await readUsers();
  },

  async findByEmail(email) {
    const users = await readUsers();
    return users.find(u => u.email === email) || null;
  },

  async findById(id) {
    const users = await readUsers();
    return users.find(u => u.id === id) || null;
  },

  async createUser({ code_name, email, password, role = 'user', status = 'pending', is_default_owner = 0 }) {
    const users = await readUsers();
    const nextId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
    const user = {
      id: nextId,
      code_name,
      email,
      password,
      role,
      status,
      is_default_owner,
      created_at: new Date().toISOString(),
    };
    users.push(user);
    await writeUsers(users);
    return user;
  },

  async updateUser(id, updates) {
    const users = await readUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    users[idx] = { ...users[idx], ...updates };
    await writeUsers(users);
    return users[idx];
  },
};

export default db;
