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
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes (accessible by all roles)
router.route('/')
  .post(verifyToken, createSeoEntry) // Only authenticated users can create
  .get(verifyToken, getAllSeoEntries); // Only authenticated users can view

router.route('/:id')
  .get(verifyToken, getSeoEntryById) // Only authenticated users can view
  .put(verifyToken, updateSeoEntry) // Only authenticated users can update
  .delete(verifyToken, deleteSeoEntry); // Only authenticated users can delete (admin restriction handled in controller)

// Additional utility routes
router.get('/product-companies', verifyToken, getProductCompanies);
router.get('/submission-entities', verifyToken, getSubmissionEntities);

export default router;