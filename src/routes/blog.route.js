import express from 'express';
import { 
  createBlogPost, 
  getAllBlogPosts, 
  getBlogPostById, 
  updateBlogPost, 
  deleteBlogPost,
  likeBlogPost,
  getBlogCategories,
  getBlogProductCompanies,
  upload
} from '../controllers/blog.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes (with access control in controller)
router.route('/')
  .post(verifyToken, upload.single('featuredImage'), createBlogPost) // Only authenticated users can create
  .get(getAllBlogPosts); // Public access with filtering in controller

router.route('/:id')
  .get(getBlogPostById) // Public access with filtering in controller
  .put(verifyToken, upload.single('featuredImage'), updateBlogPost) // Only authenticated users can update
  .delete(verifyToken, deleteBlogPost); // Only authenticated users can delete

// Like a blog post (public)
router.post('/:id/like', likeBlogPost);

// Additional utility routes
router.get('/categories', getBlogCategories);
router.get('/product-companies', getBlogProductCompanies);

export default router;