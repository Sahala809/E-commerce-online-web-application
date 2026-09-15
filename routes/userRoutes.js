import express from "express";
import passport from "passport";
import nocache from "nocache";

import {
    googleCallback,
    loadHome,
    loadSignup,
    signup,
    loadVerifyOtp,
    verifyOtp,
    resendOtp,
    loadLogin,
    login,
    logout,
    loadForgotPassword,
    forgotPassword,
    loadForgotPasswordVerifyOtp,
    verifyForgotPasswordOtp,
    resendForgotPasswordOtp,
    loadResetPassword,
    resetPassword
} from "../controllers/userController.js";

import { isLogin } from "../middleware/userAuth.js";
import { noCache } from "../middleware/noCache.js";
import { checkBlockedUser } from "../middleware/checkBlochedUser.js";
import {
    loadProfile,
    editProfile,
    loadChangePassword,
    changePassword,
    loadChangeEmail,
    changeEmail,
    loadVerifyChangeEmailOtp,
    verifyChangeEmailOtp,
    resendChangeEmailOtp
} from "../controllers/userController.js";

import {
    loadAddressList,
    loadAddAddress,
    addAddress,
    loadEditAddress,
    editAddress,
    deleteAddress,
    setDefaultAddress
} from "../controllers/userController.js"

import {
    loadShop,
    loadProductDetail,
    addToCart,
    loadCart,
    updateCart,
    removeFromCart,
    removeUnavailableCartItem
} from "../controllers/userController.js"

import {
    loadWishlist,
    addToWishlist,
    removeWishlistItem,
    removeFromWishlist
} from "../controllers/userController.js"

import {
    loadCheckout,
    loadCheckoutAddresses,
    selectCheckoutAddress
    //placeOrder
} from "../controllers/userController.js"

const router = express.Router();



router.get(
    "/auth/google",
    passport.authenticate("google", {
        scope: ["profile", "email"]
    })
);

router.get(
    "/auth/google/callback",
    passport.authenticate("google", {
        failureRedirect: "/login",
        session: true
    }),
    googleCallback
); 


router.get("/signup", noCache, loadSignup);
router.post("/signup", signup);

router.get("/login" , noCache, loadLogin)
router.post("/login", noCache, login);


router.get("/home",isLogin, noCache, loadHome)
router.get("/", loadHome);



router.get("/logout" , logout)

router.get("/verify-otp", loadVerifyOtp);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);

router.get("/forgot-password", loadForgotPassword);
router.patch("/forgot-password", forgotPassword);

router.get("/forgot-password/verify-otp", loadForgotPasswordVerifyOtp);
router.post("/forgot-password/verify-otp", verifyForgotPasswordOtp)
router.post("/forgot-password/resend-otp", resendForgotPasswordOtp)

router.get("/reset-password", loadResetPassword)
router.patch("/reset-password", resetPassword)

router.get("/profile", isLogin, noCache, loadProfile);
router.patch("/profile/edit", isLogin, editProfile);

router.get("/profile/edit-password", isLogin, nocache, loadChangePassword);
router.post("/profile/edit-password", isLogin, changePassword);

router.get("/profile/edit-email", isLogin, noCache, loadChangeEmail);
router.post("/profile/edit-email", isLogin, changeEmail);

router.get("/profile/verify-email-otp", isLogin, loadVerifyChangeEmailOtp);
router.post("/profile/verify-email-otp", isLogin, verifyChangeEmailOtp);
router.post("/profile/resend-email-otp", isLogin, resendChangeEmailOtp);

router.get("/address", isLogin,loadAddressList)

router.get("/address/add", isLogin , loadAddAddress)
router.post("/address/add", isLogin, addAddress)

router.get("/address/edit/:id", isLogin, loadEditAddress)
router.patch("/address/edit/:id", isLogin, editAddress)

router.delete("/address/delete/:id", isLogin, deleteAddress)
router.patch("/address/default/:id", isLogin, setDefaultAddress)

router.get("/shop", loadShop)
router.get("/product/:id", loadProductDetail);

router.post("/cart", addToCart);
router.get("/cart", loadCart);
router.patch("/cart", updateCart);
router.delete(
    "/cart/remove/:productId/:variantId",
    removeFromCart
);
router.delete(
    "/cart/remove-item/:itemId",
    removeUnavailableCartItem
);

router.get("/wishlist", loadWishlist);
router.post("/wishlist/add/:productId/:variantId", addToWishlist);
router.delete(
    "/wishlist/remove/:productId/:variantId",
    removeFromWishlist
);
router.delete(
    "/wishlist/remove-item/:itemId",
    removeWishlistItem
);

router.get("/checkout", loadCheckout);

router.get("/checkout/address", isLogin, loadCheckoutAddresses);
router.post("/checkout/address/select", isLogin, selectCheckoutAddress);

//router.post("/checkout/place-order", placeOrder);

export default router;