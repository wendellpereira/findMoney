import express from 'express';
import db from '../db/database.js';
const router = express.Router();

// GET /api/transactions - list all with optional category filter
router.get('/', (req, res) => {
  try {
    const { category } = req.query;

    let query = `
      SELECT
        t.id,
        t.date,
        t.description,
        t.address,
        t.amount,
        t.merchant,
        t.category,
        s.institution as source
      FROM transactions t
      LEFT JOIN statements s ON t.statement_id = s.id
    `;

    const params = [];
    if (category && category !== 'all') {
      query += ' WHERE t.category = ?';
      params.push(category);
    }

    query += ' ORDER BY t.date DESC';

    const transactions = db.prepare(query).all(...params);
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// GET /api/transactions/:id - get single transaction
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT
        t.id,
        t.date,
        t.description,
        t.address,
        t.amount,
        t.merchant,
        t.category,
        s.institution as source
      FROM transactions t
      LEFT JOIN statements s ON t.statement_id = s.id
      WHERE t.id = ?
    `;

    const transaction = db.prepare(query).get(id);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

// POST /api/transactions - create new
router.post('/', (req, res) => {
  try {
    const { date, description, address, amount, merchant, category } = req.body;

    if (!category) {
      return res.status(400).json({ error: 'Category is required' });
    }

    // Generate ID
    const generateId = (date, merchant, address, amount) => {
      const key = date + merchant + (address || '') + amount;
      return Buffer.from(key).toString('base64').substring(0, 20);
    };

    const id = generateId(date, merchant, address, amount);

    const insertTransaction = db.prepare(`
      INSERT INTO transactions (id, date, description, address, amount, category, merchant, statement_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
    `);

    insertTransaction.run(id, date, description, address, amount, category, merchant);

    res.status(201).json({ id, message: 'Transaction created successfully' });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// PUT /api/transactions/:id - update
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { date, description, address, amount, merchant, category } = req.body;

    if (!category) {
      return res.status(400).json({ error: 'Category is required' });
    }

    const updateTransaction = db.prepare(`
      UPDATE transactions
      SET date = ?, description = ?, address = ?, amount = ?, category = ?, merchant = ?
      WHERE id = ?
    `);

    const result = updateTransaction.run(date, description, address, amount, category, merchant, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ message: 'Transaction updated successfully' });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// DELETE /api/transactions/:id - delete
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const deleteTransaction = db.prepare('DELETE FROM transactions WHERE id = ?');
    const result = deleteTransaction.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// PUT /api/transactions/category/bulk - bulk update category by merchant
router.put('/category/bulk', (req, res) => {
  try {
    const { merchant, category } = req.body;

    if (!category) {
      return res.status(400).json({ error: 'Category is required' });
    }

    const updateTransactions = db.prepare(`
      UPDATE transactions
      SET category = ?
      WHERE merchant = ?
    `);

    const result = updateTransactions.run(category, merchant);

    res.json({
      message: `Updated ${result.changes} transactions for merchant ${merchant}`,
      changes: result.changes
    });
  } catch (error) {
    console.error('Error bulk updating transactions:', error);
    res.status(500).json({ error: 'Failed to bulk update transactions' });
  }
});

export default router;
