import bcrypt from "bcrypt";

import User from "../../models/userModel.js";

import generateOtp from "../../utils/generateOtp.js";
import sendOtp from "../../utils/sendOtp.js";
import { 
    validateForgotPassword,
    validateResetPassword
} from "./validationService.js";

export const forgotPasswordService = async (req, res) => {

    const error = validateForgotPassword(req.body);

    if (Object.keys(error).length > 0) {

        return res.render("user/auth/forgotPassword", {
            error,
            formData: req.body
        });

    }

    const { email } = req.body;

    const user = await User.findOne({
        email: email.trim().toLowerCase()
    });

    if (!user) {

        return res.render("user/auth/forgotPassword", {
            error: {
                email: "No account found with this email."
            },
            formData: req.body
        });

    }

    const otp = generateOtp();

    req.session.resetEmail = user.email;
    req.session.resetOtp = otp;
    req.session.resetOtpExpires = Date.now() + 60 * 1000;

    await req.session.save();

    await sendOtp(user.email, otp);

    console.log("\n==========================");
    console.log("FORGOT PASSWORD OTP:", otp);
    console.log("==========================\n");

    return res.redirect("/user/forgot-password/verify-otp");

};

export const verifyForgotPasswordOtpService = async (req, res) => {
        
    const { otp } = req.body;

    const savedOtp = req.session.resetOtp;
    const expires = req.session.resetOtpExpires;
    const email = req.session.resetEmail;


    console.log("Entered OTP :", otp);
    console.log("Saved OTP   :", savedOtp);

    if (!email) {
        return res.redirect("/user/forgot-password");
    }

    if (!savedOtp) {

        return res.render("user/auth/verifyOtpForgotPassword", {
            error: "OTP not found.",
            otpExpired: true
        });

    }

    if (Date.now() > expires) {

        delete req.session.resetOtp;
        delete req.session.resetOtpExpires;

        await req.session.save();
        
        return res.render("user/auth/verifyOtpForgotPassword", {
            error: "OTP has expired.",
            otpExpired: true
        });

    }

    if(otp !== savedOtp) {

        return res.render("user/auth/verifyOtpForgotPassword", {
            error: "Invalid OTP.",
            otpExpired: false
        });

    }

    delete req.session.resetOtp;
    delete req.session.resetOtpExpires;

    await req.session.save();

    return res.redirect("/user/reset-password");

} 

export const resendForgotPasswordOtpService = async (req, res) => {

    const email = req.session.resetEmail;

    if (!email) {
        return res.redirect("/user/forgot-password");
    }

    const user = await User.findOne({
        email: email.trim().toLowerCase()
    });

    if (!user) {
        return res.render("user/auth/forgotPassword", {
            error: {
                email: "No account found with this email."
            },
            formData: {}
        });

    }

    const otp = generateOtp();

    req.session.resetOtp = otp;
    req.session.resetOtpExpires = Date.now() + 60 * 1000;

    await req.session.save();


    await sendOtp(user.email, otp);

    console.log("\n==========================");
    console.log("FORGOT PASSWORD RESEND OTP:", otp);
    console.log("==========================\n");

    return res.render("user/auth/verifyOtpForgotPassword", {
        error: null,
        otpExpired: false
    });
};

export const resetPasswordService = async (req, res) => {
    
    const error = validateResetPassword(req.body);

    if (Object.keys(error).length > 0) {

        return res.render("user/auth/resetPassword", {
            error,
            formData: req.body
        });

    }

    const { password } = req.body;
    const email = req.session.resetEmail;

    if (!email) {
        return redirect("/user/forgot-password")
    }

    const user = await User.findOne({
        email: email.trim().toLowerCase()
    });

    if (!user) {

        return res.redirect("/user/forgot-password")

    }

    const isOldPassword = await bcrypt.compare(password, user.password);

    if (isOldPassword) {
        return res.render("user/auth/resetPassword", {
            error: {
                password: "New password cannot be the same as the old password."
            },
            formData: {}
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;

    await user.save();

    delete req.session.resetEmail;
    await req.session.save();

    req.session.successMessage = "Password reset successfully. Please log in with your new password.";
    return res.redirect("/user/login");

};

