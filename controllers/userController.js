import bcrypt from "bcrypt";

import User from "../models/userModel.js";
import Otp from "../models/otpModel.js";

import { validateSignup } from "../services/validationService.js";
import { checkUserExists } from "../services/userService.js";

import { generateOtp } from "../utils/generateOtp.js";
import { sendOtp } from "../utils/sendOtp.js"

import { signupService } from "../services/signupService.js"
import { verifySignupOtpService } from "../services/signupService.js";
import { resendSignupOtpService } from "../services/signupService.js";

import { validateLogin } from "../services/validationService.js";

import { 
    sendForgotPasswordOtp,
    verifyForgotPasswordOtpService,
    resendForgotPasswordOtpService,
    resetPasswordService
 } from "../services/forgotPasswordService.js";

//load home page

export const loadHome = (req, res) => {

     if (!req.session.user) {
        return res.redirect("/login");
    }

    res.render("user/home");

};

// Load Signup Page
export const loadSignup = (req, res) => {
    res.render("auth/signup", {
        error: null,
        formData: {}
    });
};

// Signup
export const signup = async (req, res) => {

    try {

        await signupService(req, res);

    } catch (error) {

        console.log(error);

        return res.render("auth/signup", {
            error: "Something went wrong. Please try again.",
            formData: req.body
        });

    }

};

// Load OTP Page
export const loadVerifyOtp = (req, res) => {
console.log("Load Verify OTP Session:", req.session.signupData);

    res.render("auth/verifyOtp", {
        error: null,
        action:"/verify-otp",
        resendAction: "/resend-otp",
         otpExpired: false
    });
};

// Verify OTP
export const verifyOtp = async (req, res) => {

    try {

        await verifySignupOtpService(req, res);

    } catch (error) {

        return res.render("auth/verifyOtp", {
            error: error.message,
            action: "/verify-otp",
            resendAction: "/resend-otp",
            otpExpired: false
        });

    }

};

// Resend OTP
export const resendOtp = async (req, res) => {

    try {

        await resendSignupOtpService(req, res);

    } catch (error) {

        console.log(error);

        return res.render("auth/verifyOtp", {
            error: error.message,
            action: "/verify-otp",
            resendAction: "/resend-otp",
            otpExpired: false
        });

    }

};

export const loadLogin = (req, res) => {
    if (req.session.user) {
        return res.redirect("/");
    }

    res.render("auth/login", {
        error: null,
        formData: {}
    });
};

export const login = async (req, res) => {

    try {

        const { email, password } = req.body;

        // Check all fields
        const error = validateLogin(req.body);

        if (error) {
            return res.render("auth/login", {
                error,
                formData: req.body
            });
        }

        // Find user
        const user = await User.findOne({ 
            email:email.trim().toLowerCase()
         });

         console.log(user);

        if (!user) {

            return res.render("auth/login", {
                error: "Invalid email or password."
            });
        }

        // Check if blocked
        if (user.isBlocked) {

            return res.render("auth/login", {
                error: "Your account has been blocked."
            });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {

            return res.render("auth/login", {
                error: "Invalid email or password."
            });
        }

        // Create session
        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email
        };

        return res.redirect("/");

    } catch (error) {

        console.log(error);

        return res.render("auth/login", {
            error: "Something went wrong."
        });
    }

};

export const logout = (req, res) => {

    req.session.destroy((err) => {

        if (err) {
            console.log(err);
            return res.redirect("/");
        }

        res.clearCookie("connect.sid");

        res.redirect("/login");

    });

};


export const googleCallback = async (req, res) => {

    try {

        const user = req.user;

        if (!user) {
            return res.redirect("/login");
        }

        // Check if the user is blocked
        if (user.isBlocked) {
            return res.render("auth/login", {
                error: "Your account has been blocked."
            });
        }

        // Create session
        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email
        };

        return res.redirect("/");

    } catch (error) {

        console.log("GOOGLE LOGIN ERROR:", error);

        return res.render("auth/login", {
            error: "Google login failed. Please try again."
        });

    }

};

// Load Reset Password Page
export const loadResetPassword = (req, res) => {

    // If user didn't verify OTP, don't allow access
    if (!req.session.resetEmail) {
        return res.redirect("/forgot-password");
    }

    res.render("auth/resetPassword", {
        error: null,
        formData: {}
    });

};

export const loadForgotPassword = (req, res) => {

    if (req.session.user) {
        return res.redirect("/");
    }

    res.render("auth/forgotPassword", {
        error: null,
        formData: {}
    });

};

export const forgotPassword = async (req, res) => {

    try {

        const { email } = req.body;

        await sendForgotPasswordOtp(email);

        req.session.resetEmail = email;

        console.log("Saved Session Email:", req.session.resetEmail);

        return res.render("auth/verifyOtp", {
            error: null,
            action: "/forgot-password/verify-otp",
            resendAction: "/forgot-password/resend-otp"
        });

    } catch (error) {

        console.log(error);

        return res.render("auth/forgotPassword", {
            error: error.message,
            formData: req.body
        });

    }

};

export const verifyForgotPasswordOtp = async (req, res) => {

    try {

        return await verifyForgotPasswordOtpService(req, res);


    } catch (error) {

        console.log(error);

        res.render("auth/verifyOtp", {
            error: "Something went wrong",
            action: "/forgot-password/verify-otp",
            resendAction: "/forgot-password/resend-otp",
            otpExpired: false
        });

    }

};

export const resendForgotPasswordOtp = async (req, res) => {

    try {

        await resendForgotPasswordOtpService(req.session.resetEmail);

        return res.render("auth/verifyOtp", {
            error: null,
            action: "/forgot-password/verify-otp",
            resendAction: "/forgot-password/resend-otp",
            otpExpired: false
        });

    } catch (error) {

        console.log(error);

        return res.render("auth/verifyOtp", {
            error: error.message,
            action: "/forgot-password/verify-otp",
            resendAction: "/forgot-password/resend-otp",
            otpExpired: true
        });

    }

};

export const resetPassword = async (req, res) => {

    try {

        await resetPasswordService(
            req.session.resetEmail,
            req.body.password,
            req.body.confirmPassword
        );

        delete req.session.resetEmail;

        delete req.session.user;

        res.redirect("/login");

    } catch (error) {

        res.render("auth/resetPassword", {
            error: error.message,
            formData: {}
        });

    }

};

