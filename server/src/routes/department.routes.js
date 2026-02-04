import express from 'express';
import Department from '../models/Department.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all departments (public)
router.get('/', async (req, res, next) => {
  try {
    const { active } = req.query;
    const query = active === 'true' ? { isActive: true } : {};
    
    const departments = await Department.find(query).sort({ order: 1, name: 1 });
    res.json({ departments });
  } catch (error) {
    next(error);
  }
});

// Get department by ID (public)
router.get('/:id', async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    res.json({ department });
  } catch (error) {
    next(error);
  }
});

// Create department (admin only)
router.post('/', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { name, description, icon, image, order } = req.body;

    const existingDept = await Department.findOne({ name });
    if (existingDept) {
      return res.status(400).json({ message: 'Department already exists' });
    }

    const department = new Department({
      name,
      description,
      icon,
      image,
      order
    });

    await department.save();
    res.status(201).json({ department });
  } catch (error) {
    next(error);
  }
});

// Update department (admin only)
router.put('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { name, description, icon, image, isActive, order } = req.body;

    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { name, description, icon, image, isActive, order },
      { new: true }
    );

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    res.json({ department });
  } catch (error) {
    next(error);
  }
});

// Delete department (admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    res.json({ message: 'Department deleted' });
  } catch (error) {
    next(error);
  }
});

export default router;
