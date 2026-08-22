import bcrypt from "bcrypt";

import User from "../../models/userModel.js";

import { validateSignup } from "./validationService.js";
//import { checkUserExists } from "../userService.js";

import generateOtp from "../../utils/generateOtp.js";
import sendOtp from "../../utils/sendOtp.js";

export const signupService = async (req, res) => {

    const errors = validateSignup(req.body);

    if (Object.keys(errors).length > 0) {

        return {
            success:false,
            errors,
            formData: req.body
        }
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
    }).lean();

    if (existingEmail) {
        
        errors.email = "Email already exists."

        return {
            success: false,
            errors,
            formData: req.body
        }
    }

    const existingPhone = await User.findOne({
        phone: phone.trim()
    }).lean();

    if (existingPhone) {

        errors.phone = "Phone number already exists."
        return {
            success: false,
            errors,
            formData:req.body
        }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = generateOtp();

    req.session.signupData = {
        name,
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
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

    return {
        success: true
    }
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

        req.session.errorMessage = "Signup session expired. Please sign up again."

        return {
            success:false
        }
        
    }


    if (!savedOtp) {
        req.session.errorMessage =   "OTP not found."

        return {
            success: false
        } 
    }

    if (Date.now() > expires) {

        req.session.errorMessage =  "OTP has expired."

        delete req.session.signupOtp;
        delete req.session.signupOtpExpires;
        
        await req.session.save();

        return {
            success: false,
            otpExpired: true
        }
    }

    if (otp !== savedOtp) {

        req.session.errorMessage ="OTP does not match."
        return {
            success: false,
            otpExpired: false
        }

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
    
    req.session.successMessage = "Account created successfully.";

    await req.session.save();

    return {
        success:true
    }
};


export const resendSignupOtpService = async (req,res) => {

    const signupData = req.session.signupData;

    if (!signupData) {
        
        req.session.errorMessage = "Signup session expired. Please sign up again."

        return {
            success:false
        }
    }

    const otp = generateOtp();

    req.session.signupOtp = otp;
    req.session.signupOtpExpires = Date.now() + 60 * 1000;

    await req.session.save();

    await sendOtp(signupData.email, otp);

    console.log("\n==========================");
    console.log("SIGNUP RESEND OTP :", otp);
    console.log("==========================\n");

    return {
        success: true
    }
}