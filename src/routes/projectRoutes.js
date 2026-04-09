const express = require('express');
const {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  uploadProjectLogo
} = require('../controllers/projectController');

const { getDashboardStats } = require('../controllers/dashboardController');

const { protect } = require('../middlewares/auth');
const { uploadProjectLogo: uploadProjectLogoMiddleware } = require('../middlewares/uploadProjectLogo');

const router = express.Router();

// All routes are protected
router.use(protect);

router
  .route('/')
  .get(getProjects)
  .post(createProject);

router
  .route('/:id/dashboard')
  .get(getDashboardStats);

router.post('/:id/logo', uploadProjectLogoMiddleware, uploadProjectLogo);

router
  .route('/:id')
  .get(getProject)
  .put(updateProject)
  .delete(deleteProject);

module.exports = router;
