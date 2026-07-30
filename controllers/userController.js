import bcrypt from "bcrypt";

import User from "../models/userModel.js";
import Address from "../models/addressModel.js";

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

import { editProfileService } from "../services/profile/profileService.js";

import { changePasswordService } from "../services/profile/changePasswordService.js";

import { 
    changeEmailService,
    verifyChangeEmailOtpService,
    resendChangeEmailOtpService
} from "../services/profile/changeEmailOtpService.js";

import { 
    addAddressService,
    editAddressService,
    deleteAddressService,
    setDefaultAddressService
} from "../services/address/addressService.js";

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
        return res.redirect("/user/home");
    }

    const successMessage = req.session.successMessage;
    delete req.session.successMessage;

    res.render("user/auth/login", {
        error: null,
        success:{
            general:successMessage
        },
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

    delete req.session.user;

    req.logout(function (err) {
        if (err) {
            return next(err);
        }

    res.redirect("/user/login");
    })
    
};


export const googleCallback = async (req, res) => {

    try {

        const user = req.user;

        if (!user) {
            return res.redirect("/user/login");
        }

        if (user.isBlocked) {
            return res.render("user/auth/login", {
                error: {
                general: "Your account has been blocked."
                }
            });
        }

        req.session.user = user._id;
        await req.session.save();

        return res.redirect("/user/home");

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


/////// user ///////

export const loadProfile = async (req, res) => {
    try {

        const user = await User.findById(req.session.user);
        const success = req.session.success;
        delete req.session.success;
        
        res.render("user/profile/myProfile", {
            user,
            formData: user,
            activePage: "profile",
            success,
            error: null
        });

    } catch (err) {
        console.log("LOAD PROFILE ERROR:", err);
        return res.redirect("/user/home");
    }
};

export const editProfile = async (req, res) => {
    try {

        await editProfileService(req, res);

    } catch (err) {

        console.error("EDIT PROFILE ERROR:", err);

        const user = await User.findById(req.session.user);

        return res.render("user/profile/myProfile", {
            user,
            formData: req.body,
            activePage: "profile",
            success:null,
            error: {
                general: "Something went wrong. Please try again."
            }
        });
    }
};

export const loadChangePassword = async (req, res) => {
    
    return res.render("user/profile/changePassword",{
        error: {},
        success: null,
        formData:{},
        activePage:"changePassword"
    })
};

export const changePassword = async (req, res) => {

    try {

        await changePasswordService(req, res);

    } catch (err) {

        console.log("CHANGE PASSWORD ERROR:", err);

        return res.render("user/profile/changePassword", {
            error: {
                general: "Something went wrong. Please try again."
            },
            success: null,
            formData:req.body,
            activePage: "changePassword"
        });

    }

};


export const loadChangeEmail = async (req, res) => {

    try {

        const user = await User.findById(req.session.user);

        res.render("user/profile/changeEmail", {
            user,
            error: {},
            success: null,
            formData: {},
            activePage: "changeEmail"
        });

    } catch (err) {

        console.log("LOAD CHANGE EMAIL ERROR:", err);

        return res.redirect("/user/profile");

    }

};


export const changeEmail = async (req, res) => {

    try {

        await changeEmailService(req, res);

    } catch (err) {

        console.log("CHANGE EMAIL ERROR:", err);

        const user = await User.findById(req.session.user);

        return res.render("user/profile/changeEmail", {
            user,
            error: {
                general: "Something went wrong. Please try again."
            },
            success: null,
            formData: req.body,
            activePage: "changeEmail"
        });

    }

};


export const loadVerifyChangeEmailOtp = async(req, res) => {

    const user = await User.findById(req.session.user);

    res.render("user/profile/verifyChangeEmailOtp", {
        user,
        error: null,
        success: null,
        formData: {},
        activePage: "changeEmail"
    });

}


export const verifyChangeEmailOtp = async (req, res) => {

    try {

        await verifyChangeEmailOtpService(req, res);

    } catch (err) {

        console.log("VERIFY CHANGE EMAIL OTP ERROR:", err);

        return res.render("user/profile/verifyChangeEmailOtp", {
            error: {
                general: "Something went wrong. Please try again."
            },
            success: null,
            formData: req.body
        });

    }

};

export const resendChangeEmailOtp = async (req, res) => {

    try {

        await resendChangeEmailOtpService(req, res);

    } catch (err) {

        console.log("RESEND CHANGE EMAIL OTP ERROR:", err);

        return res.render("user/profile/verifyChangeEmailOtp", {
            error: {
                general: "Unable to resend OTP. Please try again."
            },
            success: null,
            formData: {}
        });

    }

};


export const loadAddressList = async (req, res) => {

    try {

        const userAddresses = await Address.findOne({
                userId: req.session.user
            });

            console.log(userAddresses);

            return res.render("user/address/addressList", {
                userAddresses,
                activePage: "address"
            });

        
    } catch (err) {

        console.log("LOAD ADDRESS LIST ERROR:", err);

        return res.redirect("/");

    }

};

export const loadAddAddress = async (req, res) => {

    try {

        const success = req.session.success || null;
        delete req.session.success;

        return res.render("user/address/addAddress", {
        error: {},
        success,
        formData: {},
        activePage: "address"
    });


    } catch (err) {

        console.log("LOAD ADD ADDRESS ERROR:", err);

        return res.redirect("/user/address");

    }

};

export const addAddress = async (req, res) => {

    try {

        await addAddressService(req, res);

    } catch (err) {

        console.log("ADD ADDRESS ERROR:", err);

        return res.redirect("/user/address/add");

    }

};

export const loadEditAddress = async (req, res) => {

    try {

        const { id } = req.params;

        const userAddresses = await Address.findOne({
            userId: req.session.user
        });

        if (!userAddresses) {

            return res.redirect("/user/address");

        }

        const address = userAddresses.addresses.id(id);

        if (!address) {

            return res.redirect("/user/address");

        }

        return res.render("user/address/editAddress", {
            address,
            formData: req.body,
            error: {},
            activePage: "address"
        });


    } catch (err) {

        console.log("LOAD EDIT ADDRESS ERROR:", err);

        return res.redirect("/user/address");

    }

};

export const editAddress = async (req, res) => {

    try {

        await editAddressService(req, res);

    } catch (err) {

        console.log("EDIT ADDRESS ERROR:", err);

        return res.redirect("/user/address");

    }

};

export const deleteAddress = async (req, res) => {

    try {

        await deleteAddressService(req, res);

    } catch (err) {

        console.log("DELETE ADDRESS ERROR:", err);

        return res.redirect("/user/address");

    }

};

export const setDefaultAddress = async (req, res) => {

    try {

        await setDefaultAddressService(req, res);

    } catch (err) {

        console.log("SET DEFAULT ADDRESS ERROR:", err);

        return res.redirect("/user/address");

    }

};