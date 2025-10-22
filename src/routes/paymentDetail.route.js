import express from 'express'
import { createPaymentDetail, getAllPaymentDetails, upload, deletePaymentDetail } from '../controllers/paymentDetail.controller.js'
import { verifyToken } from '../middleware/auth.middleware.js';
import { optionalAuth } from '../middleware/optionalAuth.middleware.js';
import { isAuthenticated } from '../middleware/role.middleware.js';

const PayamentDetailRouter = express.Router();

// POST: Create payment detail (optional authentication to track creator)
PayamentDetailRouter.post("/create", optionalAuth, upload.single("uploadImg"), createPaymentDetail);

// GET: Get payment details based on user role (authenticated users)
PayamentDetailRouter.get("/get-all", verifyToken, isAuthenticated, getAllPaymentDetails);

// DELETE: Delete a payment detail (authenticated users)
PayamentDetailRouter.delete("/delete/:id", verifyToken, isAuthenticated, deletePaymentDetail);

export default PayamentDetailRouter;