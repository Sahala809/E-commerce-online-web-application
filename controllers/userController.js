import bcrypt from "bcrypt";

import User from "../models/userModel.js";
import Otp from "../models/otpModel.js";

import { validateSignup } from "../services/validationService.js";
import { checkUserExists } from "../services/userService.js";

import { generateOtp } from "../utils/generateOtp.js";
import { sendOtp } from "../utils/sendOtp.js"

import { validateLogin } from "../services/validationService.js";

import { 
    sendForgotPasswordOtp,
    verifyForgotPasswordOtpService,
    resendForgotPasswordOtpService,
    resetPasswordService
 } from "../services/forgotPasswordService.js";

//load home page

export const loadHome = (req, res) => {

    res.render("user/home", {
        user: req.session.user || null
    });

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

        // Validate form
        const error = validateSignup(req.body);

        if (error) {
            return res.render("auth/signup", {
                error,
                formData: req.body
            });
        }

        const { name, email, phone, password } = req.body;

        // Check existing user
        const exists = await checkUserExists(email, phone);

        if (exists) {
            return res.render("auth/signup", {
                error: exists,
                formData: req.body
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate OTP
        const otp = generateOtp();

        // Hash OTP
        const hashedOtp = await bcrypt.hash(otp, 10);

        // Delete previous OTP
        await Otp.deleteOne({ email });

        // Save OTP
        await Otp.create({
            email,
            otp: hashedOtp,
            expiresAt: new Date(Date.now() +  30 * 1000)
        });

        // Store user data in session
        req.session.signupData = {
            name,
            email,
            phone,
            password: hashedPassword
        };

        // Send OTP
        await sendOtp(email, otp);

        // Print OTP in terminal
        console.log("\n===============================");
        console.log("EMAIL :", email);
        console.log("OTP   :", otp);
        console.log("===============================\n");

        return res.redirect("/verify-otp");

    } catch (error) {

        console.log("SIGNUP ERROR:", error);

        return res.render("auth/signup", {
            error: "Something went wrong. Please try again.",
            formData: req.body
        });
    }
};

// Load OTP Page
export const loadVerifyOtp = (req, res) => {
    res.render("auth/verifyOtp", {
        error: null,
        action:"/verify-otp",
        resendAction: "/resend-otp"
    });
};

// Verify OTP
export const verifyOtp = async (req, res) => {

    try {

        const { otp } = req.body;

        const signupData = req.session.signupData;

        if (!signupData) {
            return res.redirect("/signup");
        }

        const otpData = await Otp.findOne({
            email: signupData.email
        });

        console.log("Current Time :", new Date());


        if (!otpData) {
            return res.render("auth/verifyOtp", {
                error: "OTP not found.",
                action: "/verify-otp",
                resendAction: "/resend-otp",
                otpExpired: false
            });
        }

        console.log("Current Time :", new Date());
        console.log("OTP Expires  :", otpData.expiresAt);
        console.log("Expired?     :", otpData.expiresAt < new Date());

        if (otpData.expiresAt < new Date()) {

            await Otp.deleteOne({
                email: signupData.email
            });

            return res.render("auth/verifyOtp", {
                error: "OTP expired.",
                action:"/verify-otp",
                resendAction: "/resend-otp",
                otpExpired: true
            });
        }

        const isMatch = await bcrypt.compare(
            otp.toString(),
            otpData.otp.toString()
        );

        console.log("OTP Match:", isMatch);
        
        if (!isMatch) {

            return res.render("auth/verifyOtp", {
                error: "Invalid OTP.",
                action: "/verify-otp",
                resendAction: "/resend-otp",
                otpExpired: false
            });
        }

        // Create User
        await User.create({
            name: signupData.name,
            email: signupData.email,
            phone: signupData.phone,
            password: signupData.password,
            isVerified: true
        });

        // Delete OTP
        await Otp.deleteOne({
            email: signupData.email
        });

        // Clear Session
        delete req.session.signupData;

        return res.redirect("/login");

    } catch (error) {

        console.log(error);

        return res.render("auth/verifyOtp", {
            error: "Something went wrong.",
            action: "/verify-otp",
            resendAction: "/resend-otp",
            otpExpired: true
        });
    }

};

// Resend OTP
export const resendOtp = async (req, res) => {

    try {

        const signupData = req.session.signupData;

        if (!signupData) {
            return res.redirect("/signup");
        }

        const email = signupData.email;

        const otp = generateOtp();

        const hashedOtp = await bcrypt.hash(otp, 10);

        await Otp.deleteOne({ email });

        await Otp.create({
            email,
            otp: hashedOtp,
            expiresAt: new Date(Date.now() +  30 * 1000)
        });

        await sendOtp(email, otp);

        console.log("\n======================");
        console.log("NEW OTP :", otp);
        console.log("======================\n");

        return res.redirect("/verify-otp");

    } catch (error) {

        console.log(error);

        return res.render("auth/verifyOtp", {
            error: "Unable to resend OTP."
        });
    }
};

export const loadLogin = (req, res) => {
    if (req.session.user) {
        return res.redirect("/");
    }

    res.render("auth/login");
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

