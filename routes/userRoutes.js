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

const router = express.Router();


router.get("/home", isLogin, loadHome)
router.get("/", isLogin, loadHome);

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



router.get("/logout", logout)

export default router;