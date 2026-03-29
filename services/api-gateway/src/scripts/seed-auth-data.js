const bcrypt = require('bcryptjs');
const { getPool, initializeAuthDatabase } = require('../db/postgres');

async function seed() {
  const pool = getPool();
  await initializeAuthDatabase();

  const usersToSeed = [
    {
      name: 'Owner Demo',
      email: 'owner@dine.ai',
      password: 'OwnerPass123!',
      role: 'restaurant_owner',
      dine_credits: 240,
      membership_tier: 'pro',
      total_bookings: 12,
    },
    {
      name: 'Arjun Kumar',
      email: 'arjun@dine.ai',
      password: 'DinerPass123!',
      role: 'diner',
      dine_credits: 130,
      membership_tier: 'standard',
      total_bookings: 3,
    },
    {
      name: 'Priya Sharma',
      email: 'priya@dine.ai',
      password: 'DinerPass123!',
      role: 'diner',
      dine_credits: 80,
      membership_tier: 'standard',
      total_bookings: 1,
    },
  ];

  for (const user of usersToSeed) {
    const passwordHash = await bcrypt.hash(user.password, 12);

    const result = await pool.query(
      `
      INSERT INTO users (name, email, password, role, dine_credits, membership_tier, total_bookings)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        password = EXCLUDED.password,
        role = EXCLUDED.role,
        dine_credits = EXCLUDED.dine_credits,
        membership_tier = EXCLUDED.membership_tier,
        total_bookings = EXCLUDED.total_bookings,
        updated_at = NOW()
      RETURNING id
      `,
      [
        user.name,
        user.email,
        passwordHash,
        user.role,
        user.dine_credits,
        user.membership_tier,
        user.total_bookings,
      ]
    );

    const userId = result.rows[0].id;

    await pool.query('DELETE FROM credits_transactions WHERE user_id = $1', [userId]);

    await pool.query(
      `
      INSERT INTO credits_transactions (user_id, event_code, amount, note)
      VALUES
        ($1, 'signup_bonus', 100, 'Welcome bonus'),
        ($1, 'booking_completed', 10, 'Booking reward'),
        ($1, 'review_reward', 20, 'Review reward')
      `,
      [userId]
    );
  }

  console.log('Seed complete. Test accounts:');
  console.log('owner@dine.ai / OwnerPass123!');
  console.log('arjun@dine.ai / DinerPass123!');
  console.log('priya@dine.ai / DinerPass123!');

  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
