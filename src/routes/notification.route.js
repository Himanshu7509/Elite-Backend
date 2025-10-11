import express from 'express';
import NotificationController from '../controllers/notification.controller.js';

const router = express.Router();
const notificationController = new NotificationController();

// Send multi-channel notification
router.post('/send', async (req, res) => {
  try {
    const { recipient, subject, message, priority, channels, fallback } = req.body;

    // Validation
    if (!recipient || !message) {
      return res.status(400).json({
        success: false,
        message: 'Recipient and message are required'
      });
    }

    const options = {
      recipient,
      subject: subject || 'Notification from Elite Associate',
      message,
      priority: priority || 'normal',
      channels: channels || ['email', 'inApp'],
      fallback: fallback !== false
    };

    const result = await notificationController.sendNotification(options);

    res.status(200).json({
      success: result.totalSent > 0,
      message: result.totalSent > 0 ? 'Notification sent successfully' : 'All notification channels failed',
      data: result
    });

  } catch (error) {
    console.error('Notification send error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message
    });
  }
});

// Send email with SMTP fallback
router.post('/email', async (req, res) => {
  try {
    const { recipient, subject, message } = req.body;

    if (!recipient || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Recipient, subject, and message are required'
      });
    }

    const result = await notificationController.sendEmail(recipient, subject, message);

    res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      data: result
    });

  } catch (error) {
    console.error('Email send error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
});

// Send in-app notification
router.post('/in-app', async (req, res) => {
  try {
    const { userId, title, message } = req.body;

    if (!userId || !message) {
      return res.status(400).json({
        success: false,
        message: 'User ID and message are required'
      });
    }

    const result = await notificationController.sendInAppNotification(
      userId, 
      title || 'Notification', 
      message
    );

    res.status(200).json({
      success: true,
      message: 'In-app notification sent successfully',
      data: result
    });

  } catch (error) {
    console.error('In-app notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send in-app notification',
      error: error.message
    });
  }
});

// Get notification statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await notificationController.getNotificationStats();
    
    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notification statistics',
      error: error.message
    });
  }
});

// Test all notification channels
router.post('/test', async (req, res) => {
  try {
    const { recipient } = req.body;

    if (!recipient) {
      return res.status(400).json({
        success: false,
        message: 'Recipient is required for testing'
      });
    }

    const testOptions = {
      recipient,
      subject: 'Test Notification - Elite Associate',
      message: 'This is a test notification to verify all channels are working correctly.',
      priority: 'high',
      channels: ['email', 'inApp'],
      fallback: true
    };

    const result = await notificationController.sendNotification(testOptions);

    res.status(200).json({
      success: result.totalSent > 0,
      message: 'Test notification completed',
      data: {
        ...result,
        testInfo: {
          timestamp: new Date().toISOString(),
          channelsTested: testOptions.channels,
          recipient: recipient
        }
      }
    });

  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Test notification failed',
      error: error.message
    });
  }
});

export default router;