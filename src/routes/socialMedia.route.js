import express from "express";
import {
  createSocialMediaPost,
  getAllSocialMediaPosts,
  getSocialMediaPostById,
  updateSocialMediaPost,
  deleteSocialMediaPost
} from "../controllers/socialMedia.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import multer from "multer";

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow both image and video files
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'), false);
    }
  }
});

const SocialMediaRouter = express.Router();

SocialMediaRouter.post(
  "/create", 
  verifyToken, 
  upload.single('source'), 
  createSocialMediaPost
);

SocialMediaRouter.get("/get-all", verifyToken, getAllSocialMediaPosts);
SocialMediaRouter.get("/:id", verifyToken, getSocialMediaPostById);
SocialMediaRouter.put(
  "/:id", 
  verifyToken, 
  upload.single('source'), 
  updateSocialMediaPost
);
SocialMediaRouter.delete("/:id", verifyToken, deleteSocialMediaPost);

export default SocialMediaRouter;