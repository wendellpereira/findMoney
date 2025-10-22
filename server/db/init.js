import db from './database.js';

const createTables = () => {
  // Create categories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      color TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create statements table
  db.exec(`
    CREATE TABLE IF NOT EXISTS statements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      institution TEXT NOT NULL,
      month TEXT NOT NULL,
      upload_date DATE NOT NULL,
      transaction_count INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create merchant_rules table
  db.exec(`
    CREATE TABLE IF NOT EXISTS merchant_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      merchant_name TEXT UNIQUE NOT NULL,
      category_id INTEGER NOT NULL,
      auto_apply BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);

  // Create transactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      statement_id INTEGER,
      date DATE NOT NULL,
      description TEXT NOT NULL,
      address TEXT,
      amount REAL NOT NULL,
      category_id INTEGER NOT NULL,
      merchant TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (statement_id) REFERENCES statements(id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);
};

const initializeDatabase = () => {
  createTables();
  console.log('Database tables created successfully');
};

export { initializeDatabase };
