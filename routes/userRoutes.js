import express from "express";
import passport from "passport";

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
    verifyForgotPasswordOtp,
    resendForgotPasswordOtp,
    loadResetPassword,
    resetPassword
} from "../controllers/userController.js";

import { isLogin } from "../middleware/userAuth.js";
import { noCache } from "../middleware/noCache.js";

import {
    loadMyProfile,
    updateProfile,
    loadChangePassword,
    changePassword,
    loadChangeEmail,
    sendChangeEmailOtp,
    loadVerifyChangeEmailOtp
} from "../controllers/userController.js";
const router = express.Router();


router.get("/home", isLogin, noCache, loadHome)
router.get("/", loadHome);

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



// Signup
router.get("/signup", loadSignup);
router.post("/signup", signup);




// OTP
router.get("/verify-otp", loadVerifyOtp);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);

// Forgot Password
router.get("/forgot-password", loadForgotPassword);
router.post("/forgot-password", forgotPassword);

router.post("/forgot-password/verify-otp", verifyForgotPasswordOtp)
router.post("/forgot-password/resend-otp", resendForgotPasswordOtp)

router.get("/reset-password", loadResetPassword)
router.post("/reset-password", resetPassword)

router.get("/login" , loadLogin)
router.post("/login", login);

// routes/userRoutes.js

router.get("/profile", isLogin, loadMyProfile);
router.post("/profile", isLogin, updateProfile);

router.get("/change-password", isLogin, loadChangePassword);
router.post("/change-password", isLogin, changePassword);

router.get("/profile/change-email", isLogin, loadChangeEmail);
router.post("/profile/change-email", isLogin, sendChangeEmailOtp);
router.get("/profile/verify-email", isLogin, loadVerifyChangeEmailOtp);
// router.post("/profile/verify-email", isLogin, verifyChangeEmailOtp);

router.get("/logout", logout)

export default router;