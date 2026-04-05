const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool } = require('../db/postgres');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is required and must be injected securely');
}

const CREDITS_EVENTS = {
  SIGNUP: { code: 'signup_bonus', amount: 100, description: 'Welcome bonus' },
  FIRST_BOOKING: { code: 'first_booking', amount: 50, description: 'First booking bonus' },
  EACH_BOOKING: { code: 'booking_completed', amount: 10, description: 'Booking reward' },
  REVIEW: { code: 'review_reward', amount: 20, description: 'Review reward' },
  REFERRAL: { code: 'friend_referral', amount: 100, description: 'Referral reward' },
  BIRTHDAY: { code: 'birthday_bonus', amount: 50, description: 'Birthday bonus' },
};

const rewards = {
  dessert: { cost: 50, title: 'Free dessert' },
  priority: { cost: 75, title: 'Priority booking' },
  'five-off': { cost: 100, title: '$5 dining voucher' },
};

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role || 'diner',
  dine_credits: user.dine_credits || 0,
  membership_tier: user.membership_tier || 'standard',
});

const insertCreditTransaction = async (db, userId, eventCode, amount, note) => {
  const { rows } = await db.query(
    `
      INSERT INTO credits_transactions (user_id, event_code, amount, note)
      VALUES ($1, $2, $3, $4)
      RETURNING id, event_code, amount, note, created_at
    `,
    [userId, eventCode, amount, note]
  );

  return rows[0];
};

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

router.post('/register', async (req, res) => {
  try {
    const db = getPool();
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    const normalizedEmail = email.toLowerCase();
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const role = normalizedEmail.includes('owner') ? 'restaurant_owner' : 'diner';

    const inserted = await db.query(
      `
      INSERT INTO users (name, email, password, role, dine_credits, membership_tier, total_bookings)
      VALUES ($1, $2, $3, $4, 100, 'standard', 0)
      RETURNING id, name, email, role, avatar_url, dine_credits, membership_tier, total_bookings, created_at
      `,
      [name.trim(), normalizedEmail, hashedPassword, role]
    );

    const user = inserted.rows[0];

    await insertCreditTransaction(
      db,
      user.id,
      CREDITS_EVENTS.SIGNUP.code,
      CREDITS_EVENTS.SIGNUP.amount,
      CREDITS_EVENTS.SIGNUP.description
    );

    const token = jwt.sign({ userId: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const db = getPool();
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const normalizedEmail = email.toLowerCase();
    const result = await db.query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const user = result.rows[0];

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// DEV-ONLY: Bootstrap a restaurant owner account quickly for local testing.
router.post('/bootstrap-owner', async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    const allowInProd = process.env.ALLOW_DEV_BOOTSTRAP === 'true';
    if (isProduction && !allowInProd) {
      return res.status(403).json({ error: 'Endpoint disabled in production' });
    }

    const db = getPool();
    const {
      name = 'Owner Demo',
      email = 'owner@dine.ai',
      password = 'OwnerPass123!',
    } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = String(email).toLowerCase();
    const existing = await db.query('SELECT * FROM users WHERE email = $1', [normalizedEmail]);

    let user;
    let created = false;

    if (existing.rows.length > 0) {
      const passwordHash = await bcrypt.hash(password, 12);
      const updated = await db.query(
        `
        UPDATE users
        SET
          name = COALESCE($1, name),
          password = $2,
          role = 'restaurant_owner',
          updated_at = NOW()
        WHERE email = $3
        RETURNING id, name, email, role, avatar_url, dine_credits, membership_tier, total_bookings, created_at
        `,
        [name, passwordHash, normalizedEmail]
      );
      user = updated.rows[0];
    } else {
      const passwordHash = await bcrypt.hash(password, 12);
      const inserted = await db.query(
        `
        INSERT INTO users (name, email, password, role, dine_credits, membership_tier, total_bookings)
        VALUES ($1, $2, $3, 'restaurant_owner', 100, 'standard', 0)
        RETURNING id, name, email, role, avatar_url, dine_credits, membership_tier, total_bookings, created_at
        `,
        [name, normalizedEmail, passwordHash]
      );
      user = inserted.rows[0];
      created = true;

      await insertCreditTransaction(
        db,
        user.id,
        CREDITS_EVENTS.SIGNUP.code,
        CREDITS_EVENTS.SIGNUP.amount,
        CREDITS_EVENTS.SIGNUP.description
      );
    }

    const token = jwt.sign({ userId: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(200).json({
      created,
      token,
      user: sanitizeUser(user),
      message: created ? 'Owner account created' : 'Existing user promoted/updated as owner',
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to bootstrap owner account' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const db = getPool();
    const userResult = await db.query(
      'SELECT id, name, email, role, avatar_url, dine_credits, membership_tier, total_bookings, created_at FROM users WHERE id = $1',
      [req.userId]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = userResult.rows[0];

    return res.json({ ...sanitizeUser(user), created_at: user.created_at });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.get('/credits', authMiddleware, async (req, res) => {
  try {
    const db = getPool();
    const userResult = await db.query(
      'SELECT dine_credits, membership_tier, total_bookings FROM users WHERE id = $1',
      [req.userId]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = userResult.rows[0];

    return res.json({
      balance: user.dine_credits || 0,
      membership_tier: user.membership_tier || 'standard',
      total_bookings: user.total_bookings || 0,
      available_rewards: [
        { id: 'dessert', title: 'Free dessert', cost: 50 },
        { id: 'priority', title: 'Priority booking', cost: 75 },
        { id: 'five-off', title: '$5 dining voucher', cost: 100 },
      ],
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch credits' });
  }
});

router.get('/credits/history', authMiddleware, async (req, res) => {
  try {
    const db = getPool();
    const userResult = await db.query('SELECT id FROM users WHERE id = $1', [req.userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const historyResult = await db.query(
      `
      SELECT id, event_code, amount, note, created_at
      FROM credits_transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 100
      `,
      [req.userId]
    );

    return res.json({ history: historyResult.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch credit history' });
  }
});

router.post('/credits/award', authMiddleware, async (req, res) => {
  try {
    const db = getPool();
    const { event = 'booking_completed' } = req.body || {};

    const userResult = await db.query('SELECT id, dine_credits, total_bookings FROM users WHERE id = $1', [req.userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = userResult.rows[0];

    let creditEvent = CREDITS_EVENTS.EACH_BOOKING;
    if (event === 'first_booking') {
      creditEvent = CREDITS_EVENTS.FIRST_BOOKING;
    } else if (event === 'review_reward') {
      creditEvent = CREDITS_EVENTS.REVIEW;
    } else if (event === 'friend_referral') {
      creditEvent = CREDITS_EVENTS.REFERRAL;
    } else if (event === 'birthday_bonus') {
      creditEvent = CREDITS_EVENTS.BIRTHDAY;
    }

    const nextCredits = (user.dine_credits || 0) + creditEvent.amount;
    const nextBookings = (event === 'first_booking' || event === 'booking_completed')
      ? (user.total_bookings || 0) + 1
      : user.total_bookings || 0;

    await db.query(
      'UPDATE users SET dine_credits = $1, total_bookings = $2, updated_at = NOW() WHERE id = $3',
      [nextCredits, nextBookings, req.userId]
    );

    const historyRecord = await insertCreditTransaction(
      db,
      req.userId,
      creditEvent.code,
      creditEvent.amount,
      creditEvent.description
    );

    return res.json({
      balance: nextCredits,
      awarded: historyRecord,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to award credits' });
  }
});

router.post('/credits/redeem', authMiddleware, async (req, res) => {
  try {
    const db = getPool();
    const { rewardId } = req.body || {};

    const userResult = await db.query('SELECT id, dine_credits FROM users WHERE id = $1', [req.userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = userResult.rows[0];

    const reward = rewards[rewardId];
    if (!reward) {
      return res.status(400).json({ error: 'Invalid reward' });
    }
    if ((user.dine_credits || 0) < reward.cost) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    const nextCredits = user.dine_credits - reward.cost;

    await db.query(
      'UPDATE users SET dine_credits = $1, updated_at = NOW() WHERE id = $2',
      [nextCredits, req.userId]
    );

    const historyRecord = await insertCreditTransaction(
      db,
      req.userId,
      `redeem_${rewardId}`,
      -reward.cost,
      `Redeemed: ${reward.title}`
    );

    return res.json({
      balance: nextCredits,
      redeemed: historyRecord,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to redeem credits' });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const db = getPool();
    const { name, avatar_url } = req.body;

    const updateResult = await db.query(
      `
      UPDATE users
      SET
        name = COALESCE($1, name),
        avatar_url = COALESCE($2, avatar_url),
        updated_at = NOW()
      WHERE id = $3
      RETURNING id, name, email, avatar_url
      `,
      [name || null, avatar_url || null, req.userId]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(updateResult.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Profile update failed' });
  }
});

router.authMiddleware = authMiddleware;

module.exports = router;
