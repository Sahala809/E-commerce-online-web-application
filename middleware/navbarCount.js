import Cart from "../models/cartModel.js";
import Wishlist from "../models/wishlistModel.js";

export const navbarCount = async (req, res, next) => {
    try {

        // Default values
        res.locals.cartCount = 0;
        res.locals.wishlistCount = 0;

        // Get logged-in user
        const userId = req.session.user;

        // If user is not logged in
        if (!userId) {
            return next();
        }

        // Find user's cart
        const cart = await Cart.findOne({ userId });

        if (cart) {
            res.locals.cartCount = cart.items.length;
        }

        // Find user's wishlist
        const wishlist = await Wishlist.findOne({ userId });

        if (wishlist) {
            res.locals.wishlistCount = wishlist.items.length;
        }

        next();

    } catch (error) {

        console.log("NAVBAR COUNT ERROR:", error);

        next();
    }
};