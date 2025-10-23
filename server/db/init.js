import db from './database.js'

const createTables = () => {
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
  `)

  // Create transactions table with category as string
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      statement_id INTEGER,
      date DATE NOT NULL,
      description TEXT NOT NULL,
      address TEXT,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      merchant TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (statement_id) REFERENCES statements(id)
    )
  `)
}

const initializeDatabase = () => {
  createTables()
  console.log('Database tables created successfully')
}

export { initializeDatabase }
