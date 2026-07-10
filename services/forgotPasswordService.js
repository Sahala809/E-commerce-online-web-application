import bcrypt from "bcrypt";

import User from "../models/userModel.js";
import Otp from "../models/otpModel.js";

import { generateOtp } from "../utils/generateOtp.js";
import { sendOtp } from "../utils/sendOtp.js";

// Send Forgot Password OTP
export const sendForgotPasswordOtp = async (email) => {

    const user = await User.findOne({
        email: email.trim().toLowerCase()
    });

    if (!user) {
        throw new Error("No account found with this email.");
    }

    // Generate OTP
    const otp = generateOtp();

    // Hash OTP
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Delete old OTP if exists
    await Otp.deleteOne({ email });

    // Save new OTP
    await Otp.create({
        email,
        otp: hashedOtp,
        expiresAt: new Date(Date.now() +  30 * 1000)
    });

    // Send OTP email
    await sendOtp(email, otp);

    console.log("\n==========================");
    console.log("FORGOT PASSWORD OTP:", otp);
    console.log("==========================\n");

    return user;
};

export const verifyForgotPasswordOtpService = async (req, res) => {

        console.log("OTP Received:", req.body.otp);
        

        const { otp } = req.body;

        const email = req.session.resetEmail;

        if (!email) {
            return res.redirect("/forgot-password");
        }

        const otpData = await Otp.findOne({ email });

        if (!otpData) {

            return res.render("auth/verifyOtp", {
                error: "OTP not found.",
                action: "/forgot-password/verify-otp",
                resendAction: "/forgot-password/resend-otp",
                otpExpired: true
            });

        }

        console.log("Current Time :", new Date());
        console.log("OTP Expires  :", otpData.expiresAt);
        console.log("Expired?     :", otpData.expiresAt < new Date());

        if (otpData.expiresAt < new Date()) {

            await Otp.deleteOne({ email });

            return res.render("auth/verifyOtp", {
                error: "OTP has expired.",
                action: "/forgot-password/verify-otp",
                resendAction: "/forgot-password/resend-otp",
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
                action: "/forgot-password/verify-otp",
                resendAction: "/forgot-password/resend-otp",
                otpExpired: false
            });

        }

        // OTP verified
        await Otp.deleteOne({ email });

        return res.redirect("/reset-password");

    } 

// Reset Password Service
export const resetPasswordService = async (
    email,
    password,
    confirmPassword
) => {

    if (!email) {
        throw new Error("Session expired. Please try again.");
    }

    if (!password || !confirmPassword) {
        throw new Error("Please fill all fields.");
    }

    if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
    }

    const user = await User.findOne({ email });

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

export const resendForgotPasswordOtpService = async (email) => {

    if (!email) {
        throw new Error("Session expired. Please try again.");
    }

    // Check user exists
    const user = await User.findOne({
        email: email.trim().toLowerCase()
    });

    if (!user) {
        throw new Error("User not found.");
    }

    // Generate OTP
    const otp = generateOtp();

    // Hash OTP
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Delete previous OTP
    await Otp.deleteOne({ email });

    // Save new OTP
    await Otp.create({
        email,
        otp: hashedOtp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000)
    });

    // Send OTP
    await sendOtp(email, otp);

    console.log("\n==========================");
    console.log("RESEND OTP :", otp);
    console.log("==========================\n");
};