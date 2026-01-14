const { Product, ProductImage, sequelize } = require("../models");

function normalizeImages(images, prodCode) {
  if (!Array.isArray(images)) return [];
  return images
    .map((img) => {
      if (typeof img === "string") return { prod_code: prodCode, image: img };
      if (img && typeof img.image === "string") return { prod_code: prodCode, image: img.image };
      return null;
    })
    .filter(Boolean);
}

exports.list = async (req, res, next) => {
  try {
    const { q, department, category, sub_category } = req.query;

    const where = {};
    if (department) where.department = department;
    if (category) where.category = category;
    if (sub_category) where.sub_category = sub_category;

    // Simple search
    if (q) {
      const { Op } = require("sequelize");
      where[Op.or] = [
        { prod_code: { [Op.like]: `%${q}%` } },
        { prod_name: { [Op.like]: `%${q}%` } },
        { isbn: { [Op.like]: `%${q}%` } }
      ];
    }

    const items = await Product.findAll({
      where,
      order: [["id", "DESC"]],
      include: [{ model: ProductImage, as: "images" }]
    });
    res.json(items);
  } catch (e) { next(e); }
};

exports.getById = async (req, res, next) => {
  try {
    const item = await Product.findByPk(req.params.id, {
      include: [{ model: ProductImage, as: "images" }]
    });
    if (!item) return res.status(404).json({ message: "Product not found" });
    res.json(item);
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const created = await sequelize.transaction(async (t) => {
      const product = await Product.create(req.body, { transaction: t });
      const images = normalizeImages(req.body.images, product.prod_code);
      if (images.length) {
        await ProductImage.bulkCreate(images, { transaction: t });
      }
      return product;
    });
    const withImages = await Product.findByPk(created.id, {
      include: [{ model: ProductImage, as: "images" }]
    });
    res.status(201).json(withImages);
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const item = await Product.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: "Product not found" });

    await sequelize.transaction(async (t) => {
      await item.update(req.body, { transaction: t });
      if (Array.isArray(req.body.images)) {
        await ProductImage.destroy({ where: { prod_code: item.prod_code }, transaction: t });
        const images = normalizeImages(req.body.images, item.prod_code);
        if (images.length) {
          await ProductImage.bulkCreate(images, { transaction: t });
        }
      }
    });
    const withImages = await Product.findByPk(req.params.id, {
      include: [{ model: ProductImage, as: "images" }]
    });
    res.json(withImages);
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    const item = await Product.findByPk(req.params.id);
    if (!item) return res.status(404).json({ message: "Product not found" });

    await item.destroy();
    res.json({ ok: true });
  } catch (e) { next(e); }
};
