import User from "../../models/userModel.js";
import generateOtp from "../../utils/generateOtp.js";
import sendOtp from "../../utils/sendOtp.js";

import { validateChangeEmail } from "./validationService.js";


export const changeEmailService = async (req, res) => {

    const error = validateChangeEmail(req);

    if (Object.keys(error).length > 0) {

        const user = await User.findById(req.session.user);

        return res.render("user/profile/changeEmail", {
            user,
            error,
            success: null,
            formData: req.body,
            activePage: "changeEmail"
        });

    }

    const { email } = req.body;

    const user = await User.findById(req.session.user);

    // Check if the new email is the same as the current email
    if (user.email === email.trim().toLowerCase()) {

        return res.render("user/profile/changeEmail", {
            user,
            error: {
                email: "Please enter a different email address."
            },
            success: null,
            formData: req.body,
            activePage: "changeEmail"
        });

    }

    // Check if the email is already registered
    const existingUser = await User.findOne({
        email: email.trim().toLowerCase()
    });

    if (existingUser) {

        return res.render("user/profile/changeEmail", {
            user,
            error: {
                email: "Email already exists."
            },
            success: null,
            formData: req.body,
            activePage: "changeEmail"
        });

    }

    const otp = generateOtp()

    console.log("\n==========================");

    console.log("EMAIL :", email);

    console.log("OTP   :", otp);

    console.log("==========================\n");

    await sendOtp(email, otp);

    // Store data in session
    req.session.changeEmailOtp = otp;
    req.session.changeEmail = email.trim().toLowerCase();
    req.session.changeEmailOtpExpires = Date.now() +  60 * 1000;

    await req.session.save();

    // Redirect to OTP page
    return res.redirect("/user/profile/verify-email-otp");

};


export const verifyChangeEmailOtpService = async (req, res) => {

    const { otp } = req.body;

    const expires = req.session.changeEmailOtpExpires;
    const savedOtp = req.session.changeEmailOtp;

    // Check if OTP exists
    if (!savedOtp) {

        return res.render("user/profile/verifyChangeEmailOtp", {
            error: "OTP not found. Please request a new OTP.",
            success: null,
            formData: req.body
        });

    }

    // Check expiry
    if (Date.now() > expires) {

        delete req.session.changeEmailOtp;
        delete req.session.changeEmailOtpExpires;

        return res.render("user/profile/verifyChangeEmailOtp", {
            error: "OTP has expired.",
            success: null,
            formData: req.body,
            otpExpired: true
        });

    }

    // Verify OTP
    if (otp !== savedOtp) {

        return res.render("user/profile/verifyChangeEmailOtp", {
            error:"Invalid OTP.",
    
            success: null,
            formData: req.body,
            otpExpired:false
        });

    }

    // Update email
    const user = await User.findById(req.session.user);

    user.email = req.session.changeEmail;

    await user.save();

    // Clear session
    delete req.session.changeEmailOtp;
    delete req.session.changeEmail;
    delete req.session.changeEmailOtpExpires;

    req.session.success = "Email updated successfully.";

    return res.redirect("/user/profile");

};


export const resendChangeEmailOtpService = async (req, res) => {

    const email = req.session.changeEmail;

    if (!email) {

        return res.redirect("/user/profile/edit-email");

    }

    // Generate new OTP
    const otp = generateOtp();

    // Send OTP
    await sendOtp(email, otp);

    // Update session
    req.session.changeEmailOtp = otp;
    req.session.changeEmailOtpExpires = Date.now() + 60 * 1000;

    console.log("\n==========================");
    console.log("SIGNUP RESEND OTP :", otp);
    console.log("==========================\n");

     req.session.save(() => {

        return res.render("user/profile/verifyChangeEmailOtp", {
            success: "A new OTP has been sent to your email.",
            error: null,
            formData: {},
            otpExpired: false
        });

    });
};