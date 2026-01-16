import express from 'express';
import {
  createInternApplication,
  getAllInternApplications,
  getInternApplicationById,
  updateInternApplication,
  deleteInternApplication
} from '../controllers/internAppliedData.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { optionalAuth } from '../middleware/optionalAuth.middleware.js';
import { isAdmin } from '../middleware/role.middleware.js';
import multer from 'multer';

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow resume files (PDF, DOC, DOCX) and photo files (images)
    if (
      file.fieldname === 'resume' &&
      (file.mimetype === 'application/pdf' ||
       file.mimetype === 'application/msword' ||
       file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    ) {
      cb(null, true);
    } else if (
      file.fieldname === 'photo' &&
      file.mimetype.startsWith('image/')
    ) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type for ${file.fieldname}. Only resumes (PDF, DOC, DOCX) and images are allowed.`), false);
    }
  }
});

const router = express.Router();

// Create new intern application (with file uploads)
router.post('/', optionalAuth, upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'photo', maxCount: 1 }
]), createInternApplication);

// Get all intern applications (with optional filters)
router.get('/', verifyToken, getAllInternApplications);

// Get intern application by ID
router.get('/:id', verifyToken, getInternApplicationById);

// Update intern application (with optional file uploads)
router.put('/:id', verifyToken, upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'photo', maxCount: 1 }
]), updateInternApplication);

// Delete intern application
router.delete('/:id', verifyToken, isAdmin, deleteInternApplication);

export default router;