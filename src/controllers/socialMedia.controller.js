import SocialMedia from "../models/socialMedia.model.js";
import Team from "../models/team.model.js";
import { uploadFileToS3 } from "../utils/s3Upload.js";

// Create a new social media post
export const createSocialMediaPost = async (req, res) => {
  try {
    // Marketing users, managers, sales persons, and admin can create posts
    if (!['marketing', 'manager', 'sales', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Only marketing users, managers, sales persons, and admin can create social media posts." 
      });
    }

    const { productCompany, caption, platforms, uploadType, date, sourceUrl, flyerUrl } = req.body;
    
    // Log incoming request data for debugging
    console.log("Incoming request data:", { productCompany, caption, platforms, uploadType, date, sourceUrl, flyerUrl });
    console.log("User data:", req.user);
    console.log("File data:", req.file);

    // Validate required fields
    if (!productCompany || !platforms || !uploadType || !date) {
      return res.status(400).json({ 
        success: false, 
        message: "Product company, platforms, upload type, and date are required." 
      });
    }

    // Validate platforms is an array
    let platformArray = [];
    if (typeof platforms === 'string') {
      platformArray = [platforms];
    } else if (Array.isArray(platforms)) {
      platformArray = platforms;
    } else {
      return res.status(400).json({ 
        success: false, 
        message: "Platforms must be a string or array of strings." 
      });
    }

    // Validate and parse date
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid date format." 
      });
    }

    // Handle file upload for posts and flyers
    let imageUrl = null;
    let videoUrl = null;
    if ((uploadType === 'post' || uploadType === 'flyer') && req.file) {
      try {
        console.log("Uploading file to S3...");
        const s3Result = await uploadFileToS3(req.file);
        
        // Determine if the file is an image or video
        if (req.file.mimetype.startsWith('image/')) {
          imageUrl = s3Result.Location;
          console.log("Image uploaded successfully:", imageUrl);
        } else if (req.file.mimetype.startsWith('video/')) {
          videoUrl = s3Result.Location;
          console.log("Video uploaded successfully:", videoUrl);
        }
      } catch (uploadError) {
        console.error("Error uploading file to S3:", uploadError);
        return res.status(500).json({ 
          success: false, 
          message: "Failed to upload image to S3",
          error: uploadError.message 
        });
      }
    }

    // Get user details
    let uploadedBy = null;
    let uploadedByName = "Unknown User";
    let uploadedByEmail = req.user.email;

    if (req.user._id) {
      // If user is from database
      console.log("Fetching user from database with ID:", req.user._id);
      const user = await Team.findById(req.user._id);
      if (user) {
        uploadedBy = user._id;
        uploadedByName = user.name;
        uploadedByEmail = user.email;
        console.log("User found:", { uploadedBy, uploadedByName, uploadedByEmail });
      } else {
        console.log("User not found in database");
        // Use the name from the token if available
        uploadedByName = req.user.name || uploadedByName;
      }
    } else {
      // If user is from environment variables (admin/manager)
      uploadedByName = req.user.role === 'admin' ? "Admin User" : "Manager User";
      console.log("Using default user name for role:", req.user.role);
    }

    const newPost = new SocialMedia({
      productCompany,
      caption: caption || '',
      platforms: platformArray,
      uploadType,
      date: parsedDate,
      sourceUrl: (uploadType === 'reel' || uploadType === 'post') ? sourceUrl : null,
      flyerUrl: uploadType === 'flyer' ? (sourceUrl || flyerUrl) : null,
      imageUrl: (uploadType === 'post' || (uploadType === 'flyer' && req.file?.mimetype.startsWith('image/'))) ? imageUrl : null,
      videoUrl: (uploadType === 'flyer' && req.file?.mimetype.startsWith('video/')) ? videoUrl : null,
      uploadedBy, // This can now be null
      uploadedByName,
      uploadedByEmail
    });

    console.log("Saving new post:", newPost);
    await newPost.save();
    
    res.status(201).json({ 
      success: true, 
      message: "Social media post created successfully",
      data: newPost 
    });
  } catch (error) {
    console.error("Error creating social media post:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create social media post",
      error: error.message 
    });
  }
};

// Get all social media posts
export const getAllSocialMediaPosts = async (req, res) => {
  try {
    // Marketing users, managers, sales persons, and admin can view posts
    if (!['marketing', 'manager', 'sales', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Only marketing users, managers, sales persons, and admin can view social media posts." 
      });
    }

    const posts = await SocialMedia.find()
      .sort({ createdAt: -1 });

    res.status(200).json({ 
      success: true, 
      data: posts,
      count: posts.length
    });
  } catch (error) {
    console.error("Error fetching social media posts:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch social media posts",
      error: error.message 
    });
  }
};

// Get social media post by ID
export const getSocialMediaPostById = async (req, res) => {
  try {
    // Marketing users, managers, sales persons, and admin can view posts
    if (!['marketing', 'manager', 'sales', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Only marketing users, managers, sales persons, and admin can view social media posts." 
      });
    }

    const { id } = req.params;
    const post = await SocialMedia.findById(id);

    if (!post) {
      return res.status(404).json({ 
        success: false, 
        message: "Social media post not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      data: post 
    });
  } catch (error) {
    console.error("Error fetching social media post:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch social media post",
      error: error.message 
    });
  }
};

// Update social media post
export const updateSocialMediaPost = async (req, res) => {
  try {
    // Marketing users, managers, sales persons, and admin can update posts
    if (!['marketing', 'manager', 'sales', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Only marketing users, managers, sales persons, and admin can update social media posts." 
      });
    }

    const { id } = req.params;
    const { productCompany, caption, platforms, uploadType, date, sourceUrl, flyerUrl } = req.body;

    // Log incoming request data for debugging
    console.log("Updating post with ID:", id);
    console.log("Incoming update data:", { productCompany, caption, platforms, uploadType, date, sourceUrl, flyerUrl });
    console.log("User data:", req.user);
    console.log("File data:", req.file);

    // Find the existing post
    const existingPost = await SocialMedia.findById(id);
    if (!existingPost) {
      return res.status(404).json({ 
        success: false, 
        message: "Social media post not found" 
      });
    }

    // Check if the user is authorized to update this post
    // Marketing users can only update their own posts
    // Skip this check if uploadedBy is null (legacy posts)
    if (req.user.role === 'marketing' && existingPost.uploadedBy && existingPost.uploadedBy.toString() !== req.user._id?.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. You can only update your own posts." 
      });
    }

    // Validate platforms if provided
    let platformArray = existingPost.platforms;
    if (platforms) {
      if (typeof platforms === 'string') {
        platformArray = [platforms];
      } else if (Array.isArray(platforms)) {
        platformArray = platforms;
      } else {
        return res.status(400).json({ 
          success: false, 
          message: "Platforms must be a string or array of strings." 
        });
      }
    }

    // Validate and parse date if provided
    let parsedDate = existingPost.date;
    if (date) {
      parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid date format." 
        });
      }
    }

    // Handle file upload for posts and flyers
    let imageUrl = existingPost.imageUrl;
    let videoUrl = existingPost.videoUrl;
    if ((uploadType === 'post' || uploadType === 'flyer') && req.file) {
      try {
        console.log("Uploading new file to S3 for update...");
        const s3Result = await uploadFileToS3(req.file);
        
        // Determine if the file is an image or video
        if (req.file.mimetype.startsWith('image/')) {
          imageUrl = s3Result.Location;
          console.log("New image uploaded successfully:", imageUrl);
        } else if (req.file.mimetype.startsWith('video/')) {
          videoUrl = s3Result.Location;
          console.log("New video uploaded successfully:", videoUrl);
        }
      } catch (uploadError) {
        console.error("Error uploading file to S3:", uploadError);
        return res.status(500).json({ 
          success: false, 
          message: "Failed to upload image to S3",
          error: uploadError.message 
        });
      }
    }

    // Prepare update data
    const updateData = {
      productCompany: productCompany || existingPost.productCompany,
      caption: caption || existingPost.caption,
      platforms: platformArray,
      uploadType: uploadType || existingPost.uploadType,
      date: parsedDate,
      sourceUrl: (uploadType === 'reel' || uploadType === 'post') ? sourceUrl : existingPost.sourceUrl,
      flyerUrl: uploadType === 'flyer' ? (sourceUrl || flyerUrl) : existingPost.flyerUrl,
      imageUrl: (uploadType === 'post' || (uploadType === 'flyer' && req.file?.mimetype.startsWith('image/'))) ? imageUrl : existingPost.imageUrl,
      videoUrl: (uploadType === 'flyer' && req.file?.mimetype.startsWith('video/')) ? videoUrl : existingPost.videoUrl
    };

    console.log("Updating post with data:", updateData);
    const updatedPost = await SocialMedia.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({ 
      success: true, 
      message: "Social media post updated successfully",
      data: updatedPost 
    });
  } catch (error) {
    console.error("Error updating social media post:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update social media post",
      error: error.message 
    });
  }
};

// Delete social media post (only admin can delete)
export const deleteSocialMediaPost = async (req, res) => {
  try {
    // Only admin can delete posts
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Only admin can delete social media posts." 
      });
    }

    const { id } = req.params;
    const deletedPost = await SocialMedia.findByIdAndDelete(id);

    if (!deletedPost) {
      return res.status(404).json({ 
        success: false, 
        message: "Social media post not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Social media post deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting social media post:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete social media post",
      error: error.message 
    });
  }
};