const { UserSubscription } = require('../models');

// @desc    Get current user's subscription
// @route   GET /api/v1/subscriptions
// @access  Private
exports.getSubscription = async (req, res, next) => {
    try {
        let subscription = await UserSubscription.findOne({ where: { userId: req.user.id } });

        // If no subscription exists, create a default free one
        if (!subscription) {
            subscription = await UserSubscription.create({
                userId: req.user.id,
                planType: 'Free',
                status: 'active'
            });
        }

        res.status(200).json({
            success: true,
            data: subscription
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Update subscription plan (Simulated)
// @route   PUT /api/v1/subscriptions
// @access  Private
exports.updateSubscription = async (req, res, next) => {
    try {
        const { planType } = req.body;

        if (!['Free', 'Pro', 'Business'].includes(planType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid plan type. Available plans: Free, Pro, Business'
            });
        }

        let subscription = await UserSubscription.findOne({ where: { userId: req.user.id } });

        if (!subscription) {
            subscription = await UserSubscription.create({
                userId: req.user.id,
                planType,
                status: 'active',
                startDate: new Date()
            });
        } else {
            subscription = await subscription.update({ 
                planType, 
                status: 'active',
                endDate: null // Reset end date if upgrading/changing
            });
        }

        res.status(200).json({
            success: true,
            data: subscription,
            message: `Successfully updated plan to ${planType}`
        });
    } catch (err) {
        next(err);
    }
};

// @desc    Cancel subscription
// @route   DELETE /api/v1/subscriptions
// @access  Private
exports.cancelSubscription = async (req, res, next) => {
    try {
        let subscription = await UserSubscription.findOne({ where: { userId: req.user.id } });

        if (!subscription) {
            return res.status(404).json({
                success: false,
                message: 'No active subscription found'
            });
        }

        if (subscription.status === 'canceled') {
             return res.status(400).json({
                success: false,
                message: 'Subscription is already canceled'
            });
        }

        subscription = await subscription.update({ 
            status: 'canceled',
            endDate: new Date() // End immediately for simplicity
        });

        res.status(200).json({
            success: true,
            data: subscription,
            message: 'Subscription canceled successfully'
        });
    } catch (err) {
        next(err);
    }
};
