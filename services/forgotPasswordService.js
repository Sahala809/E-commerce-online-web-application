import bcrypt from "bcrypt";

import User from "../models/userModel.js";

import { generateOtp } from "../utils/generateOtp.js";
import { sendOtp } from "../utils/sendOtp.js";

// Send Forgot Password OTP
export const sendForgotPasswordOtp = async (req,email) => {

    const user = await User.findOne({
        email: email.trim().toLowerCase()
    });

    if (!user) {
        throw new Error("No account found with this email.");
    }

    // Generate OTP
    const otp = generateOtp();

    // Save in session
    req.session.resetEmail = email;
    req.session.resetOtp = otp;
    req.session.resetOtpExpires = Date.now() + 60 * 1000;

    // Save session
    await new Promise((resolve, reject) => {
        req.session.save((err) => {
            if (err) return reject(err);
            resolve();
        });
    });
    
    // Send OTP email
    await sendOtp(email, otp);

    console.log("\n==========================");
    console.log("FORGOT PASSWORD OTP:", otp);
    console.log("==========================\n");

    return user;
};

export const verifyForgotPasswordOtpService = async (req, res) => {
        
    const { otp } = req.body;

    const savedOtp = req.session.resetOtp;
    const expires = req.session.resetOtpExpires;
    const email = req.session.resetEmail;

    if (!email) {
        return res.redirect("/forgot-password");
    }

    if (!savedOtp) {

        return res.render("auth/verifyOtp", {
            error: "OTP not found.",
            action: "/forgot-password/verify-otp",
            resendAction: "/forgot-password/resend-otp",
            otpExpired: true
        });

    }

    console.log("Entered OTP:", otp);
    console.log("Saved OTP:", savedOtp);
    console.log("Current Time:", new Date().toLocaleString());
    console.log("Expires:", new Date(expires).toLocaleString());


    if (Date.now() > expires) {

        return res.render("auth/verifyOtp", {
            error: "OTP has expired.",
            action: "/forgot-password/verify-otp",
            resendAction: "/forgot-password/resend-otp",
            otpExpired: true
        });

    }

    if(otp !== savedOtp) {

        return res.render("auth/verifyOtp", {
            error: "Invalid OTP.",
            action: "/forgot-password/verify-otp",
            resendAction: "/forgot-password/resend-otp",
            otpExpired: false
        });

    }

    delete req.session.resetOtp;
    delete req.session.resetOtpExpires;

    return res.redirect("/reset-password");

} 

// Reset Password Service
export const resetPasswordService = async (
    email,
    password,
    confirmPassword
) => {

    console.log("Session Email:", email);
    console.log("Password:", password);
    console.log("Confirm Password:", confirmPassword);

    if (!email) {
        throw new Error("Session expired. Please try again.");
    }

    if (!password || !confirmPassword) {
        throw new Error("Please fill all fields.");
    }

    if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
    }

    const user = await User.findOne({
        email: email.trim().toLowerCase()
    } );

    console.log("User Found:", user);

    if (!user) {
        throw new Error("User not found.");
    }

    // Prevent using the old password again
    const isOldPassword = await bcrypt.compare(password, user.password);

    if (isOldPassword) {
        throw new Error("New password must be different from the previous password.");
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password
    user.password = hashedPassword;

    await user.save();

    return true;

};

export const resendForgotPasswordOtpService = async (req) => {
    
    const email = req.session.resetEmail;

    if (!email) {
        throw new Error("Session expired. Please try again.");
    }

    const user = await User.findOne({
        email: email.trim().toLowerCase()
    });

    if (!user) {
        throw new Error("User not found.");
    }

    // Generate OTP
    const otp = generateOtp();

    req.session.resetOtp = otp;
    req.session.resetOtpExpires = Date.now() + 60 * 1000; 

    // Save session before redirecting
    await new Promise((resolve, reject) => {
        req.session.save((err) => {
            if (err) return reject(err);
            resolve();
        });
    });

    // Send OTP
    await sendOtp(email, otp);

    console.log("\n==========================");
    console.log("RESEND OTP :", otp);
    console.log("==========================\n");

    return true;
};