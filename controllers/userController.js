import bcrypt from "bcrypt";

import User from "../models/userModel.js";

//import { checkUserExists } from "../services/userService.js";

import generateOtp from "../utils/generateOtp.js";
import sendOtp from "../utils/sendOtp.js"

import { 
    signupService,
    verifySignupOtpService,
    resendSignupOtpService
} from "../services/authentication/signupService.js"

import { loginService } from "../services/authentication/loginService.js";

import { 
    forgotPasswordService,
    verifyForgotPasswordOtpService,
    resendForgotPasswordOtpService,
    resetPasswordService
 } from "../services/authentication/forgotPasswordService.js";

// import {
//     getMyProfile,
//     updateMyProfile
// } from "../services/profile/profileService.js";

// import { changePasswordService } from "../services/profile/changePasswordService.js";

// import { 
//     changeEmailOtpService,
//     verifyChangeEmailOtpService
// } from "../services/profile/changeEmailOtpService.js";
//import { error } from "console";
//load home page

export const loadHome = (req, res) => {

res.render("user/home", {
        user: req.session.user || null
    });

};

export const loadSignup = (req, res) => {
    if (req.session.user) {
        return res.redirect("/");
    }

    res.render("user/auth/signup",{
        formData:{},                 
        error: {}
    });
};


export const signup = async (req, res) => {

    try {

         await signupService(req, res);

    } catch (err) {

        console.log("SIGNUP ERROR: ",err);

        return res.render("user/auth/signup",{
            
            error: {
                general: "Something went wrong. Please try again."
            },
            formData: req.body
        })
    }

};
export const loadVerifyOtp = (req, res) => {

    return res.render("user/auth/verifyOtp", {
        error: null,
        otpExpired: false
    });
};

export const verifyOtp = async (req, res) => {

    try {

        await verifySignupOtpService(req, res);

    } catch (err) {
        console.error("VERIFY OTP ERROR:", err);

        return res.render("user/auth/verifyOtp", {
            error: "Something went wrong. Please try again.",
            otpExpired: false
        });

    }

};

export const resendOtp = async (req, res) => {

    try {

        await resendSignupOtpService(req, res);

    } catch (err) {

        console.log(err);

        return res.render("user/auth/verifyOtp", {
            error: "Something went wrong. Please try again.",
            otpExpired: true
        });

    }

};

export const loadLogin = (req, res) => {
    if (req.session.user) {
        return res.redirect("/");
    }

    res.render("user/auth/login", {
        error: null,
        formData: {}
    });
};

export const login = async (req, res) => {

    try {

        await loginService(req, res)

    } catch (err) {

        console.log(err);

        return res.render("user/auth/login", {
            error: {
                general: "Something went wrong."
            },
            formData: req.body
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
            return res.redirect("/user/login");
        }

        if (user.isBlocked) {
            return res.render("user/auth/login", {
                error: "Your account has been blocked."
            });
        }

        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email
        };

        return res.redirect("/");

    } catch (err) {

        console.log("GOOGLE LOGIN ERROR:", err);

        return res.render("user/auth/login", {
            error: {
                general: "Google login failed. Please try again."
            }
        });

    }

};


export const loadForgotPassword = (req, res) => {
    if(req.session.user){
        return res.redirect("/");
    }

    return res.render("user/auth/forgotPassword", {
        error: {},
        formData : {}
    });
};


export const forgotPassword = async (req, res) => {

    try {
    
        await forgotPasswordService(req, res)

    } catch (err) {

        console.log("FORGOT PASSWORD ERROR:",err);

        return res.render("user/auth/forgotPassword", {
            error: {
                general: "Something went wrong. Please try again."
            },
            formData: req.body
        });

    }

};

export const loadForgotPasswordVerifyOtp = (req, res) => {

    if (!req.session.resetEmail) {
        return res.redirect("/user/forgot-password");
    }

    return res.render("user/auth/verifyOtpForgotPassword", {
        error: null,
        otpExpired: false
    });

};

export const verifyForgotPasswordOtp = async (req, res) => {

    try {

        await verifyForgotPasswordOtpService(req, res);


    } catch (err) {

        console.log("VERIFY FORGOT PASSWORD OTP ERROR:",err);

        res.render("user/auth/verifyOtpForgotPassword", {
            error: "Something went wrong. Please try again",
            otpExpired: false
        });

    }

};

export const resendForgotPasswordOtp = async (req, res) => {

    try {

        await resendForgotPasswordOtpService(req,res);

    } catch (err) {

        console.log("RESEND FORGOT PASSWORD OTP ERROR:", err);

        return res.render("user/auth/verifyOtpForgotPassword", {
            error: "Something went wrong. Please try again",
            otpExpired: true
        });

    }

};

export const loadResetPassword = (req, res) => {

    if (!req.session.resetEmail) {
        return res.redirect("/user/forgot-password");
    }

    res.render("user/auth/resetPassword", {
        error: {},
        formData: {}
    });

};

export const resetPassword = async (req, res) => {

    try {
        await resetPasswordService(req, res)

    } catch (err) {

        console.log("RESET PASSWORD ERROR:", err);

        return res.render("user/auth/resetPassword", {
            error: {
                general: "Something went wrong. Please try again."
            },
            formData: {}
        });

    }

};


// controllers/profileController.js

export const loadProfile = async (req, res) => {
    try {

        const user = await User.findById(req.session.user.user);

        res.render("user/profile/myProfile", {
            user
        });

    } catch (err) {
        console.log("LOAD PROFILE ERROR:", err);
        return res.redirect("/user/home");
    }
};

export const updateProfile = async (req, res) => {
    try {

        await updateMyProfile(req.session.user.id, req.body);

        req.session.success = "Profile updated successfully.";

        res.redirect("/profile");

    } catch (error) {

        const user = await getMyProfile(req.session.user.id);
        user.name = req.body.name;
        user.phone = req.body.phone;
        res.render("user/profile/myProfile", {
            user,
            error: error.message,
            success:null,
            activePage: "profile"
        });
    }
};

export const loadChangePassword = async (req, res) => {
    console.log("Load Change Password");
    try {

        const user = await User.findById(req.session.user.id);
        console.log(user);

        res.render("user/profile/changePassword", {
            user,
            error: null,
            success: null,
            activePage: "password"
        });

    } catch (error) {

        console.log(error);

        res.redirect("/profile");

    }

};

export const changePassword = async (req, res) => {

    try {

        await changePasswordService(
            req.session.user.id,
            req.body.currentPassword,
            req.body.newPassword,
            req.body.confirmPassword
        );

        req.session.success = "Password changed successfully.";

        return res.redirect("/profile");

    } catch (error) {

        const user = await User.findById(req.session.user.id);

        return res.render("user/profile/changePassword", {
            user,
            error: error.message,
            success: null,
            activePage: "password"
        });

    }

};



// export const loadChangeEmail = async (req, res) => {

//     try {

//         const user = await User.findById(req.session.user.id);

//         res.render("user/profile/changeEmail", {
//             user,
//             error: null,
//             success: null,
//             activePage: "profile"
//         });

//     } catch (error) {

//         console.log(error);

//         res.redirect("/profile");

//     }

// };

// export const loadVerifyChangeEmailOtp = async (req, res) => {
//     try {
//         res.render("user/profile/verifyChangeEmailOtp");
//     } catch (error) {
//         console.log(error);
//     }
// };

// export const sendChangeEmailOtp = async (req, res) => {

//     try {

//         const newEmail = req.body.email;

//         const otp = await changeEmailOtpService(newEmail);

//         // Store temporarily in session
//         req.session.changeEmail = {

//             email: newEmail,
//             otp: otp

//         };

//         res.redirect("/profile/verify-email");

//     } catch (error) {

//         const user = await User.findById(req.session.user.id);

//         res.render("user/profile/changeEmail", {
//             user,
//             error: error.message,
//             success: null,
//             activePage: "profile"
//         });

//     }

// };