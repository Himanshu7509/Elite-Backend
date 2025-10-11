import express from 'express'
import { createPaymentDetail, getAllPaymentDetails, upload } from '../controllers/paymentDetail.controller.js'

const PyamentDetailRouter = express.Router();

// POST: Create payment detail
PyamentDetailRouter.post("/create", upload.single("uploadImg"), createPaymentDetail);

// GET: Get all payment details
PyamentDetailRouter.get("/get-all", getAllPaymentDetails);

export default PyamentDetailRouter;