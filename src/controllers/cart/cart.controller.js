const { Cart, CartItem, Product, ProductImage } = require("../../models");

/**
 * Get the user's active cart. If not exists, return empty or create one.
 */
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find or create active cart for user
    let [cart] = await Cart.findOrCreate({
      where: { user_id: userId, status: "active" },
      defaults: { user_id: userId, status: "active" },
    });

    // Fetch items with product details
    const cartItems = await CartItem.findAll({
      where: { cart_id: cart.id },
      include: [
        {
          model: Product,
          include: [{ model: ProductImage, as: "images" }],
        },
      ],
    });

    res.json({ cart, items: cartItems });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Add an item to the cart
 */
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id, quantity } = req.body;

    if (!product_id || !quantity) {
      return res
        .status(400)
        .json({ error: "Product ID and quantity are required" });
    }

    // Ensure active cart exists
    let [cart] = await Cart.findOrCreate({
      where: { user_id: userId, status: "active" },
      defaults: { user_id: userId, status: "active" },
    });

    // Check if item already in cart
    const existingItem = await CartItem.findOne({
      where: { cart_id: cart.id, product_id },
    });

    if (existingItem) {
      existingItem.quantity += parseInt(quantity);
      await existingItem.save();
    } else {
      await CartItem.create({
        cart_id: cart.id,
        product_id,
        quantity,
      });
    }

    res.json({ message: "Item added to cart", cartId: cart.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update item quantity
 */
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params; // Cart Item ID
    const { quantity } = req.body;

    if (quantity === undefined) {
      return res.status(400).json({ error: "Quantity is required" });
    }

    const item = await CartItem.findByPk(id);

    if (!item) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    if (quantity <= 0) {
      await item.destroy();
      return res.json({ message: "Item removed from cart" });
    }

    item.quantity = quantity;
    await item.save();

    res.json({ message: "Cart item updated", item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Replace or insert cart items in bulk
 */
exports.setCartItems = async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "Items array is required" });
    }

    const [cart] = await Cart.findOrCreate({
      where: { user_id: req.user.id, status: "active" },
      defaults: { user_id: req.user.id, status: "active" },
    });

    const updates = [];

    for (const item of items) {
      const productId = item?.product_id;
      const quantity = item?.quantity;

      if (!productId || quantity === undefined) continue;

      const existing = await CartItem.findOne({
        where: { cart_id: cart.id, product_id: productId },
      });

      if (quantity <= 0) {
        if (existing) {
          await existing.destroy();
        }
        continue;
      }

      if (existing) {
        existing.quantity = quantity;
        await existing.save();
        updates.push(existing);
      } else {
        const created = await CartItem.create({
          cart_id: cart.id,
          product_id: productId,
          quantity,
        });
        updates.push(created);
      }
    }

    res.json({ message: "Cart items updated", items: updates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update item quantity using user_id + product_id
 */
exports.updateQuantity = async (req, res) => {
  try {
    const { user_id, product_id, quantity } = req.body;

    if (user_id && Number(user_id) !== Number(req.user.id)) {
      return res.status(403).json({ error: "User mismatch" });
    }

    if (!product_id || quantity === undefined) {
      return res.status(400).json({ error: "Product ID and quantity are required" });
    }

    const [cart] = await Cart.findOrCreate({
      where: { user_id: req.user.id, status: "active" },
      defaults: { user_id: req.user.id, status: "active" },
    });

    const item = await CartItem.findOne({
      where: { cart_id: cart.id, product_id },
    });

    if (!item) {
      if (quantity <= 0) {
        return res.json({ message: "Item not in cart" });
      }
      const created = await CartItem.create({
        cart_id: cart.id,
        product_id,
        quantity,
      });
      return res.json({ message: "Cart item created", item: created });
    }

    if (quantity <= 0) {
      await item.destroy();
      return res.json({ message: "Item removed from cart" });
    }

    item.quantity = quantity;
    await item.save();

    res.json({ message: "Cart item updated", item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Remove item from cart
 */
exports.removeItem = async (req, res) => {
  try {
    const { id } = req.params; // Cart Item ID

    const deleted = await CartItem.destroy({ where: { id } });

    if (!deleted) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    res.json({ message: "Item removed from cart" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Clear all items in the cart
 */
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({
      where: { user_id: userId, status: "active" },
    });

    if (cart) {
      await CartItem.destroy({ where: { cart_id: cart.id } });
    }

    res.json({ message: "Cart cleared" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
