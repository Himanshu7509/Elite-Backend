import Notification from '../models/notification.model.js';
import Team from '../models/team.model.js';
import { sendPushNotification } from '../config/firebase.js';
import asyncHandler from 'express-async-handler';

// Get user notifications
export const getUserNotifications = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  const { page = 1, limit = 20, type, isRead } = req.query;

  let query = { userId };
  
  if (type) query.type = type;
  if (isRead !== undefined) query.isRead = isRead === 'true';

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Notification.countDocuments(query);

  res.json({
    success: true,
    data: notifications,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total
    }
  });
});

// Mark notification as read
export const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;

  const notification = await Notification.findOneAndUpdate(
    { _id: id, userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  res.json({ success: true, data: notification });
});

// Mark all as read
export const markAllAsRead = asyncHandler(async (req, res) => {
  const { userId } = req.user;

  await Notification.updateMany(
    { userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );

  res.json({ success: true, message: 'All notifications marked as read' });
});

// Get unread count
export const getUnreadCount = asyncHandler(async (req, res) => {
  const { userId } = req.user;
  
  const count = await Notification.countDocuments({
    userId,
    isRead: false
  });

  res.json({ success: true, data: { count } });
});

// Register FCM token for user
export const registerToken = asyncHandler(async (req, res) => {
  const { token, userId } = req.body;
  
  if (!token || !userId) {
    res.status(400);
    throw new Error('Token and userId are required');
  }

  // Find user and update their FCM tokens
  const user = await Team.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Add token if it doesn't exist in the array
  if (!user.fcmTokens.includes(token)) {
    user.fcmTokens.push(token);
    await user.save();
  }

  res.json({ success: true, message: 'Token registered successfully' });
});

// Send notification to user
export const sendNotification = asyncHandler(async (userId, notificationData) => {
  try {
    // Create notification record
    const notification = new Notification({
      userId,
      ...notificationData
    });

    await notification.save();

    // Get user's FCM tokens
    const user = await Team.findById(userId);
    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
      // If no FCM tokens, just save the notification to DB
      return notification;
    }

    // Send push notification via FCM
    const payload = {
      title: notificationData.title,
      body: notificationData.message,
      data: {
        notificationId: notification._id.toString(),
        type: notificationData.type,
        ...notificationData.metadata
      }
    };

    await sendPushNotification(user.fcmTokens, payload);

    return notification;
  } catch (error) {
    console.error('Error sending notification:', error);
    // Still save the notification even if push fails
    const notification = new Notification({
      userId,
      ...notificationData
    });

    await notification.save();
    return notification;
  }
});

// Get all user tokens for broadcast
export const getAllUserTokens = asyncHandler(async (req, res) => {
  const users = await Team.find({ fcmTokens: { $exists: true, $ne: [] } });
  const allTokens = [];
  
  users.forEach(user => {
    allTokens.push(...user.fcmTokens);
  });

  res.json({ success: true, data: allTokens });
});

// Broadcast notification to all users
export const broadcastNotification = asyncHandler(async (req, res) => {
  const { title, message, type, priority } = req.body;

  // Get all user tokens
  const users = await Team.find({ fcmTokens: { $exists: true, $ne: [] } });
  
  // Create notifications for all users
  const notifications = [];
  for (const user of users) {
    const notification = new Notification({
      userId: user._id,
      title,
      message,
      type: type || 'system',
      priority: priority || 'medium'
    });
    
    await notification.save();
    notifications.push(notification);
  }

  // Send push notifications to all tokens
  const allTokens = [];
  users.forEach(user => {
    allTokens.push(...user.fcmTokens);
  });

  if (allTokens.length > 0) {
    const payload = {
      title,
      body: message,
      data: {
        type: type || 'system'
      }
    };

    await sendPushNotification(allTokens, payload);
  }

  res.json({ 
    success: true, 
    message: 'Broadcast notification sent successfully',
    count: notifications.length 
  });
});