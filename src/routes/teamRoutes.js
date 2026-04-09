const express = require('express');
const {
  addMember,
  getMembers,
  updateMember,
  removeMember,
  inviteMember
} = require('../controllers/teamController');

const router = express.Router();

const { protect } = require('../middlewares/auth');

router.use(protect);

router.post('/projects/:projectId/team/invite', inviteMember);
router.post('/projects/:projectId/team', addMember);
router.get('/projects/:projectId/team', getMembers);
router.put('/projects/:projectId/team/:userId', updateMember);
router.delete('/projects/:projectId/team/:userId', removeMember);

module.exports = router;
