import { sendNotification } from '../controllers/notification.controller.js';

/**
 * Helper function to create and send notifications for various events
 */

// New lead notification
export const notifyNewLead = async (assignedUserId, leadData) => {
  try {
    const notificationData = {
      title: 'New Lead Assigned',
      message: `A new lead "${leadData.fullName}" has been assigned to you`,
      type: 'lead',
      priority: 'medium',
      entityId: leadData._id,
      entityType: 'Lead',
      metadata: {
        leadId: leadData._id?.toString(),
        leadName: leadData.fullName,
        email: leadData.email,
        phone: leadData.phone
      }
    };

    await sendNotification(assignedUserId, notificationData);
  } catch (error) {
    console.error('Error sending new lead notification:', error);
  }
};

// New team member notification
export const notifyNewTeamMember = async (adminUserId, memberData) => {
  try {
    const notificationData = {
      title: 'New Team Member Added',
      message: `${memberData.name} has joined the team as ${memberData.role}`,
      type: 'team',
      priority: 'low',
      entityId: memberData._id,
      entityType: 'TeamMember',
      metadata: {
        memberId: memberData._id?.toString(),
        memberName: memberData.name,
        role: memberData.role
      }
    };

    await sendNotification(adminUserId, notificationData);
  } catch (error) {
    console.error('Error sending new team member notification:', error);
  }
};

// New report notification
export const notifyNewReport = async (userId, reportData) => {
  try {
    const notificationData = {
      title: 'New Report Available',
      message: `Report "${reportData.title || 'Untitled'}" has been generated`,
      type: 'report',
      priority: 'medium',
      entityId: reportData._id,
      entityType: 'Report',
      metadata: {
        reportId: reportData._id?.toString(),
        reportTitle: reportData.title,
        reportType: reportData.type,
        generatedBy: reportData.generatedBy
      }
    };

    await sendNotification(userId, notificationData);
  } catch (error) {
    console.error('Error sending new report notification:', error);
  }
};

// System change notification
export const notifySystemChange = async (affectedUsersIds, changeData) => {
  try {
    const notificationData = {
      title: 'System Update',
      message: changeData.message || 'A system change has been made',
      type: 'system',
      priority: changeData.priority || 'medium',
      entityId: changeData.entityId,
      entityType: changeData.entityType,
      metadata: changeData.metadata || {}
    };

    // Send to all affected users
    for (const userId of affectedUsersIds) {
      await sendNotification(userId, notificationData);
    }
  } catch (error) {
    console.error('Error sending system change notification:', error);
  }
};

// Payment notification
export const notifyPaymentUpdate = async (userId, paymentData) => {
  try {
    const notificationData = {
      title: 'Payment Update',
      message: `Payment status updated to ${paymentData.status}`,
      type: 'payment',
      priority: 'high',
      entityId: paymentData._id,
      entityType: 'Payment',
      metadata: {
        paymentId: paymentData._id?.toString(),
        amount: paymentData.amount,
        status: paymentData.status,
        reference: paymentData.referenceNumber
      }
    };

    await sendNotification(userId, notificationData);
  } catch (error) {
    console.error('Error sending payment notification:', error);
  }
};

// B2B notification
export const notifyNewB2BEntry = async (userId, b2bData) => {
  try {
    const notificationData = {
      title: 'New B2B Entry',
      message: `New B2B opportunity: ${b2bData.companyName}`,
      type: 'b2b',
      priority: 'medium',
      entityId: b2bData._id,
      entityType: 'B2B',
      metadata: {
        b2bId: b2bData._id?.toString(),
        companyName: b2bData.companyName,
        contactPerson: b2bData.contactPerson
      }
    };

    await sendNotification(userId, notificationData);
  } catch (error) {
    console.error('Error sending B2B notification:', error);
  }
};

// Enrollment notification
export const notifyNewEnrollment = async (userId, enrollmentData) => {
  try {
    const notificationData = {
      title: 'New Enrollment',
      message: `New enrollment for: ${enrollmentData.studentName}`,
      type: 'enrollment',
      priority: 'medium',
      entityId: enrollmentData._id,
      entityType: 'Enrollment',
      metadata: {
        enrollmentId: enrollmentData._id?.toString(),
        studentName: enrollmentData.studentName,
        course: enrollmentData.course
      }
    };

    await sendNotification(userId, notificationData);
  } catch (error) {
    console.error('Error sending enrollment notification:', error);
  }
};

// Intern Applied Data notification
export const notifyNewInternApplication = async (userId, internData) => {
  try {
    const notificationData = {
      title: 'New Intern Application',
      message: `${internData.name} has applied for internship`,
      type: 'intern',
      priority: 'medium',
      entityId: internData._id,
      entityType: 'InternAppliedData',
      metadata: {
        internId: internData._id?.toString(),
        applicantName: internData.name,
        position: internData.position
      }
    };

    await sendNotification(userId, notificationData);
  } catch (error) {
    console.error('Error sending intern application notification:', error);
  }
};

// Social Media notification
export const notifyNewSocialMediaPost = async (userId, socialMediaData) => {
  try {
    const notificationData = {
      title: 'New Social Media Post',
      message: `New post scheduled: ${socialMediaData.platform}`,
      type: 'social_media',
      priority: 'low',
      entityId: socialMediaData._id,
      entityType: 'SocialMedia',
      metadata: {
        postId: socialMediaData._id?.toString(),
        platform: socialMediaData.platform,
        scheduledDate: socialMediaData.scheduledDate
      }
    };

    await sendNotification(userId, notificationData);
  } catch (error) {
    console.error('Error sending social media notification:', error);
  }
};

// Generic notification function
export const notifyUser = async (userId, title, message, type = 'system', priority = 'medium', metadata = {}) => {
  try {
    const notificationData = {
      title,
      message,
      type,
      priority,
      metadata
    };

    await sendNotification(userId, notificationData);
  } catch (error) {
    console.error('Error sending generic notification:', error);
  }
};

export default {
  notifyNewLead,
  notifyNewTeamMember,
  notifyNewReport,
  notifySystemChange,
  notifyPaymentUpdate,
  notifyNewB2BEntry,
  notifyNewEnrollment,
  notifyNewInternApplication,
  notifyNewSocialMediaPost,
  notifyUser
};