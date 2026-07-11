import bcrypt from "bcrypt";

import User from "../models/userModel.js";

import { validateSignup } from "./validationService.js";
import { checkUserExists } from "./userService.js";

import { generateOtp } from "../utils/generateOtp.js";
import { sendOtp } from "../utils/sendOtp.js";

export const signupService = async (req, res) => {

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


    // stor user data in session
    req.session.signupData = {
        name,
        email,
        phone,
        password: hashedPassword
    };

    // store OTP in session
    req.session.signupOtp = otp;
    req.session.signupOtpExpires = Date.now() + 30 * 1000;

     // Save session
    await new Promise((resolve, reject) => {
        req.session.save((err) => {
            if (err) return reject(err);
            resolve();
        });
    });


    // Send OTP
    await sendOtp(email, otp);

    console.log("\n==========================");
    console.log("EMAIL :", email);
    console.log("OTP   :", otp);
    console.log("==========================\n");

    return res.redirect("/verify-otp");
};

export const verifySignupOtpService = async (req,res) => {

    const { otp } = req.body;

    const signupData = req.session.signupData;
    const savedOtp = req.session.signupOtp;
    const expires = req.session.signupOtpExpires;

    if (!signupData) {
         return res.redirect("/signup");
    }

    if (!savedOtp) {
        return res.render("auth/verifyOtp", {
            error: "OTP not found.",
            action: "/verify-otp",
            resendAction: "/resend-otp",
            otpExpired: true
        });
    }
    

    if (Date.now() > new Date()) {

        return res.render("auth/verifyOtp", {
            error: "OTP has expired.",
            action: "/verify-otp",
            resendAction: "/resend-otp",
            otpExpired: true
        });
    }

    if (otp !== saveOtp) {
        return res.render("auth/verifyOtp", {
            error: "Invalid OTP.",
            action: "/verify-otp",
            resendAction: "/resend-otp",
            otpExpired: false
        });
    }

    const existingUser = await User.findOne({
        email: signupData.email
    });

    if (existingUser) {
        return res.render("auth/signup", {
            error: "Email already exists."
        });
    }

    await User.create({
        name: signupData.name,
        email: signupData.email,
        phone: signupData.phone,
        password: signupData.password,
        isVerified: true
    });

    delete req.session.signupData;
    delete req.session.signupOtp;
    delete req.session.signupOtpExpires;
    

    return res.redirect("/login")
};


export const resendSignupOtpService = async (req,res) => {

    const signupData = req.session.signupData;

    if (!signupData) {
        return res.redirect("/signup");
    }

    const otp = generateOtp();

    req.session.signupOtp = otp;
    req.session.signupOtpExpires = Date.now() + 30 * 1000;

    await new Promise((resolve, reject) => {
        req.session.save((err) => {
            if (err) return reject(err);
            resolve();
        });
    });

    await sendOtp(email, otp);

    console.log("\n==========================");
    console.log("SIGNUP RESEND OTP :", otp);
    console.log("==========================\n");

    return res.redirect("/verify-otp")
};