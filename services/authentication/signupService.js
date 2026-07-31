import bcrypt from "bcrypt";

import User from "../../models/userModel.js";

import { validateSignup } from "./validationService.js";
//import { checkUserExists } from "../userService.js";

import generateOtp from "../../utils/generateOtp.js";
import sendOtp from "../../utils/sendOtp.js";

export const signupService = async (req, res) => {

    const error = validateSignup(req.body);

    if (Object.keys(error).length > 0) {

        return res.render("user/auth/signup", {
            error,
            formData: req.body
        });

    }

    const {
        name,
        email,
        phone,
        password,
        referralCode
    } = req.body;

    const existingEmail = await User.findOne({
        email: email.trim().toLowerCase()
    });

    if (existingEmail) {
        return res.render("user/auth/signup", {
            error: {
                email: "Email already exists."
            },
            formData: req.body
        });
    }

    const existingPhone = await User.findOne({
        phone: phone.trim()
    });

    if (existingPhone) {
        return res.render("user/auth/signup", {
            error: {
                phone: "Phone number already exists."
            },
            formData: req.body
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = generateOtp();

    req.session.signupData = {
        name,
        email,
        phone,
        password: hashedPassword,
        referralCode
    };

    req.session.signupOtp = otp;
    req.session.signupOtpExpires = Date.now() + 60 * 1000;

    await req.session.save();

    await sendOtp(email, otp);

    console.log("\n==========================");

    console.log("EMAIL :", email);

    console.log("OTP   :", otp);

    console.log("==========================\n");

    return res.redirect("/user/verify-otp");
};

export const verifySignupOtpService = async (req,res) => {

    const { otp } = req.body;

    const signupData = req.session.signupData;
    const savedOtp = req.session.signupOtp;
    const expires = req.session.signupOtpExpires;

    console.log("Entered OTP :", otp);
    console.log("Saved OTP   :", savedOtp);
    console.log("Expires At  :", new Date(expires));
    console.log("Current Time:", new Date());

    if (!signupData) {
        return res.redirect("/user/signup");
    }

    if (!savedOtp) {
        return res.render("user/auth/verifyOtp", {

            error: "OTP not found.",
            otpExpired: true

        });
    }

    if (Date.now() > expires) {

        
        delete req.session.signupOtp;
        delete req.session.signupOtpExpires;

        await req.session.save();

        return res.render("user/auth/verifyOtp", {
            error: "OTP has expired.",
            otpExpired: true
        });
    }

    if (otp !== savedOtp) {
        return res.render("user/auth/verifyOtp", {
            error: "Invalid OTP.",
            otpExpired: false
        });

    }


    await User.create({
        name: signupData.name,
        email: signupData.email,
        phone: signupData.phone,
        password: signupData.password,
        referralCode: signupData.referralCode || "",
        isVerified: true
    });

    delete req.session.signupData;
    delete req.session.signupOtp;
    delete req.session.signupOtpExpires;
    
    await req.session.save();
    

    return res.redirect("/user/login");
};


export const resendSignupOtpService = async (req,res) => {

    const signupData = req.session.signupData;

    if (!signupData) {
        return res.redirect("/user/signup");
    }

    const otp = generateOtp();

    req.session.signupOtp = otp;
    req.session.signupOtpExpires = Date.now() + 60 * 1000;

    await req.session.save();

    await sendOtp(signupData.email, otp);

    console.log("\n==========================");
    console.log("SIGNUP RESEND OTP :", otp);
    console.log("==========================\n");

    return res.render("user/auth/verifyOtp",{
        error: null,
        otpExpired: false,
        
    })
};