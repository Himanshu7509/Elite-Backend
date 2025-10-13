import express from 'express'
import { createPaymentDetail, getAllPaymentDetails, upload, deletePaymentDetail } from '../controllers/paymentDetail.controller.js'

const PayamentDetailRouter = express.Router();

// POST: Create payment detail
PayamentDetailRouter.post("/create", upload.single("uploadImg"), createPaymentDetail);

// GET: Get all payment details
PayamentDetailRouter.get("/get-all", getAllPaymentDetails);

// DELETE: Delete a payment detail
PayamentDetailRouter.delete("/delete/:id", deletePaymentDetail);

export default PayamentDetailRouter;

