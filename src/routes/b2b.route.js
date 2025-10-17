import express from 'express'
import { 
  createB2BDetail, 
  getAllB2BDetails, 
  getB2BDetailById, 
  updateB2BDetail, 
  deleteB2BDetail,
  upload 
} from '../controllers/b2b.controller.js'
import { verifyToken } from '../middleware/auth.middleware.js'
import { isAdminOrManager, isAuthenticated } from '../middleware/role.middleware.js'

const B2BRouter = express.Router();

// POST: Create B2B detail (Authenticated users)
B2BRouter.post("/create", verifyToken, isAuthenticated, upload.single("image"), createB2BDetail);

// GET: Get all B2B details (Admin and Manager can see all, Sales can only see their own)
B2BRouter.get("/get-all", verifyToken, isAuthenticated, getAllB2BDetails);

// GET: Get B2B detail by ID (Authenticated users with access control)
B2BRouter.get("/get/:id", verifyToken, isAuthenticated, getB2BDetailById);

// PUT: Update B2B detail by ID (Authenticated users with access control)
B2BRouter.put("/update/:id", verifyToken, isAuthenticated, upload.single("image"), updateB2BDetail);

// DELETE: Delete a B2B detail (Admin and Manager only)
B2BRouter.delete("/delete/:id", verifyToken, isAdminOrManager, deleteB2BDetail);

export default B2BRouter;