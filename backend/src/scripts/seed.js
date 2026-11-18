const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function seed() {
  const client = await pool.connect();
  try {
    console.log('[Seed] Starting database seeding...');
    await client.query('BEGIN');

    // Default categories
    const categories = [
      // Expense categories
      { name: 'Food & Dining', type: 'expense', color: '#ef4444', icon: 'Utensils' },
      { name: 'Housing & Rent', type: 'expense', color: '#f97316', icon: 'Home' },
      { name: 'Transportation', type: 'expense', color: '#f59e0b', icon: 'Car' },
      { name: 'Utilities & Bills', type: 'expense', color: '#10b981', icon: 'Zap' },
      { name: 'Entertainment', type: 'expense', color: '#8b5cf6', icon: 'Film' },
      { name: 'Healthcare', type: 'expense', color: '#ec4899', icon: 'HeartPulse' },
      { name: 'Shopping & Apparel', type: 'expense', color: '#06b6d4', icon: 'ShoppingBag' },
      { name: 'Education', type: 'expense', color: '#3b82f6', icon: 'GraduationCap' },
      { name: 'Personal Care', type: 'expense', color: '#a855f7', icon: 'Sparkles' },
      // Income categories
      { name: 'Salary', type: 'income', color: '#22c55e', icon: 'Briefcase' },
      { name: 'Freelance & Consulting', type: 'income', color: '#14b8a6', icon: 'Laptop' },
      { name: 'Investments & Dividends', type: 'income', color: '#6366f1', icon: 'TrendingUp' },
      { name: 'Rental Income', type: 'income', color: '#84cc16', icon: 'Key' },
      { name: 'Bonus & Awards', type: 'income', color: '#eab308', icon: 'Award' },
    ];

    const categoryMap = {};
    for (const cat of categories) {
      const res = await client.query(
        `INSERT INTO categories (name, type, color, icon)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (name, type) DO UPDATE SET color = EXCLUDED.color, icon = EXCLUDED.icon
         RETURNING id, name, type;`,
        [cat.name, cat.type, cat.color, cat.icon]
      );
      categoryMap[`${res.rows[0].name}_${res.rows[0].type}`] = res.rows[0].id;
    }
    console.log('[Seed] Categories seeded successfully.');

    // Seed Demo Users
    const passwordHash = await bcrypt.hash('Password123!', 10);
    const users = [
      {
        name: 'Kapil Admin',
        email: 'admin@financetracker.com',
        role: 'admin',
      },
      {
        name: 'Alex Standard',
        email: 'user@financetracker.com',
        role: 'user',
      },
      {
        name: 'Morgan Viewer',
        email: 'readonly@financetracker.com',
        role: 'read-only',
      },
    ];

    const userMap = {};
    for (const u of users) {
      const res = await client.query(
        `INSERT INTO users (name, email, password, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, password = EXCLUDED.password
         RETURNING id, email, role;`,
        [u.name, u.email, passwordHash, u.role]
      );
      userMap[res.rows[0].email] = res.rows[0].id;
    }
    console.log('[Seed] Demo users seeded successfully (Password: Password123!).');

    // Generate transactions for each user so dashboard immediately displays analytics
    const sampleTransactions = [
      // Current month (Nov 2026)
      { cat: 'Salary_income', type: 'income', amount: 5200.00, desc: 'Monthly Salary November', date: '2026-11-01' },
      { cat: 'Freelance & Consulting_income', type: 'income', amount: 1450.00, desc: 'Web App Consulting Project', date: '2026-11-08' },
      { cat: 'Housing & Rent_expense', type: 'expense', amount: 1650.00, desc: 'Apartment Monthly Rent', date: '2026-11-02' },
      { cat: 'Utilities & Bills_expense', type: 'expense', amount: 185.50, desc: 'Electricity & High-speed Internet', date: '2026-11-04' },
      { cat: 'Food & Dining_expense', type: 'expense', amount: 92.40, desc: 'Weekly Grocery Store shopping', date: '2026-11-06' },
      { cat: 'Transportation_expense', type: 'expense', amount: 65.00, desc: 'Metro transit card recharge', date: '2026-11-09' },
      { cat: 'Entertainment_expense', type: 'expense', amount: 48.00, desc: 'Movie night and streaming passes', date: '2026-11-12' },
      { cat: 'Food & Dining_expense', type: 'expense', amount: 124.80, desc: 'Dinner with colleagues', date: '2026-11-14' },
      { cat: 'Healthcare_expense', type: 'expense', amount: 110.00, desc: 'Dental routine checkup', date: '2026-11-16' },
      { cat: 'Shopping & Apparel_expense', type: 'expense', amount: 215.30, desc: 'Winter jacket and clothing', date: '2026-11-18' },
      { cat: 'Investments & Dividends_income', type: 'income', amount: 320.00, desc: 'Quarterly index fund dividend payout', date: '2026-11-20' },
      { cat: 'Food & Dining_expense', type: 'expense', amount: 76.50, desc: 'Organic supermarket groceries', date: '2026-11-21' },

      // Prior month (Oct 2026)
      { cat: 'Salary_income', type: 'income', amount: 5200.00, desc: 'Monthly Salary October', date: '2026-10-01' },
      { cat: 'Housing & Rent_expense', type: 'expense', amount: 1650.00, desc: 'Apartment Monthly Rent', date: '2026-10-02' },
      { cat: 'Food & Dining_expense', type: 'expense', amount: 340.20, desc: 'October Groceries & Takeout', date: '2026-10-10' },
      { cat: 'Utilities & Bills_expense', type: 'expense', amount: 195.00, desc: 'Water, Gas and Power', date: '2026-10-12' },
      { cat: 'Education_expense', type: 'expense', amount: 199.00, desc: 'Cloud Architect Certification exam', date: '2026-10-15' },
      { cat: 'Transportation_expense', type: 'expense', amount: 140.00, desc: 'Car fuel and maintenance', date: '2026-10-22' },
      { cat: 'Bonus & Awards_income', type: 'income', amount: 800.00, desc: 'Q3 Performance Recognition Bonus', date: '2026-10-25' },

      // Earlier months (Sep, Aug 2026)
      { cat: 'Salary_income', type: 'income', amount: 5000.00, desc: 'Monthly Salary September', date: '2026-09-01' },
      { cat: 'Housing & Rent_expense', type: 'expense', amount: 1650.00, desc: 'Apartment Monthly Rent', date: '2026-09-02' },
      { cat: 'Food & Dining_expense', type: 'expense', amount: 310.00, desc: 'Groceries September', date: '2026-09-14' },
      { cat: 'Entertainment_expense', type: 'expense', amount: 180.00, desc: 'Concert tickets with friends', date: '2026-09-20' },
      { cat: 'Salary_income', type: 'income', amount: 5000.00, desc: 'Monthly Salary August', date: '2026-08-01' },
      { cat: 'Housing & Rent_expense', type: 'expense', amount: 1650.00, desc: 'Apartment Monthly Rent', date: '2026-08-02' },
      { cat: 'Transportation_expense', type: 'expense', amount: 220.00, desc: 'Vehicle service & oil change', date: '2026-08-18' },
    ];

    for (const [email, userId] of Object.entries(userMap)) {
      // Clear existing sample transactions for clean idempotency
      await client.query('DELETE FROM transactions WHERE user_id = $1', [userId]);

      for (const t of sampleTransactions) {
        const catId = categoryMap[t.cat] || null;
        await client.query(
          `INSERT INTO transactions (user_id, category_id, type, amount, description, date)
           VALUES ($1, $2, $3, $4, $5, $6);`,
          [userId, catId, t.type, t.amount, t.desc, t.date]
        );
      }
    }

    await client.query('COMMIT');
    console.log('[Seed] Sample transactions seeded for all demo accounts.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Seed Error]:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  seed();
}

module.exports = seed;
