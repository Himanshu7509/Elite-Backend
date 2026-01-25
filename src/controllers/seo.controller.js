import Seo from '../models/seo.model.js';
import Team from '../models/team.model.js';

// Create a new SEO entry
export const createSeoEntry = async (req, res) => {
  try {
    const { productCompany, submissionEntity, count, date, links } = req.body;
    
    // Prepare the base data
    const seoData = {
      productCompany,
      submissionEntity,
      count,
      date,
      links
    };

    // Add tracking information if user is authenticated
    if (req.user) {
      seoData.createdBy = {
        userId: req.user._id,
        email: req.user.email,
        role: req.user.role,
        name: req.user.name
      };
      
      seoData.source = req.user.role || 'other';
    } else {
      // If no user is authenticated, use default values
      seoData.source = 'other';
    }

    const seoEntry = new Seo(seoData);
    await seoEntry.save();

    res.status(201).json({
      success: true,
      message: 'SEO entry created successfully',
      data: seoEntry
    });
  } catch (error) {
    console.error('Error creating SEO entry:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating SEO entry'
    });
  }
};

// Get all SEO entries
export const getAllSeoEntries = async (req, res) => {
  try {
    const { page = 1, limit = 10, productCompany, submissionEntity } = req.query;

    // Build filter object
    const filter = {};
    if (productCompany) filter.productCompany = productCompany;
    if (submissionEntity) filter.submissionEntity = submissionEntity;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const seoEntries = await Seo.find(filter)
      .populate('createdBy.userId', 'name email role')
      .populate('updatedBy.userId', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Seo.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: seoEntries,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalRecords: total,
        hasNextPage: skip + seoEntries.length < total,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching SEO entries:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching SEO entries'
    });
  }
};

// Get a single SEO entry by ID
export const getSeoEntryById = async (req, res) => {
  try {
    const { id } = req.params;

    const seoEntry = await Seo.findById(id)
      .populate('createdBy.userId', 'name email role')
      .populate('updatedBy.userId', 'name email role');

    if (!seoEntry) {
      return res.status(404).json({
        success: false,
        message: 'SEO entry not found'
      });
    }

    res.status(200).json({
      success: true,
      data: seoEntry
    });
  } catch (error) {
    console.error('Error fetching SEO entry:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching SEO entry'
    });
  }
};

// Update SEO entry
export const updateSeoEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { productCompany, submissionEntity, count, date, links } = req.body;

    const seoEntry = await Seo.findById(id);
    if (!seoEntry) {
      return res.status(404).json({
        success: false,
        message: 'SEO entry not found'
      });
    }

    // Prepare update data
    const updateData = {
      productCompany,
      submissionEntity,
      count,
      date,
      links
    };

    // Add updatedBy information if user is authenticated
    if (req.user) {
      updateData.updatedBy = {
        userId: req.user._id,
        email: req.user.email,
        role: req.user.role,
        name: req.user.name
      };
    }

    const updatedSeoEntry = await Seo.findByIdAndUpdate(
      id,
      { ...updateData },
      { new: true, runValidators: true }
    )
    .populate('createdBy.userId', 'name email role')
    .populate('updatedBy.userId', 'name email role');

    res.status(200).json({
      success: true,
      message: 'SEO entry updated successfully',
      data: updatedSeoEntry
    });
  } catch (error) {
    console.error('Error updating SEO entry:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating SEO entry'
    });
  }
};

// Delete SEO entry
export const deleteSeoEntry = async (req, res) => {
  try {
    const { id } = req.params;

    const seoEntry = await Seo.findById(id);
    if (!seoEntry) {
      return res.status(404).json({
        success: false,
        message: 'SEO entry not found'
      });
    }

    await Seo.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'SEO entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting SEO entry:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting SEO entry'
    });
  }
};

// Get unique product companies
export const getProductCompanies = async (req, res) => {
  try {
    const companies = await Seo.distinct('productCompany');
    
    res.status(200).json({
      success: true,
      data: companies
    });
  } catch (error) {
    console.error('Error fetching product companies:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching product companies'
    });
  }
};

// Get unique submission entities
export const getSubmissionEntities = async (req, res) => {
  try {
    const entities = await Seo.distinct('submissionEntity');
    
    res.status(200).json({
      success: true,
      data: entities
    });
  } catch (error) {
    console.error('Error fetching submission entities:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching submission entities'
    });
  }
};