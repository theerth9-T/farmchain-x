const express = require('express');
const {
  getUsers,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/users');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// All routes here are admin only
router.use(protect);
router.use(authorize('admin'));

router
  .route('/')
  .get(getUsers)
  .post(createUser);

router
  .route('/:id')
  .put(updateUser)
  .delete(deleteUser);

module.exports = router;
