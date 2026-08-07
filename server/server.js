import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;

const DEFAULT_OWNER_EMAIL = process.env.DEFAULT_OWNER_EMAIL;
const DEFAULT_OWNER_PASSWORD = process.env.DEFAULT_OWNER_PASSWORD;
const DEFAULT_OWNER_CODENAME = process.env.DEFAULT_OWNER_CODENAME || 'QuickSilver';

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// ─── Auth Middleware ─────────────────────────────
let isSeeded = false;
app.use(async (req, res, next) => {
  if (!isSeeded && req.path.startsWith('/api')) {
    try {
      await seedDefaultOwner();
      isSeeded = true;
    } catch (e) {
      console.error("Vercel Cold Start Seed Error:", e.message);
    }
  }
  next();
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied.' });
  try {
    if (!JWT_SECRET) {
      return res.status(500).json({ error: 'Server authentication misconfigured.' });
    }
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin' && req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

// ─── Seed default owner on startup ──────────────
async function seedDefaultOwner() {
  if (!DEFAULT_OWNER_EMAIL || !DEFAULT_OWNER_PASSWORD) {
    console.log('ℹ️ DEFAULT_OWNER_EMAIL or DEFAULT_OWNER_PASSWORD not set in env. Skipping default owner seed.');
    return;
  }
  const existing = await db.findByEmail(DEFAULT_OWNER_EMAIL);
  if (!existing) {
    const hashed = await bcrypt.hash(DEFAULT_OWNER_PASSWORD, 12);
    await db.createUser({
      code_name: DEFAULT_OWNER_CODENAME,
      email: DEFAULT_OWNER_EMAIL,
      password: hashed,
      role: 'owner',
      status: 'approved',
      is_default_owner: 1,
    });
    console.log('👑 Default owner account created.');
  } else {
    console.log('👑 Default owner already exists.');
  }
}

// ─── AUTH ROUTES ─────────────────────────────────

// POST /api/auth/signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { codeName, email, password } = req.body;
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;
    if (!gmailRegex.test(email)) return res.status(400).json({ error: 'Only Gmail addresses are accepted.' });
    if (!password || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    if (!codeName || codeName.trim().length === 0) return res.status(400).json({ error: 'Code Name is required.' });

    const existing = await db.findByEmail(email.toLowerCase().trim());
    if (existing) {
      if (existing.status === 'banned') return res.status(403).json({ error: 'BANNED', message: 'This account has been banned. Contact Admin.' });
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const hashed = await bcrypt.hash(password, 12);
    await db.createUser({
      code_name: codeName.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
      role: 'user',
      status: 'pending',
    });
    return res.status(201).json({ message: 'Signup successful! Awaiting admin approval.' });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

    const user = await db.findByEmail(email.toLowerCase().trim());
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

    if (user.status === 'banned') return res.status(403).json({ error: 'BANNED', message: 'Your account has been banned. Contact Admin.' });

    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) return res.status(401).json({ error: 'Invalid email or password.' });

    if (user.status === 'pending') return res.status(403).json({ error: 'PENDING', message: 'Your account is pending admin approval.' });

    const expiresIn = rememberMe ? '90d' : '24h';
    const token = jwt.sign(
      { id: user.id, email: user.email, codeName: user.code_name, role: user.role },
      JWT_SECRET,
      { expiresIn }
    );
    return res.json({
      token,
      user: { id: user.id, codeName: user.code_name, email: user.email, role: user.role, status: user.status },
      expiresIn,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.status === 'banned') return res.status(403).json({ error: 'BANNED', message: 'Your account has been banned.' });
    return res.json({ id: user.id, codeName: user.code_name, email: user.email, role: user.role, status: user.status });
  } catch (err) {
    console.error('Auth/me error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/auth/check-status — public check for pending approval status
app.post('/api/auth/check-status', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const user = await db.findByEmail(email.toLowerCase().trim());
    if (!user) return res.status(404).json({ error: 'User not found.' });

    return res.json({ status: user.status });
  } catch (err) {
    console.error('Check status error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── ADMIN ROUTES ────────────────────────────────

// GET /api/admin/users
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const allUsers = await db.getAllUsers();
    const users = allUsers.map(({ password, ...u }) => u);
    return res.json(users);
  } catch (err) {
    console.error('Admin list error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/admin/approve/:id
app.post('/api/admin/approve/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await db.findById(Number(req.params.id));
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.status !== 'pending') return res.status(400).json({ error: 'User is not pending.' });
    await db.updateUser(user.id, { status: 'approved' });
    return res.json({ message: 'User approved successfully.' });
  } catch (err) {
    console.error('Approve error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/admin/promote/:id
app.post('/api/admin/promote/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const target = await db.findById(Number(req.params.id));
    if (!target) return res.status(404).json({ error: 'User not found.' });
    if (target.is_default_owner) return res.status(403).json({ error: 'Cannot modify default owner.' });
    if (req.user.role !== 'owner') return res.status(403).json({ error: 'Only Owner can promote/demote users.' });
    if (target.status !== 'approved') return res.status(400).json({ error: 'Approve this user before changing their role.' });

    const newRole = target.role === 'admin' ? 'user' : 'admin';
    await db.updateUser(target.id, { role: newRole });
    return res.json({ message: `User ${newRole === 'admin' ? 'promoted to Admin' : 'demoted to User'}.` });
  } catch (err) {
    console.error('Promote error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/admin/delete/:id — permanently deletes user
app.delete('/api/admin/delete/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const target = await db.findById(Number(req.params.id));
    if (!target) return res.status(404).json({ error: 'User not found.' });
    if (target.is_default_owner) return res.status(403).json({ error: 'Default owner cannot be deleted.' });
    
    await db.deleteUser(target.id);
    return res.json({ message: 'User has been permanently deleted.' });
  } catch (err) {
    console.error('Delete error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── FORGOT PASSWORD ROUTES ─────────────────────

// POST /api/auth/forgot-password — user requests password reset
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const user = await db.findByEmail(email.toLowerCase().trim());
    if (!user) return res.status(404).json({ error: 'No account found with this email.' });
    if (user.status === 'banned') return res.status(403).json({ error: 'BANNED', message: 'This account has been banned.' });
    if (user.reset_requested && !user.reset_approved) {
      return res.json({ message: 'Reset request already submitted. Awaiting admin approval.' });
    }
    if (user.reset_approved) {
      return res.json({ message: 'Reset already approved! You can set your new password.', canReset: true });
    }

    await db.updateUser(user.id, { reset_requested: true, reset_approved: false });
    return res.json({ message: 'Password reset request submitted. Please wait for admin approval.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/auth/check-reset — check if reset is approved
app.post('/api/auth/check-reset', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const user = await db.findByEmail(email.toLowerCase().trim());
    if (!user) return res.status(404).json({ error: 'No account found.' });

    if (user.reset_approved) {
      return res.json({ canReset: true, message: 'Reset approved! Set your new password.' });
    }
    if (user.reset_requested) {
      return res.json({ canReset: false, message: 'Awaiting admin approval.' });
    }
    return res.json({ canReset: false, message: 'No reset request found.' });
  } catch (err) {
    console.error('Check reset error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/auth/reset-password — user sets new password (only if approved)
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) return res.status(400).json({ error: 'Email and new password are required.' });
    if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters.' });

    const user = await db.findByEmail(email.toLowerCase().trim());
    if (!user) return res.status(404).json({ error: 'No account found.' });
    if (!user.reset_approved) return res.status(403).json({ error: 'Password reset has not been approved by admin.' });

    const hashed = await bcrypt.hash(newPassword, 12);
    await db.updateUser(user.id, { password: hashed, reset_requested: false, reset_approved: false });
    return res.json({ message: 'Password reset successful! You can now login with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/admin/approve-reset/:id — admin approves password reset
app.post('/api/admin/approve-reset/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const target = await db.findById(Number(req.params.id));
    if (!target) return res.status(404).json({ error: 'User not found.' });
    if (!target.reset_requested) return res.status(400).json({ error: 'No reset request found for this user.' });

    await db.updateUser(target.id, { reset_approved: true });
    return res.json({ message: `Password reset approved for ${target.code_name}.` });
  } catch (err) {
    console.error('Approve reset error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/admin/deny-reset/:id — admin denies password reset
app.post('/api/admin/deny-reset/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const target = await db.findById(Number(req.params.id));
    if (!target) return res.status(404).json({ error: 'User not found.' });

    await db.updateUser(target.id, { reset_requested: false, reset_approved: false });
    return res.json({ message: `Password reset denied for ${target.code_name}.` });
  } catch (err) {
    console.error('Deny reset error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── REPORT LINKS ROUTES ──────────────────────────

async function seedDefaultReportLinks() {
  try {
    const existing = await db.getAllReportLinks();
    if (existing.length === 0) {
      await db.createReportLink({
        name: "Facebook Copyright Removal Form",
        vpn: "USA",
        link: "https://www.facebook.com/help/contact/208282075858952",
        order: 0,
        created_by: "System",
      });
      await db.createReportLink({
        name: "Facebook Trademark Infringement",
        vpn: "United Kingdom",
        link: "https://www.facebook.com/help/contact/163889104085449",
        order: 1,
        created_by: "System",
      });
      await db.createReportLink({
        name: "Facebook Impersonation / Fake Account",
        vpn: "None",
        link: "https://www.facebook.com/help/contact/295309487309948",
        order: 2,
        created_by: "System",
      });
      await db.createReportLink({
        name: "Facebook Defamation & Privacy Notice",
        vpn: "Singapore",
        link: "https://www.facebook.com/help/contact/144059062408922",
        order: 3,
        created_by: "System",
      });
      console.log('🔗 Default report links seeded successfully.');
    }
  } catch (err) {
    console.error("Report links seed error:", err.message);
  }
}

// GET /api/report-links — visible to ALL approved users
app.get('/api/report-links', authenticateToken, async (req, res) => {
  try {
    let links = await db.getAllReportLinks();
    if (links.length === 0) {
      await seedDefaultReportLinks();
      links = await db.getAllReportLinks();
    }
    return res.json(links);
  } catch (err) {
    console.error('Fetch report links error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/report-links/reorder — owner/admin can reorder
app.put('/api/report-links/reorder', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ error: 'orderedIds array is required.' });
    }
    await db.reorderReportLinks(orderedIds);
    return res.json({ message: 'Report links reordered successfully.' });
  } catch (err) {
    console.error('Reorder report links error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


// POST /api/report-links — owner/admin can create
app.post('/api/report-links', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, vpn, link } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Report Name is required.' });
    if (!link || !link.trim()) return res.status(400).json({ error: 'Report Link URL is required.' });

    let formattedLink = link.trim();
    if (!/^https?:\/\//i.test(formattedLink)) {
      formattedLink = `https://${formattedLink}`;
    }

    // Check duplicate/similar entry
    const duplicate = await db.findSimilarReportLink({ name: name.trim(), link: formattedLink });
    if (duplicate) {
      if (duplicate.type === 'link') {
        return res.status(409).json({
          error: `Notice: A report form with this exact URL link already exists ("${duplicate.match.name}").`,
        });
      }
      return res.status(409).json({
        error: `Notice: A report form named "${duplicate.match.name}" already exists in the system.`,
      });
    }

    const newLink = await db.createReportLink({
      name: name.trim(),
      vpn: vpn ? vpn.trim() : 'None',
      link: formattedLink,
      created_by: req.user.codeName || 'Admin',
    });
    return res.status(201).json(newLink);
  } catch (err) {
    console.error('Create report link error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/report-links/:id — owner/admin can update
app.put('/api/report-links/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, vpn, link } = req.body;

    const existing = await db.findReportLinkById(id);
    if (!existing) return res.status(404).json({ error: 'Report link not found.' });

    if (!name || !name.trim()) return res.status(400).json({ error: 'Report Name is required.' });
    if (!link || !link.trim()) return res.status(400).json({ error: 'Report Link URL is required.' });

    let formattedLink = link.trim();
    if (!/^https?:\/\//i.test(formattedLink)) {
      formattedLink = `https://${formattedLink}`;
    }

    // Check duplicate/similar entry
    const duplicate = await db.findSimilarReportLink({ name: name.trim(), link: formattedLink, excludeId: id });
    if (duplicate) {
      if (duplicate.type === 'link') {
        return res.status(409).json({
          error: `Notice: A report form with this exact URL link already exists ("${duplicate.match.name}").`,
        });
      }
      return res.status(409).json({
        error: `Notice: A report form named "${duplicate.match.name}" already exists in the system.`,
      });
    }

    const updated = await db.updateReportLink(id, {
      name: name.trim(),
      vpn: vpn ? vpn.trim() : 'None',
      link: formattedLink,
    });
    return res.json(updated);
  } catch (err) {
    console.error('Update report link error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/report-links/:id — owner/admin can delete
app.delete('/api/report-links/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await db.findReportLinkById(id);
    if (!existing) return res.status(404).json({ error: 'Report link not found.' });

    await db.deleteReportLink(id);
    return res.json({ message: 'Report link deleted successfully.' });
  } catch (err) {
    console.error('Delete report link error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});


// ─── EXPORT for Vercel serverless ────────────────
export default app;

// ─── LOCAL DEV: only listen when run directly ────
const isDirectRun = process.argv[1]?.replace(/\\/g, '/').includes('server/server.js');
if (isDirectRun) {
  (async () => {
    await seedDefaultOwner();
    app.listen(PORT, () => console.log(`🚀 GCS Auth Server → http://localhost:${PORT}`));
  })();
}
