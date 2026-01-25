import express from 'express';
import { 
  createSeoEntry, 
  getAllSeoEntries, 
  getSeoEntryById, 
  updateSeoEntry, 
  deleteSeoEntry,
  getProductCompanies,
  getSubmissionEntities
} from '../controllers/seo.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes (accessible by all roles)
router.route('/')
  .post(protect, createSeoEntry) // Only authenticated users can create
  .get(protect, getAllSeoEntries); // Only authenticated users can view

router.route('/:id')
  .get(protect, getSeoEntryById) // Only authenticated users can view
  .put(protect, updateSeoEntry) // Only authenticated users can update
  .delete(protect, authorize('admin'), deleteSeoEntry); // Only admin can delete

// Additional utility routes
router.get('/product-companies', protect, getProductCompanies);
router.get('/submission-entities', protect, getSubmissionEntities);

export default router;