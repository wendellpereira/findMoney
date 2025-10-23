import express from 'express'
import db from '../db/database.js'
const router = express.Router()

// GET /api/statements - list all
router.get('/', (req, res) => {
  try {
    const statements = db.prepare(`
      SELECT 
        s.*,
        COUNT(t.id) as actual_transaction_count
      FROM statements s
      LEFT JOIN transactions t ON s.id = t.statement_id
      GROUP BY s.id
      ORDER BY s.upload_date DESC
    `).all()
    
    res.json(statements)
  } catch (error) {
    console.error('Error fetching statements:', error)
    res.status(500).json({ error: 'Failed to fetch statements' })
  }
})

// POST /api/statements - create new
router.post('/', (req, res) => {
  try {
    const { institution, month, upload_date, transaction_count } = req.body
    
    if (!institution || !month || !upload_date) {
      return res.status(400).json({ 
        error: 'Institution, month, and upload_date are required' 
      })
    }
    
    const insertStatement = db.prepare(`
      INSERT INTO statements (institution, month, upload_date, transaction_count) 
      VALUES (?, ?, ?, ?)
    `)
    
    const result = insertStatement.run(
      institution, 
      month, 
      upload_date, 
      transaction_count || 0
    )
    
    res.status(201).json({ 
      id: result.lastInsertRowid, 
      message: 'Statement created successfully' 
    })
  } catch (error) {
    console.error('Error creating statement:', error)
    res.status(500).json({ error: 'Failed to create statement' })
  }
})

// DELETE /api/statements/:id - delete
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params
    
    // Check if statement has transactions
    const transactionCount = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE statement_id = ?').get(id)
    if (transactionCount.count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete statement that has transactions. Delete transactions first.' 
      })
    }
    
    const deleteStatement = db.prepare('DELETE FROM statements WHERE id = ?')
    const result = deleteStatement.run(id)
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Statement not found' })
    }
    
    res.json({ message: 'Statement deleted successfully' })
  } catch (error) {
    console.error('Error deleting statement:', error)
    res.status(500).json({ error: 'Failed to delete statement' })
  }
})

export default router
