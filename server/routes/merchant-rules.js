import express from 'express';
import db from '../db/database.js';
const router = express.Router();

// GET /api/merchant-rules - list all
router.get('/', (req, res) => {
  try {
    const query = `
      SELECT 
        mr.id,
        mr.merchant_name,
        mr.auto_apply,
        mr.created_at,
        c.name as category_name,
        c.color as category_color
      FROM merchant_rules mr
      JOIN categories c ON mr.category_id = c.id
      ORDER BY mr.merchant_name
    `;
    
    const rules = db.prepare(query).all();
    res.json(rules);
  } catch (error) {
    console.error('Error fetching merchant rules:', error);
    res.status(500).json({ error: 'Failed to fetch merchant rules' });
  }
});

// POST /api/merchant-rules - create/update rule
router.post('/', (req, res) => {
  try {
    const { merchant_name, category, auto_apply = true } = req.body;
    
    if (!merchant_name || !category) {
      return res.status(400).json({ 
        error: 'Merchant name and category are required' 
      });
    }
    
    // Get category ID
    const categoryId = db.prepare('SELECT id FROM categories WHERE name = ?').get(category)?.id;
    if (!categoryId) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    
    const insertOrReplaceRule = db.prepare(`
      INSERT OR REPLACE INTO merchant_rules (merchant_name, category_id, auto_apply) 
      VALUES (?, ?, ?)
    `);
    
    const result = insertOrReplaceRule.run(merchant_name, categoryId, auto_apply);
    
    res.status(201).json({ 
      id: result.lastInsertRowid, 
      message: 'Merchant rule created/updated successfully' 
    });
  } catch (error) {
    console.error('Error creating merchant rule:', error);
    res.status(500).json({ error: 'Failed to create merchant rule' });
  }
});

// DELETE /api/merchant-rules/:id - delete rule
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const deleteRule = db.prepare('DELETE FROM merchant_rules WHERE id = ?');
    const result = deleteRule.run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Merchant rule not found' });
    }
    
    res.json({ message: 'Merchant rule deleted successfully' });
  } catch (error) {
    console.error('Error deleting merchant rule:', error);
    res.status(500).json({ error: 'Failed to delete merchant rule' });
  }
});

// GET /api/merchant-rules/export - export rules as JSON
router.get('/export', (req, res) => {
  try {
    const query = `
      SELECT 
        mr.merchant_name,
        c.name as category_name
      FROM merchant_rules mr
      JOIN categories c ON mr.category_id = c.id
      ORDER BY mr.merchant_name
    `;
    
    const rules = db.prepare(query).all();
    
    const categoryRules = {};
    rules.forEach(rule => {
      categoryRules[rule.merchant_name] = rule.category_name;
    });
    
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString().split('T')[0],
      categoryRules
    };
    
    res.json(exportData);
  } catch (error) {
    console.error('Error exporting merchant rules:', error);
    res.status(500).json({ error: 'Failed to export merchant rules' });
  }
});

export default router;
