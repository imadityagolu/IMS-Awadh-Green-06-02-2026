const RewardSystem = require('../models/Points&RewardsModel');

exports.createRewardSystem = async (req, res) => {
  try {
    const {
      rewardType,
      offerName,
      amountForPoint,
      minPurchase,
      deadline,
      pointValue,
      maxEligibleAmount,
      minInvoiceValue,
    } = req.body;

    // Validate all required fields
    if (
      !rewardType ||
      !offerName ||
      !amountForPoint ||
      !minPurchase ||
      !deadline ||
      !pointValue ||
      !maxEligibleAmount ||
      !minInvoiceValue
    ) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required in both Reward and Redeem setups.',
      });
    }

    const newReward = new RewardSystem({
      rewardType,
      offerName: offerName.trim(),
      amountForPoint: Number(amountForPoint),
      minPurchase: Number(minPurchase),
      deadline: new Date(deadline),
      pointValue: Number(pointValue),
      maxEligibleAmount: Number(maxEligibleAmount),
      minInvoiceValue: Number(minInvoiceValue),
      status: 'active',
      // createdBy: req.user?._id || null,
    });

    await newReward.save();

    res.status(201).json({
      success: true,
      message: 'Reward system created successfully',
      data: newReward,
    });
  } catch (error) {
    // console.error('Create reward error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getAllRewardSystems = async (req, res) => {
  try {
    const rewards = await RewardSystem.find({ status: 'active' }) // ya sabhi dikhane ke liye {}
      .sort({ createdAt: -1 });

    res.json(rewards);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
