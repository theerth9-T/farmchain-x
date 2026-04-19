const express = require('express');
const {
  createComplaint,
  getComplaints,
  updateComplaintStatus
} = require('../controllers/complaints');

const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

router
  .route('/')
  .post(protect, createComplaint)
  .get(protect, authorize('admin', 'regulator'), getComplaints);

router
  .route('/:id/status')
  .put(protect, authorize('admin'), updateComplaintStatus);

module.exports = router;
