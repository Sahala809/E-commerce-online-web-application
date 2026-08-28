import Wishlist from "../../models/wishlistModel.js";
import Product from "../../models/productModel.js";
import Variant from "../../models/variantModel.js";


export const loadWishlistService = async (userId) => {

    const wishlist = await Wishlist.findOne({ userId })
        .populate("items.productId")
        .populate("items.variantId")
        .lean();

    if (!wishlist) {
        return {
            userId,
            items: []
        };
    }


    return wishlist;
};


export const addToWishlistService = async (
    userId,
    productId,
    variantId
) => {

    let wishlist = await Wishlist.findOne({ userId });

    // Create wishlist if user doesn't have one
    if (!wishlist) {

        wishlist = await Wishlist.create({
            userId,
            items: [
                {
                    productId,
                    variantId
                }
            ]
        });

        return {
            success: true,
            message: "Product added to wishlist."
        };
    }

    // Check whether same product + variant already exists
    const alreadyExists = wishlist.items.some(
        item =>
            item.productId.toString() === productId.toString() &&
            item.variantId.toString() === variantId.toString()
    );

    if (alreadyExists) {

        return {
            success: false,
            message: "Product is already in your wishlist."
        };
    }

    // Add new item
    wishlist.items.push({
        productId,
        variantId
    });

    await wishlist.save();

    return {
        success: true,
        message: "Product added to wishlist."
    };
};

export const removeFromWishlistService = async (
    userId,
    productId,
    variantId
) => {

    const wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
        return {
            success: false,
            message: "Wishlist not found."
        };
    }

    const itemIndex = wishlist.items.findIndex(
        item =>
            item.productId &&
            item.variantId &&
            item.productId.toString() === productId &&
            item.variantId.toString() === variantId
    );

    if (itemIndex === -1) {
        return {
            success: false,
            message: "Item not found in wishlist."
        };
    }

    wishlist.items.splice(itemIndex, 1);

    await wishlist.save();

    return {
        success: true,
        message: "Product removed from wishlist."
    };
};

export const removeWishlistItemService = async (
    userId,
    itemId
) => {

    const wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
        return {
            success: false,
            message: "Wishlist not found."
        };
    }

    const itemIndex = wishlist.items.findIndex(
        item => item._id.toString() === itemId
    );

    if (itemIndex === -1) {
        return {
            success: false,
            message: "Wishlist item not found."
        };
    }

    wishlist.items.splice(itemIndex, 1);

    await wishlist.save();

    return {
        success: true,
        message: "Item removed from wishlist."
    };
};