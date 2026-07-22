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
    loadForgotPasswordVerifyOtp,
    verifyForgotPasswordOtp,
    resendForgotPasswordOtp,
    loadResetPassword,
    resetPassword
} from "../controllers/userController.js";

import { isLogin } from "../middleware/userAuth.js";
import { noCache } from "../middleware/noCache.js";

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

const router = express.Router();


router.get("/home", loadHome)
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


router.get("/signup", loadSignup);
router.post("/signup", signup);

router.get("/login" , loadLogin)
router.post("/login", login);

router.get("/logout",isLogin, logout)

router.get("/verify-otp", loadVerifyOtp);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);

router.get("/forgot-password", loadForgotPassword);
router.post("/forgot-password", forgotPassword);

router.get("/forgot-password/verify-otp", loadForgotPasswordVerifyOtp);
router.post("/forgot-password/verify-otp", verifyForgotPasswordOtp)
router.post("/forgot-password/resend-otp", resendForgotPasswordOtp)

router.get("/reset-password", loadResetPassword)
router.post("/reset-password", resetPassword)


router.get("/profile", isLogin, loadProfile);
router.post("/profile/edit", isLogin, editProfile);

router.get("/profile/edit-password", isLogin, loadChangePassword);
router.post("/profile/edit-password", isLogin, changePassword);

router.get("/profile/edit-email", isLogin, loadChangeEmail);
router.post("/profile/edit-email", isLogin, changeEmail);

router.get("/profile/verify-email-otp", isLogin, loadVerifyChangeEmailOtp);
router.post("/profile/verify-email-otp", isLogin, verifyChangeEmailOtp);
router.post("/profile/resend-email-otp", isLogin, resendChangeEmailOtp);



export default router;