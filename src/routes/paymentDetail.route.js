import express from 'express'
import { createPaymentDetail, getAllPaymentDetails, upload, deletePaymentDetail, updatePaymentDetail } from '../controllers/paymentDetail.controller.js'
import { verifyToken } from '../middleware/auth.middleware.js';
import { optionalAuth } from '../middleware/optionalAuth.middleware.js';
import { isAuthenticated } from '../middleware/role.middleware.js';

const PaymentDetailRouter = express.Router();

// POST: Create payment detail (optional authentication to track creator)
PaymentDetailRouter.post("/create", optionalAuth, upload.single("uploadImg"), createPaymentDetail);

// GET: Get payment details based on user role (authenticated users)
PaymentDetailRouter.get("/get-all", verifyToken, isAuthenticated, getAllPaymentDetails);

// PUT: Update a payment detail (authenticated users)
PaymentDetailRouter.put("/update/:id", verifyToken, isAuthenticated, upload.single("uploadImg"), updatePaymentDetail);

// DELETE: Delete a payment detail (authenticated users)
PaymentDetailRouter.delete("/delete/:id", verifyToken, isAuthenticated, deletePaymentDetail);

export default PaymentDetailRouter;