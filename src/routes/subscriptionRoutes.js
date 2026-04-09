const express = require('express');
const {
    getSubscription,
    updateSubscription,
    cancelSubscription
} = require('../controllers/subscriptionController');

const router = express.Router();

const { protect } = require('../middlewares/auth');

router.use(protect);

router.route('/')
    .get(getSubscription)
    .put(updateSubscription)
    .delete(cancelSubscription);

module.exports = router;
