import Cart from "../../models/cartModel.js";
import Variant from "../../models/variantModel.js";
import Product from "../../models/productModel.js";

export const addToCartService = async (
    userId,
    productId,
    variantId,
    quantity
) => {

    let cart = await Cart.findOne({ userId });

    if (!cart) {

        cart = new Cart({
            userId,
            items: [
                {
                    productId,
                    variantId,
                    quantity
                }
            ]
        });

        await cart.save();

        return {
            success: true,
            message: "Product added to cart"
        };
    }

    const existingItem = cart.items.find(
        item => item.variantId.toString() === variantId.toString()
    );

    if (existingItem) {

        existingItem.quantity += Number(quantity);

    } else {

        cart.items.push({
            productId,
            variantId,
            quantity
        });
    }

    await cart.save();

    return {
        success: true,
        message: "Product added to cart"
    };
};



export const loadCartService = async (userId) => {

    const cart = await Cart.findOne({ userId })
        .populate("items.productId")
        .populate("items.variantId");

    if (!cart) {
        return {
            cart: null,
            subtotal: 0,
            discount: 0,
            shippingCharge: 0,
            tax: 0,
            total: 0
        };
    }

    let subtotal = 0;

    cart.items.forEach((item) => {

        const variant = item.variantId;

        let price = variant.price;

        if (
            variant.offerPrice &&
            variant.offerPrice > 0 &&
            variant.offerPrice < variant.price
        ) {
            price = variant.offerPrice;
        }

        subtotal += price * item.quantity;
    });

    const discount = 0;

    const shippingCharge = 0;

    const tax = 0;

    const total =
        subtotal -
        discount +
        shippingCharge +
        tax;


    return {
        cart,
        subtotal,
         discount,
        shippingCharge,
        tax,
        total
    };
};


export const updateCartService = async (
    userId,
    variantId,
    quantity
) => {

    const cart = await Cart.findOne({ userId });

    if (!cart) {
        return {
            success: false,
            message: "Cart not found"
        };
    }

    const item = cart.items.find(
        item => item.variantId.toString() === variantId
    );

    if (!item) {
        return {
            success: false,
            message: "Item not found in cart"
        };
    }

    if (quantity < 1) {
        return {
            success: false,
            message: "Quantity cannot be less than 1"
        };
    }

    const variant = await Variant.findById(variantId);

    if (!variant) {
        return {
            success: false,
            message: "Variant not found"
        };
    }

    // Stock validation
    if (quantity > variant.stock) {
        return {
            success: false,
            message: `Only ${variant.stock} items available`
        };
    }


    item.quantity = quantity;

    await cart.save();

    return {
        success: true,
        message: "Cart updated successfully"
    };
};


export const removeFromCartService = async (
    userId,
    variantId
) => {

    const cart = await Cart.findOne({ userId });

    if (!cart) {
        return {
            success: false,
            message: "Cart not found"
        };
    }

    const itemIndex = cart.items.findIndex(
        item => item.variantId.toString() === variantId
    );

    if (itemIndex === -1) {
        return {
            success: false,
            message: "Item not found in cart"
        };
    }

    cart.items.splice(itemIndex, 1);

    await cart.save();

    return {
        success: true,
        message: "Item removed from cart"
    };
};