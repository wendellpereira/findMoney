import express from 'express';
import db from '../db/database.js';
const router = express.Router();

// GET /api/categories - list all
router.get('/', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY name').all();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/categories/summary - spending summary by category
router.get('/summary', (req, res) => {
  try {
    const query = `
      SELECT 
        c.name,
        c.color,
        COALESCE(SUM(t.amount), 0) as value,
        COUNT(t.id) as transaction_count
      FROM categories c
      LEFT JOIN transactions t ON c.id = t.category_id
      GROUP BY c.id, c.name, c.color
      ORDER BY value DESC
    `;
    
    const summary = db.prepare(query).all();
    res.json(summary);
  } catch (error) {
    console.error('Error fetching category summary:', error);
    res.status(500).json({ error: 'Failed to fetch category summary' });
  }
});

// POST /api/categories - create new
router.post('/', (req, res) => {
  try {
    const { name, description, color } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    
    const insertCategory = db.prepare(`
      INSERT INTO categories (name, description, color) 
      VALUES (?, ?, ?)
    `);
    
    const result = insertCategory.run(name, description || null, color || null);
    
    res.status(201).json({ 
      id: result.lastInsertRowid, 
      message: 'Category created successfully' 
    });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Category name already exists' });
    }
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT /api/categories/:id - update
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    
    const updateCategory = db.prepare(`
      UPDATE categories 
      SET name = ?, description = ?, color = ?
      WHERE id = ?
    `);
    
    const result = updateCategory.run(name, description || null, color || null, id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json({ message: 'Category updated successfully' });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Category name already exists' });
    }
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/categories/:id - delete
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if category is being used by transactions
    const transactionCount = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE category_id = ?').get(id);
    if (transactionCount.count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category that is being used by transactions' 
      });
    }
    
    const deleteCategory = db.prepare('DELETE FROM categories WHERE id = ?');
    const result = deleteCategory.run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
