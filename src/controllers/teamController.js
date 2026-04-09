const { Project, User, TeamMember, Task } = require('../models');
const { Op } = require('sequelize');

// @desc    Add member to project
// @route   POST /api/v1/projects/:projectId/team
// @access  Private (Owner/Admin)
exports.addMember = async (req, res, next) => {
  try {
    const { email, role, jobTitle } = req.body;

    const project = await Project.findByPk(req.params.projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: `Project not found with id of ${req.params.projectId}`
      });
    }

    // Check ownership or admin privileges
    // For now, let's strictly allow only the owner to add members to avoid complexity
    if (project.ownerId !== req.user.id) {
        // Check if user is an admin member
        const member = await TeamMember.findOne({
            where: {
                projectId: project.id,
                userId: req.user.id,
                role: 'admin'
            }
        });

        if (!member) {
            return res.status(403).json({
                success: false,
                message: `User ${req.user.id} is not authorized to add members to this project`
            });
        }
    }

    const userToAdd = await User.findOne({ where: { email } });

    if (!userToAdd) {
      return res.status(404).json({
        success: false,
        message: `User not found with email ${email}`
      });
    }

    // Check if user is already a member
    const existingMember = await TeamMember.findOne({
        where: {
            projectId: project.id,
            userId: userToAdd.id
        }
    });

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this project'
      });
    }
    
    // Check if user is the owner
    if (project.ownerId === userToAdd.id) {
        return res.status(400).json({
            success: false,
            message: 'Project owner cannot be added as a member'
        });
    }

    const newMember = await TeamMember.create({
        projectId: project.id,
        userId: userToAdd.id,
        role: role || 'viewer',
        jobTitle: jobTitle || null,
        status: 'invited'
    });

    // Fetch all members with user details and task counts
    const members = await TeamMember.findAll({
        where: { projectId: project.id },
        include: [
            {
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'email', 'avatarUrl']
            }
        ]
    });

    // Get task counts for each member
    // Since Sequelize count with association is tricky with group by in `findAll`, 
    // we'll fetch tasks counts separately or use a raw query if performance matters.
    // For now, let's map over members and count tasks. This is acceptable for small teams.
    const membersWithTasks = await Promise.all(members.map(async (member) => {
        const taskCount = await Task.count({
            where: {
                projectId: project.id,
                assignedTo: member.userId,
                status: { [Op.ne]: 'done' } // Count active tasks? Or all tasks? Screenshot says "5 tasks". Let's count all assigned.
            }
        });
        
        // Also count completed tasks if needed, but for now total assigned seems to be the metric
        
        return {
            ...member.toJSON(),
            assignedTaskCount: taskCount
        };
    }));

    res.status(200).json({
      success: true,
      data: membersWithTasks
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get project members
// @route   GET /api/v1/projects/:projectId/team
// @access  Private (Member/Owner)
exports.getMembers = async (req, res, next) => {
  try {
    const project = await Project.findByPk(req.params.projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: `Project not found with id of ${req.params.projectId}`
      });
    }

    // Check authorization (Owner or Member)
    const isOwner = project.ownerId === req.user.id;
    
    let isMember = false;
    if (!isOwner) {
        const member = await TeamMember.findOne({
            where: {
                projectId: project.id,
                userId: req.user.id
            }
        });
        if (member) isMember = true;
    }

    if (!isOwner && !isMember) {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to view this project's members`
      });
    }

    const members = await TeamMember.findAll({
        where: { projectId: project.id },
        include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email', 'avatarUrl']
        }]
    });

    const membersWithTasks = await Promise.all(members.map(async (member) => {
        const taskCount = await Task.count({
            where: {
                projectId: project.id,
                assignedTo: member.userId
            }
        });
        
        return {
            ...member.toJSON(),
            assignedTaskCount: taskCount
        };
    }));

    res.status(200).json({
      success: true,
      count: members.length,
      data: membersWithTasks
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update member role
// @route   PUT /api/v1/projects/:projectId/team/:userId
// @access  Private (Owner/Admin)
exports.updateMember = async (req, res, next) => {
    try {
        const project = await Project.findByPk(req.params.projectId);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: `Project not found with id of ${req.params.projectId}`
            });
        }

        // Verify requester permissions (Owner or Admin)
        if (project.ownerId !== req.user.id) {
            const requester = await TeamMember.findOne({
                where: {
                    projectId: project.id,
                    userId: req.user.id,
                    role: 'admin'
                }
            });

            if (!requester) {
                return res.status(403).json({
                    success: false,
                    message: `User ${req.user.id} is not authorized to update members`
                });
            }
        }

        const memberToUpdate = await TeamMember.findOne({
            where: {
                projectId: project.id,
                userId: req.params.userId
            }
        });

        if (!memberToUpdate) {
            return res.status(404).json({
                success: false,
                message: `Member not found in this project`
            });
        }

        const { role, jobTitle, status } = req.body;

        // Prevent updating to owner role
        if (role === 'owner') {
            return res.status(400).json({
                success: false,
                message: 'Cannot assign owner role via update. Transfer ownership instead.'
            });
        }

        await memberToUpdate.update({
            role: role || memberToUpdate.role,
            jobTitle: jobTitle !== undefined ? jobTitle : memberToUpdate.jobTitle,
            status: status || memberToUpdate.status
        });

        res.status(200).json({
            success: true,
            data: memberToUpdate
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Remove member
// @route   DELETE /api/v1/projects/:projectId/team/:userId
// @access  Private (Owner/Admin)
exports.removeMember = async (req, res, next) => {
    try {
        const project = await Project.findByPk(req.params.projectId);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: `Project not found with id of ${req.params.projectId}`
            });
        }

        // Verify requester permissions (Owner or Admin)
        if (project.ownerId !== req.user.id) {
            const requester = await TeamMember.findOne({
                where: {
                    projectId: project.id,
                    userId: req.user.id,
                    role: 'admin'
                }
            });

            if (!requester) {
                return res.status(403).json({
                    success: false,
                    message: `User ${req.user.id} is not authorized to remove members`
                });
            }
        }

        const memberToRemove = await TeamMember.findOne({
            where: {
                projectId: project.id,
                userId: req.params.userId
            }
        });

        if (!memberToRemove) {
            return res.status(404).json({
                success: false,
                message: `Member not found in this project`
            });
        }

        await memberToRemove.destroy();

        res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Invite member by email (placeholder for email service)
// @route   POST /api/v1/projects/:projectId/team/invite
// @access  Private (Owner/Admin)
exports.inviteMember = async (req, res, next) => {
    // Re-use addMember logic for now as 'invite' essentially adds them as 'invited'
    // In future, this would send an email.
    req.body.status = 'invited';
    return this.addMember(req, res, next);
};
