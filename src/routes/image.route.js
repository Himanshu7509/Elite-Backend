import express from 'express'
import { 
  createImage, 
  getAllImages, 
  getImageById, 
  updateImage, 
  deleteImage,
  upload,
  shareImageViaEmail
} from '../controllers/image.controller.js'
import { verifyToken } from '../middleware/auth.middleware.js'

const ImageRouter = express.Router();

// POST: Create image
ImageRouter.post("/create", verifyToken, upload.single("image"), createImage);

// GET: Get all images
ImageRouter.get("/get-all", verifyToken, getAllImages);

// GET: Get image by ID
ImageRouter.get("/get/:id", verifyToken, getImageById);

// PUT: Update image by ID
ImageRouter.put("/update/:id", verifyToken, upload.single("image"), updateImage);

// DELETE: Delete an image
ImageRouter.delete("/delete/:id", verifyToken, deleteImage);

// NEW: Share image via email
ImageRouter.post("/share/:id", verifyToken, shareImageViaEmail);

export default ImageRouter;