const express = require('express');
const {
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost,
  likePost,
  addComment,
  deleteComment,
  getComments,
  getCommunityStats,
  getTrendingTopics,
  getTopContributors
} = require('../controllers/communityController');

const router = express.Router();

const { protect } = require('../middlewares/auth');

router.use(protect);

router.get('/stats', getCommunityStats);
router.get('/trending-topics', getTrendingTopics);
router.get('/top-contributors', getTopContributors);

// Post routes
router.route('/posts')
  .post(createPost)
  .get(getPosts);

router.route('/posts/:id')
  .get(getPost)
  .put(updatePost)
  .delete(deletePost);

router.put('/posts/:id/like', likePost);

// Comment routes
router.post('/posts/:postId/comments', addComment);
router.get('/posts/:postId/comments', getComments);
router.delete('/comments/:id', deleteComment);

module.exports = router;
