import Blog from '../models/blog.model.js';
import Team from '../models/team.model.js';
import s3 from '../config/s3.js';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

// Memory storage for multer
const storage = multer.memoryStorage();
export const upload = multer({ storage });

// Upload image to AWS S3
const uploadToS3 = async (file) => {
  const fileKey = `blogs/${uuidv4()}-${file.originalname}`;
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileKey,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  const uploaded = await s3.upload(params).promise();
  return uploaded.Location; // Return public URL
};

// Delete image from AWS S3
const deleteFromS3 = async (imageUrl) => {
  try {
    // Extract image key from URL
    const key = imageUrl.split(".amazonaws.com/")[1]; // everything after the domain
    
    // Delete image from S3
    await s3
      .deleteObject({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
      })
      .promise();
  } catch (error) {
    console.error("Error deleting image from S3:", error);
    throw error;
  }
};

// Create a new blog post
export const createBlogPost = async (req, res) => {
  try {
    const { title, content, productCompany, category, tags, status } = req.body;
    
    // Prepare the base data
    const blogData = {
      title,
      content,
      productCompany,
      category,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim())) : [],
      status: status || 'draft'
    };

    // Handle featured image upload
    if (req.file) {
      const imageUrl = await uploadToS3(req.file);
      blogData.featuredImage = imageUrl;
    }

    // Add author information if user is authenticated
    if (req.user) {
      blogData.author = {
        userId: req.user._id,
        email: req.user.email,
        role: req.user.role,
        name: req.user.name
      };
      
      // Set published date if status is published
      if (status === 'published') {
        blogData.publishedAt = new Date();
      }
    }

    console.log('Creating blog post with data:', blogData);
    const blogPost = new Blog(blogData);
    await blogPost.save();
    
    // Log the saved post to see what was actually saved
    const savedPost = await Blog.findById(blogPost._id).populate('author.userId', 'name email role');
    console.log('Saved blog post:', savedPost);

    res.status(201).json({
      success: true,
      message: 'Blog post created successfully',
      data: savedPost
    });
  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating blog post'
    });
  }
};

// Get all blog posts
export const getAllBlogPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, productCompany, category, status, author } = req.query;

    // Build filter object
    const filter = {};
    if (productCompany) filter.productCompany = productCompany;
    if (category) filter.category = category;
    if (status) filter.status = status;
    
    console.log('User info:', req.user);
    console.log('Query params:', { page, limit, productCompany, category, status, author });
    
    // Role-based access: admin can see all, others can only see published posts or their own drafts
    if (req.user && req.user.role && req.user.role !== 'admin') {
      filter.$or = [
        { status: 'published' },
        { 'author.userId': req.user._id }
      ];
      console.log('Non-admin filter applied:', filter);
    } else if (!req.user || !req.user.role) {
      // Non-authenticated users can only see published posts
      filter.status = 'published';
      console.log('Guest filter applied:', filter);
    } else {
      console.log('Admin access - no filter applied');
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const blogPosts = await Blog.find(filter)
      .populate('author.userId', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Blog.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: blogPosts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        hasNextPage: skip + blogPosts.length < total,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching blog posts'
    });
  }
};

// Get a single blog post by ID
export const getBlogPostById = async (req, res) => {
  try {
    const { id } = req.params;

    const blogPost = await Blog.findById(id)
      .populate('author.userId', 'name email role');

    if (!blogPost) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    // Check access permissions
    if (blogPost.status !== 'published' && 
        (!req.user || (req.user.role !== 'admin' && 
         (!blogPost.author || blogPost.author.userId.toString() !== req.user._id.toString())))) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This blog post is not published.'
      });
    }

    // Increment view count
    await Blog.findByIdAndUpdate(id, { $inc: { views: 1 } });

    res.status(200).json({
      success: true,
      data: blogPost
    });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching blog post'
    });
  }
};

// Update blog post
export const updateBlogPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, productCompany, category, tags, status } = req.body;

    // Check if the user has permission to update this post
    const query = { _id: id };
    if (req.user && req.user.role && req.user.role !== 'admin') {
      query['author.userId'] = req.user._id;
    }

    const blogPost = await Blog.findOne(query);
    if (!blogPost) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found or access denied'
      });
    }

    // Prepare update data
    const updateData = {
      title,
      content,
      productCompany,
      category,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim())) : [],
      status
    };

    // Handle featured image update
    if (req.file) {
      // Delete old image from S3 if it exists
      if (blogPost.featuredImage) {
        await deleteFromS3(blogPost.featuredImage);
      }
      
      // Upload new image
      const imageUrl = await uploadToS3(req.file);
      updateData.featuredImage = imageUrl;
    }

    // Set published date if status changes to published
    if (status === 'published' && blogPost.status !== 'published') {
      updateData.publishedAt = new Date();
    }

    const updatedBlogPost = await Blog.findByIdAndUpdate(
      id,
      { ...updateData },
      { new: true, runValidators: true }
    )
    .populate('author.userId', 'name email role');

    res.status(200).json({
      success: true,
      message: 'Blog post updated successfully',
      data: updatedBlogPost
    });
  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating blog post'
    });
  }
};

// Delete blog post
export const deleteBlogPost = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if the user has permission to delete this post
    const query = { _id: id };
    if (req.user && req.user.role && req.user.role !== 'admin') {
      query['author.userId'] = req.user._id;
    }

    const blogPost = await Blog.findOne(query);
    if (!blogPost) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found or access denied'
      });
    }

    // Delete featured image from S3 if it exists
    if (blogPost.featuredImage) {
      await deleteFromS3(blogPost.featuredImage);
    }

    await Blog.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Blog post deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting blog post'
    });
  }
};

// Like a blog post
export const likeBlogPost = async (req, res) => {
  try {
    const { id } = req.params;

    const blogPost = await Blog.findById(id);
    if (!blogPost) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    await Blog.findByIdAndUpdate(id, { $inc: { likes: 1 } });

    res.status(200).json({
      success: true,
      message: 'Blog post liked successfully'
    });
  } catch (error) {
    console.error('Error liking blog post:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error liking blog post'
    });
  }
};

// Get unique categories
export const getBlogCategories = async (req, res) => {
  try {
    const categories = await Blog.distinct('category');
    
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching blog categories:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching blog categories'
    });
  }
};

// Get unique product companies
export const getBlogProductCompanies = async (req, res) => {
  try {
    const companies = await Blog.distinct('productCompany');
    
    res.status(200).json({
      success: true,
      data: companies
    });
  } catch (error) {
    console.error('Error fetching blog product companies:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching blog product companies'
    });
  }
};