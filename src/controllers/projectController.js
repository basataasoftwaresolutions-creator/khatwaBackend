const { Project, OnboardingData } = require('../models');
const path = require('path');

// @desc    Create a new project
// @route   POST /api/v1/projects
// @access  Private
exports.createProject = async (req, res, next) => {
  try {
    // Add user to req.body
    req.body.ownerId = req.user.id;

    const project = await Project.create(req.body);

    res.status(201).json({
      success: true,
      data: project
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Upload a project logo
// @route   POST /api/v1/projects/:id/logo
// @access  Private
exports.uploadProjectLogo = async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: `Project not found with id of ${req.params.id}`
      });
    }

    if (project.ownerId !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to update this project`
      });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Logo file is required' });
    }

const relativePath = req.file.path;
    project.logoUrl = relativePath;
    await project.save();

    res.status(200).json({
      success: true,
      data: { logoUrl: project.logoUrl }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all projects for current user
// @route   GET /api/v1/projects
// @access  Private
exports.getProjects = async (req, res, next) => {
  try {
    const projects = await Project.findAll({ 
      where: { ownerId: req.user.id },
      include: [
        {
          model: OnboardingData,
          as: 'onboardingData',
          attributes: ['aiAnalysisResult']
        }
      ]
    });

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single project
// @route   GET /api/v1/projects/:id
// @access  Private
exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        {
          model: OnboardingData,
          as: 'onboardingData',
          attributes: ['aiAnalysisResult']
        }
      ]
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: `Project not found with id of ${req.params.id}`
      });
    }

    // Make sure user owns the project (or implement more complex permissions later)
    if (project.ownerId !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to access this project`
      });
    }

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update project
// @route   PUT /api/v1/projects/:id
// @access  Private
exports.updateProject = async (req, res, next) => {
  try {
    let project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: `Project not found with id of ${req.params.id}`
      });
    }

    // Make sure user owns the project
    if (project.ownerId !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to update this project`
      });
    }

    project = await project.update(req.body);

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete project
// @route   DELETE /api/v1/projects/:id
// @access  Private
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: `Project not found with id of ${req.params.id}`
      });
    }

    // Make sure user owns the project
    if (project.ownerId !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: `User ${req.user.id} is not authorized to delete this project`
      });
    }

    await project.destroy();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};
