const express = require('express');
const {
  getBatches,
  getBatch,
  createBatch,
  updateStatus,
  updateBatch,
  deleteBatch,
  getSensorData,
  getLedger
} = require('../controllers/batches');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router
  .route('/')
  .get(protect, getBatches)
  .post(protect, authorize('farmer', 'distributor', 'admin'), createBatch);

router
  .route('/:id')
  .get(protect, getBatch)
  .put(protect, authorize('farmer', 'distributor', 'admin'), updateBatch)
  .delete(protect, authorize('farmer', 'distributor', 'admin'), deleteBatch);

router
  .route('/:id/status')
  .put(protect, authorize('farmer', 'distributor', 'regulator', 'admin'), updateStatus);

router
  .route('/:id/sensors')
  .get(protect, getSensorData);

router
  .route('/:id/ledger')
  .get(protect, getLedger);

module.exports = router;
