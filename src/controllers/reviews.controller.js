const { Review, Product } = require("../models");

async function getProductByCode(prodCode) {
  return Product.findOne({ where: { prod_code: prodCode } });
}

exports.listByProduct = async (req, res, next) => {
  try {
    const { prod_code } = req.params;
    const product = await getProductByCode(prod_code);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const items = await Review.findAll({
      where: { product_id: product.id },
      attributes: { exclude: ["id", "product_id", "user_id"] },
      order: [["created_at", "DESC"]],
    });

    res.json({ prod_code, reviews: items });
  } catch (e) { next(e); }
};

exports.upsertReview = async (req, res, next) => {
  try {
    const { prod_code, rating, comment } = req.body;

    if (!prod_code || rating === undefined) {
      return res.status(400).json({ message: "prod_code and rating are required" });
    }

    const parsedRating = Number(rating);
    if (Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({ message: "rating must be between 1 and 5" });
    }

    const product = await getProductByCode(prod_code);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const existing = await Review.findOne({
      where: { user_id: req.user.id, product_id: product.id },
    });

    if (existing) {
      await existing.update({
        rating: parsedRating,
        comment: comment || null,
        updated_at: new Date(),
      });
      return res.json({ message: "Review updated" });
    }

    await Review.create({
      user_id: req.user.id,
      product_id: product.id,
      rating: parsedRating,
      comment: comment || null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    res.status(201).json({ message: "Review added" });
  } catch (e) { next(e); }
};
