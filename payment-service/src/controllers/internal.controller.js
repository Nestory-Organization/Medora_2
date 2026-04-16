const Transaction = require('../models/transaction.model');

exports.listTransactions = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status && ['pending', 'completed', 'failed', 'refunded'].includes(req.query.status)) {
      filter.status = req.query.status;
    }

    const [items, total, revenueAgg] = await Promise.all([
      Transaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Transaction.countDocuments(filter),
      Transaction.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const revenue = revenueAgg[0]?.total ? Number(revenueAgg[0].total) : 0;

    res.json({
      success: true,
      data: {
        items,
        pagination: { page, limit, total },
        revenue
      }
    });
  } catch (error) {
    console.error('Internal listTransactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list transactions',
      error: error.message
    });
  }
};
