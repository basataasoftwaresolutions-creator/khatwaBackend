const { Task, Project, User } = require('../models');

// @desc    Create a task for a project
// @route   POST /api/v1/projects/:projectId/tasks
// @access  Private (Member/Owner)
exports.createTask = async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: `Project not found with id of ${req.params.projectId}`
      });
    }

    // Verify access (Owner only for now)
    if (project.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to add tasks to this project`
      });
    }

    req.body.projectId = req.params.projectId;

    const task = await Task.create(req.body);

    res.status(201).json({
      success: true,
      data: task
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get tasks for a project
// @route   GET /api/v1/projects/:projectId/tasks
// @access  Private (Member/Owner)
exports.getTasks = async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: `Project not found with id of ${req.params.projectId}`
      });
    }

    // Verify access (Owner only for now)
    if (project.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to view this project's tasks`
      });
    }

    let query = { projectId: req.params.projectId };

    // Status filtering
    if (req.query.status) {
      query.status = req.query.status;
    }

    const tasks = await Task.findAll({
      where: query,
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['name', 'email']
        }
      ]
    });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update task status/details
// @route   PUT /api/v1/tasks/:id
// @access  Private (Member/Owner)
exports.updateTask = async (req, res, next) => {
  try {
    let task = await Task.findByPk(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: `Task not found with id of ${req.params.id}`
      });
    }

    // Check project ownership to verify access
    const project = await Project.findByPk(task.projectId);
    
    // If project is deleted but task exists (orphan), or just verifying access
    if (project && project.ownerId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to update this task`
      });
    }

    task = await task.update(req.body);

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete task
// @route   DELETE /api/v1/tasks/:id
// @access  Private (Member/Owner)
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findByPk(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: `Task not found with id of ${req.params.id}`
      });
    }

    // Verify project access
    const project = await Project.findByPk(task.projectId);
    if (project.ownerId !== req.user.id) {
        // Allow if user is assignee? Or only owner/admin?
        // For simplicity, only owner can delete tasks for now, or the assignee.
        if (task.assignedTo !== req.user.id) {
             return res.status(403).json({
                success: false,
                message: `User ${req.user.id} is not authorized to delete this task`
            });
        }
    }

    await task.destroy();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};
