import bcrypt from "bcrypt";
import crypto from "crypto";
import Razorpay from "razorpay";

import User from "../models/usermodel.js";
import Order from "../models/ordermodel.js";
import Address from "../models/addressModel.js";

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

import {
    loadShopService,
} from "../services/shop/shopService.js"

import {
    loadProductDetailService
} from "../services/shop/productDetailService.js"

import Variant from "../models/variantModel.js";

import {
    addToCartService,
    loadCartService,
    updateCartService,
    removeFromCartService,
    removeUnavailableCartItemService
} from "../services/cart/cartServices.js"

import {

    loadWishlistService,
    addToWishlistService,
    removeWishlistItemService,
    removeFromWishlistService

} from "../services/wishlist/wishlistService.js"


import {
    placeOrderService,
    verifyRazorpaySignature,
    getUserOrdersService,
    getOrderDetailsService,
    cancelOrderItemService,
    requestReturnService
} from "../services/orderManagement/orderService.js"

import {
    getAvailableCouponsService,
    validateCouponService
} from "../services/coupon/couponService.js";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

export const loadHome = (req, res) => {
    res.render("user/home", {
        user: req.session.user || null,
        activePage: "home",
        pageTitle: "Home"
    });
};



export const loadSignup = (req, res) => {
    
    if (req.session.user) {
        return res.redirect("/");
    }

    res.render("user/auth/signup",{
        formData:{},                 
        errors: {},
        errorMessage: null
    });
};


export const signup = async (req, res) => {

    try {

        const result = await signupService(req, res);

        if(!result.success){

            return res.render("user/auth/signup", {
                formData: req.body,
                errors: result.errors,
                errorMessage: null
            })
        }
        
        return res.redirect("/user/verify-otp")

    } catch (error) {

        console.log("SIGNUP ERROR: ",error);

        const errorMessage = "Something went wrong. Please try again."

        return res.render("user/auth/signup",{
        
            formData: req.body,
            errorMessage,
            errors: {}
        })
    }

};
export const loadVerifyOtp = (req, res) => {

    return res.render("user/auth/verifyOtp", {
        errorMessage: null,
        otpExpired: false,
        expiresAt: req.session.signupOtpExpires
    });
};

export const verifyOtp = async (req, res) => {

    try {

       const result = await verifySignupOtpService(req, res);

       const errorMessage = req.session.errorMessage || null
       delete req.session.errorMessage

       await req.session.save()

       if(!result.success){
        return res.render("user/auth/verifyOtp", {
            errorMessage,
            otpExpired: result.otpExpired || false,
            expiresAt: req.session.signupOtpExpires
        })
       }

       return res.redirect("/user/login")

    } catch (error) {
        console.error("VERIFY OTP ERROR:", error);

        const errorMessage = "Something went wrong. Please try again."
        return res.render("user/auth/verifyOtp", {
            errorMessage,
            otpExpired: false,
            expiresAt: req.session.signupOtpExpires
        });

    }

};

export const resendOtp = async (req, res) => {

    try {

        const result = await resendSignupOtpService(req, res);

        const errorMessage = req.session.errorMessage || null

        delete req.session.errorMessage

        await req.session.save()

        if(!result.success){
            return res.render("user/auth/verifyOtp", {
                errorMessage,
                otpExpired: false,
                expiresAt: req.session.signupOtpExpires
            })
        }

        return res.render("user/auth/verifyOtp", {
            errorMessage: null,
            otpExpired:false,
            expiresAt: req.session.signupOtpExpires
        })
    } catch (error) {

        console.log("RESEND OTP ERROR:", error);

        errorMessage = "Something went wrong. Please try again.";
        return res.render("user/auth/verifyOtp", {
            errorMessage,
            otpExpired: false,
            expiresAt: req.session.signupOtpExpires
        });

    }

};

export const loadLogin = async(req, res) => {
    if (req.session.user) {
        return res.redirect("/user/home");
    }

    const successMessage = req.session.successMessage || null;
    delete req.session.successMessage;

    await req.session.save()

    res.render("user/auth/login", {
        errorMessage: null,
        successMessage,
        formData: {},
        errors: {}
    });
};

export const login = async (req, res) => {

    try {

        const result = await loginService(req, res)

        if(!result.success){
            const errorMessage = req.session.errorMessage || null

            delete req.session.errorMessage

            await req.session.save()

            return res.render("user/auth/login", {
                errors:result.errors,
                errorMessage,
                successMessage: null,
                formData: req.body
            })
        }

        return res.redirect(303, "/user/home")

    } catch (error) {

        console.log("LOGIN ERROR", error);

        return res.render("user/auth/login", {
            error: {},
            errorMessage: "Something went wrong. Please try again.",
            successMessage: null,
            formData: req.body
        });
    }

};

export const logout = (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);

        req.session.destroy((err) => {
            if (err) return next(err);

            res.clearCookie("connect.sid");
            res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");

            return res.redirect(303, "/user/home");
        });
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
                successMessage: "",
                errorMessage: "Your account has been blocked.",
                formData: {},
                errors: {}
            });
        }

        req.session.user = user._id;
        await req.session.save();

        return res.redirect("/user/home");

    } catch (err) {
        console.log("GOOGLE LOGIN ERROR:", err);

        return res.render("user/auth/login", {
            successMessage: "",
            errorMessage: "Google login failed. Please try again.",
            formData: {},
            errors: {}
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
        otpExpired: false,
        expiresAt:req.session.resetOtpExpires 
    });

};

export const verifyForgotPasswordOtp = async (req, res) => {

    try {

        await verifyForgotPasswordOtpService(req, res);


    } catch (err) {

        console.log("VERIFY FORGOT PASSWORD OTP ERROR:",err);

        res.render("user/auth/verifyOtpForgotPassword", {
            error: "Something went wrong. Please try again",
            otpExpired: false,
            expiresAt:
                    req.session.resetOtpExpires || 0
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
            otpExpired: false,
            expiresAt:
                    req.session.resetOtpExpires || 0
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


////// shop ///////



export const loadShop = async (req,res) => {
    try {
        const search = req.query.search?.trim() || "";

        const selectedCategories = req.query.category
    ? Array.isArray(req.query.category)
        ? req.query.category
        : [req.query.category]
    : [];

const selectedColors = req.query.color
    ? Array.isArray(req.query.color)
        ? req.query.color
        : [req.query.color]
    : [];

const maxPrice = Number(req.query.maxPrice) || 50000;

const queryParams = {
    ...req.query
};

delete queryParams.page;

        //console.log("FILTERS:", req.query);
        const result = await loadShopService(req.query)

        const successMessage = req.session.successMessage;
        const errorMessage = req.session.errorMessage;

        req.session.successMessage = null;
        req.session.errorMessage = null;

        res.render("user/product/shop", {
            activePage:"shop",
            products: result.products,
            categories: result.categories,
            colors: result.colors,

            selectedCategories,
            selectedColors,
            maxPrice,

            sort: req.query.sort || "",
            
            totalPages: result.totalPages,
            currentPage:result.currentPage,
            totalProducts: result.totalProducts,
            successMessage,
            errorMessage,
            search,
            queryParams
            
        })
    } catch (error) {
        console.log("LOAD SHOP ERROR", error);
        
        req.session.errorMessage = "Something went wrong";

        return res.redirect("/user/home");
    }

}



export const loadProductDetail = async (req, res) => {
    try {

        const productId = req.params.id

        const result = await loadProductDetailService(productId)

        
        if(!result || !result.product){
            req.session.errorMessage = "Product not found";
            return res.redirect("/user/shop")
        }

        const successMessage = req.session.successMessage;
        const errorMessage = req.session.errorMessage;

        delete req.session.successMessage;
        delete req.session.errorMessage;

        res.render("user/product/productDetail", {
            activePage:"shop",
            product: result.product,
            variants: result.variants || [],
            relatedProducts: result.relatedProducts || [],
            successMessage,
            errorMessage
        })
    } catch (error) {

        console.log("LOAD PRODUCT DETAIL ERROR:", error);

        req.session.errorMessage = "Something went wrong";

        return res.redirect("/user/shop");
        
    }
};

export const addToCart = async (req, res) => {
    try {
console.log("SESSION:", req.session);
        const { productId, variantId, quantity } = req.body;

        const userId = req.session.user;

        // User not logged in
        if (!userId) {
            req.session.errorMessage = "Please login to add products to cart";

            return res.redirect("/user/login");
        }


        const result = await addToCartService(
            userId,
            productId,
            variantId,
            quantity
        );

        if (!result.success) {
            req.session.errorMessage = result.message;
            return res.redirect(`/user/product/${productId}`);
        }

        req.session.successMessage = result.message;
console.log("REDIRECTING TO CART");
        return res.redirect(`/user/cart`);

    } catch (error) {

        console.log("ADD TO CART ERROR:", error);

        req.session.errorMessage = "Something went wrong";

        return res.redirect(`/user/product/${req.body.productId}`);
    }
};


export const loadCart = async (req, res) => {
    try {
 
        const userId = req.session.user;

        const result = await loadCartService(userId);

        const successMessage = req.session.successMessage;
        const errorMessage = req.session.errorMessage;

        // Clear messages after reading them
        delete req.session.successMessage;
        delete req.session.errorMessage;

        res.render("user/cart/cart", {
            activePage: "cart",
            cart: result.cart,
            subtotal: result.subtotal,
            discount: result.discount,

            shippingCharge: result.shippingCharge,

            tax: result.tax,

            total: result.total,

            successMessage,
            errorMessage
        });

    } catch (error) {

        console.log("LOAD CART ERROR:", error);

        req.session.errorMessage = "Something went wrong";

        return res.redirect("/user/shop");
    }
};


export const updateCart = async (req, res) => {
    try {

        const userId = req.session.user;

        const { variantId, quantity } = req.body;

        const result = await updateCartService(
            userId,
            variantId,
            quantity
        );

        return res.json(result);

    } catch (error) {

        console.log("UPDATE CART ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        });
    }
};



export const removeFromCart = async (req, res) => {
    try {

        const userId = req.session.user;

        const { productId, variantId } = req.params;

        const result = await removeFromCartService( 
            userId, 
            productId, 
            variantId 
        );

       if (!result.success) {
         req.session.errorMessage = result.message; 
         
         return res.redirect("/user/cart"); 
        
        }
        
        req.session.successMessage = result.message; 
        
        return res.redirect("/user/cart");

    } catch (error) {

        console.log("REMOVE CART ERROR:", error);

         req.session.errorMessage =
            error.message || "Unable to remove item from cart.";

        return res.redirect("/user/cart");
    }
};

export const removeUnavailableCartItem = async (req, res) => {
    try {

        const userId = req.session.user;

        const { itemId } = req.params;

        const result =
            await removeUnavailableCartItemService(
                userId,
                itemId
            );

        if (!result.success) { 
            return res.render("user/cart", { 
                message: result.message, 
                messageType: "error" 
            }); 
        } 
        return res.redirect(301, "/user/cart");

    } catch (error) {

        console.log(
            "REMOVE UNAVAILABLE CART ITEM ERROR:",
            error
        );

        return res.render("user/cart", { 
                message: "Unable to remove this item from your cart.", 
                messageType: "error" 
            }); 
        }
    
};

    ///// wishlist //////

export const loadWishlist = async (req, res) => {
    try {

        const userId = req.session.user;

        const wishlist = await loadWishlistService(userId);

        res.render("user/wishlist/wishlist", {
            wishlist
        });

    } catch (error) {

        console.error("Load wishlist error:", error);

        req.session.errorMessage = "Unable to load wishlist.";
        res.redirect("/user/shop");
    }
};


export const addToWishlist = async (req, res) => {
    try {

        const userId = req.session.user;

        const { productId, variantId } = req.params;

        console.log("User ID:", userId);
        console.log("Product ID:", productId);
        console.log("Variant ID:", variantId);


        const result = await addToWishlistService(
            userId,
            productId,
            variantId
        );


        if (!result.success) {

            req.session.errorMessage = result.message;

            return res.redirect("/user/shop");
        }


        req.session.successMessage = result.message;

        return res.redirect("/user/shop");

    } catch (error) {

        console.error(
            "Add wishlist error:",
            error
        );

        req.session.errorMessage =
            error.message ||
            "Unable to add product to wishlist.";

        return res.redirect("/user/shop");
    }
};

export const removeFromWishlist = async (req, res) => {
    try {

        const userId = req.session.user;

        const { productId, variantId } = req.params;

        const result = await removeFromWishlistService(
            userId,
            productId,
            variantId
        );

        if (!result.success) {
             req.session.errorMessage =
                result.message;

            return res.redirect("/user/wishlist");
        }

         req.session.successMessage =
            result.message;

        return res.redirect("/user/wishlist");

    } catch (error) {

        console.error("Remove wishlist error:", error);

        req.session.errorMessage =
            "Unable to remove product from wishlist.";


        return res.redirect("/user/wishlist");
    }
};

export const removeWishlistItem = async (req, res) => {
    try {

        const userId = req.session.user;
        const { itemId } = req.params;

        const result = await removeWishlistItemService(
            userId,
            itemId
        );

        if (!result.success) {
            req.session.errorMessage = result.message;
            return res.redirect("/user/wishlist");
        }

        req.session.successMessage = "Item removed from wishlist.";

        return res.redirect("/user/wishlist");


    } catch (error) {

        console.error("Remove wishlist item error:", error);

        req.session.errorMessage =
            error.message || "Unable to remove wishlist item.";

        res.redirect("/user/wishlist");
    }
};


export const loadCheckout = async (req, res) => {
    try {

        const userId = req.session.user;

        if (!userId) {

            req.session.errorMessage = "Please login to continue";

            return res.redirect("/user/login");
        }

        const carResult = await loadCartService(userId);

        const appliedCoupon = req.session.appliedCoupon || null;

const couponDiscount = appliedCoupon
    ? Number(appliedCoupon.couponDiscount) || 0
    : 0;

const finalTotal = Math.max(
    0,
    carResult.total - couponDiscount
);

        if (
            !carResult.cart ||
            !carResult.cart.items ||
            carResult.cart.items.length === 0
        ) {
            req.session.errorMessage = "Your cart is empty";
            return res.redirect("/user/cart");
        }

        const userAddresses = await Address.findOne({ userId });

        let selectedAddress = null;

        if (
            userAddresses && 
            userAddresses.addresses &&
            userAddresses.addresses.length > 0) {

            if (req.session.checkoutAddressId) {

                selectedAddress = userAddresses.addresses.find(
                    address =>
                        address._id.toString() ===
                        req.session.checkoutAddressId.toString()
                );

            }

            
            if (!selectedAddress) {
                selectedAddress = userAddresses.addresses.find(
                    address => address.isDefault === true
                );    
            }

            if (!selectedAddress) {

                selectedAddress = userAddresses.addresses[0];

            }
        }

        res.render("user/checkout/checkout",{
            cart: carResult.cart,

            subtotal: carResult.subtotal,
            discount: carResult.discount,
            shippingCharge: carResult.shippingCharge,
            tax: carResult.tax,
            total: finalTotal,
            appliedCoupon,
            couponDiscount,

            successMessage: req.session.successMessage,
errorMessage: req.session.errorMessage,
            userAddresses:userAddresses
                ? userAddresses.addresses
                : [],
            
            selectedAddress,

            activePage: "checkout"
        });

    } catch (error) {

        console.log("LOAD CHECKOUT ERROR:", error);

         req.session.errorMessage = "Something went wrong";
         
        return res.redirect("/user/cart");
    }
};


export const loadCheckoutAddresses = async (req, res) => {
    try {

        const userAddresses = await Address.findOne({
            userId: req.session.user
        });

        return res.render("user/checkout/selectAddress", {

            userAddresses: userAddresses
                ? userAddresses.addresses
                : [],

            selectedAddressId:
                req.session.checkoutAddressId || null,

            activePage: "checkout"
        });

    } catch (error) {

        console.log("LOAD CHECKOUT ADDRESSES ERROR:", error);

        return res.redirect("/user/checkout");
    }
};


export const selectCheckoutAddress = async (req, res) => {
    try {
        const userId = req.session.user;
        const { addressId } = req.body;

        console.log("USER ID:", userId);
        console.log("SELECTED ADDRESS ID:", addressId);

        const userAddresses = await Address.findOne({
            userId
        });

        if (!userAddresses) {
            console.log("NO USER ADDRESSES FOUND");
            return res.redirect("/user/checkout/address");
        }

        const selectedAddress = userAddresses.addresses.id(addressId);

        console.log("SELECTED ADDRESS:", selectedAddress);

        if (!selectedAddress) {
            console.log("INVALID ADDRESS ID");
            return res.redirect("/user/checkout/address");
        }

        req.session.checkoutAddressId = addressId;

        console.log(
            "SESSION CHECKOUT ADDRESS ID:",
            req.session.checkoutAddressId
        );

        return res.redirect("/user/checkout");

    } catch (error) {
        console.log("SELECT CHECKOUT ADDRESS ERROR:", error);

        return res.redirect("/user/checkout/address");
    }
};




export const placeOrder = async (req, res) => {

    console.log("================================");
    console.log("PLACE ORDER CONTROLLER REACHED");
    console.log("User:", req.session.user);
    console.log("Body:", req.body);
    console.log("Address:", req.session.checkoutAddressId);
    console.log("================================");

    try {

        const userId = req.session.user;

        // Check login
        if (!userId) {

            req.session.errorMessage =
                "Please login to continue";

            return res.redirect("/user/login");
        }


        // Get selected checkout address
        const addressId =
            req.body.addressId;
        if (!addressId) {

            req.session.errorMessage =
                "Please select a delivery address";

            return res.redirect("/user/checkout");
        }


        // Payment method
        const paymentMethod =
            req.body.paymentMethod || "COD";

        console.log("Payment:", paymentMethod);

        // Place order
        const result = await placeOrderService(
            userId,
            addressId,
            paymentMethod
        );

        console.log("SERVICE RESULT:", result);


        // If order failed
        if (!result.success) {

            req.session.errorMessage =
                result.message;

            return res.redirect("/user/checkout");
        }


        // Save order ID
        req.session.orderId =
            result.orderId;


        // Remove checkout address from session
        delete req.session.checkoutAddressId;

        console.log("ORDER SUCCESS");
        console.log("ORDER ID:", result.orderId);


        // Go to success page
        return res.redirect("/user/order-success");


    } catch (error) {

        console.error(
            "Place Order Controller Error:",
            error
        );

        req.session.errorMessage =
            "Something went wrong while placing the order";

        return res.redirect("/user/checkout");
    }
};



export const createRazorpayOrder = async (req, res) => {
    try {
        const userId = req.session.user;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Please login to continue"
            });
        }

        const addressId = req.body.addressId;

        if (!addressId) {
            return res.status(400).json({
                success: false,
                message: "Please select a delivery address"
            });
        }

        // Load the current cart
        const cartResult = await loadCartService(userId);

        if (
            !cartResult.cart ||
            !cartResult.cart.items ||
            cartResult.cart.items.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Your cart is empty"
            });
        }

        // Check unavailable items
        const unavailableItem = cartResult.cart.items.find(
            item =>
                !item.productId ||
                !item.variantId ||
                item.isOutOfStock ||
                !item.productId.isActive ||
                !item.variantId.isActive
        );

        if (unavailableItem) {
            return res.status(400).json({
                success: false,
                message: "Some cart items are unavailable. Please update your cart."
            });
        }

        // Validate the selected address belongs to this user
        const userAddresses = await Address.findOne({ userId });

        const selectedAddress = userAddresses?.addresses?.find(
            address => address._id.toString() === addressId.toString()
        );

        if (!selectedAddress) {
            return res.status(400).json({
                success: false,
                message: "Please select a valid delivery address"
            });
        }

        // Apply the same coupon discount as checkout
        const appliedCoupon = req.session.appliedCoupon || null;

        const couponDiscount = appliedCoupon
            ? Number(appliedCoupon.couponDiscount) || 0
            : 0;

        const finalTotal = Math.max(
            0,
            cartResult.total - couponDiscount
        );

        if (!Number.isFinite(finalTotal) || finalTotal <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment amount"
            });
        }

        // Create Razorpay payment order only
        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(finalTotal * 100),
            currency: "INR",
            receipt: `checkout_${Date.now()}`
        });

        // Keep the payment order associated with this session
        req.session.razorpayOrderId = razorpayOrder.id;
        req.session.razorpayAddressId = addressId;
        req.session.razorpayAmount = Math.round(finalTotal * 100);
        req.session.razorpayDiscount = couponDiscount;

        return res.json({
            success: true,
            key: process.env.RAZORPAY_KEY_ID,
            orderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency
        });

    } catch (error) {
        console.error("Create Razorpay Order Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to start online payment"
        });
    }

};



export const verifyRazorpayPayment = async (req, res) => {
    try {
        const userId = req.session.user;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Please login to continue."
            });
        }

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            addressId
        } = req.body;

        // Confirm this payment belongs to this checkout session
        if (
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature ||
            razorpay_order_id !== req.session.razorpayOrderId ||
            addressId !== String(req.session.razorpayAddressId)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment details."
            });
        }

        // Verify Razorpay signature
        const signatureValid = verifyRazorpaySignature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        );

        if (!signatureValid) {
            return res.status(400).json({
                success: false,
                message: "Payment signature verification failed."
            });
        }

        // Prevent reusing a payment that already has an order
        const existingOrder = await Order.findOne({
            razorpayPaymentId: razorpay_payment_id
        });

        if (existingOrder) {
            if (existingOrder.userId.toString() === userId.toString()) {
                req.session.orderId = existingOrder._id;

                return res.json({
                    success: true,
                    message: "This payment has already been processed."
                });
            }

            return res.status(409).json({
                success: false,
                message: "This payment has already been used."
            });
        }


        // Verify actual payment status with Razorpay
        const payment = await razorpay.payments.fetch(
            razorpay_payment_id
        );

        if (
            payment.order_id !== req.session.razorpayOrderId ||
            payment.status !== "captured" ||
            payment.amount !== req.session.razorpayAmount ||
            payment.currency !== "INR"
        ) {
            return res.status(400).json({
                success: false,
                message: "Payment is not confirmed. Please contact support if money was deducted."
            });
        }

        // Recalculate the cart amount before creating the order
        const cartResult = await loadCartService(userId);

        if (
            !cartResult.cart ||
            !cartResult.cart.items ||
            cartResult.cart.items.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Your cart is empty."
            });
        }

        const unavailableItem = cartResult.cart.items.find(
            item =>
                !item.productId ||
                !item.variantId ||
                item.isOutOfStock ||
                !item.productId.isActive ||
                !item.variantId.isActive
        );

        if (unavailableItem) {
            return res.status(400).json({
                success: false,
                message: "Some cart items are unavailable. Please contact support before trying payment again."
            });
        }

        const discountAmount = Math.max(
            0,
            Number(req.session.razorpayDiscount) || 0
        );

        const currentTotal = Math.max(
            0,
            cartResult.total - discountAmount
        );

        if (
            Math.round(currentTotal * 100) !==
            req.session.razorpayAmount
        ) {
            return res.status(400).json({
                success: false,
                message: "Your cart total has changed. Please contact support before making another payment."
            });
        }

        // Create the Chronix order only after verified payment
        const result = await placeOrderService(
            userId,
            addressId,
            "ONLINE",
            {
                isPaid: true,
                discountAmount,
                razorpayPaymentId: razorpay_payment_id
            }
        );

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }

        req.session.orderId = result.orderId;

        delete req.session.checkoutAddressId;
        delete req.session.razorpayOrderId;
        delete req.session.razorpayAddressId;
        delete req.session.razorpayAmount;
        delete req.session.razorpayDiscount;
        delete req.session.appliedCoupon;

        return res.json({
            success: true,
            message: "Payment successful and order placed."
        });

    } catch (error) {
        console.error("Razorpay Verification Error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to confirm payment. If money was deducted, please contact support before retrying."
        });
    }
};




export const loadOrderSuccess = async (req, res) => {
    try {

        const userId = req.session.user;
        const orderId = req.session.orderId;

        // User must be logged in
        if (!userId) {
            return res.redirect("/user/login");
        }

        // Order ID should exist in session
        if (!orderId) {
            return res.redirect("/user/orders");
        }

        return res.render("user/orders/orderSuccess", {
            pageTitle: "Order Placed Successfully",
            orderId,
            paymentMethod: order.paymentMethod
        });

    } catch (error) {

        console.error("Load Order Success Error:", error);

        return res.redirect("/user/shop");
    }
};





export const loadOrders = async (req, res) => {
    try {
        const userId = req.session.user;

        if (!userId) {
            req.session.errorMessage = "Please login to continue";
            return res.redirect("/user/login");
        }

        const result = await getUserOrdersService(userId);

        if (!result.success) {
            req.session.errorMessage = result.message;
            return res.redirect("/user/shop");
        }

        return res.render("user/orders/viewOrders", {
            pageTitle: "My Orders",
            orders: result.orders
        });

    } catch (error) {
        console.error("Load Orders Error:", error);

        req.session.errorMessage = "Something went wrong while loading orders";
        return res.redirect("/user/shop");
    }
};


export const loadOrderDetails = async (req, res) => {
    try {

        const userId = req.session.user;
        const orderId = req.params.orderId;

        if (!userId) {
            req.session.errorMessage = "Please login to continue";
            return res.redirect("/user/login");
        }

        const result = await getOrderDetailsService(
            userId,
            orderId
        );

        if (!result.success) {
            req.session.errorMessage = result.message;
            return res.redirect("/user/orders");
        }

        return res.render("user/orders/orderDetails", {
            pageTitle: "Order Details",
            order: result.order
        });

    } catch (error) {

        console.error("Load Order Details Error:", error);

        req.session.errorMessage =
            "Something went wrong while loading order details";

        return res.redirect("/user/orders");
    }
};

export const cancelOrderItem = async (req, res) => {
    try {

        const userId = req.session.user;
        const orderId = req.params.orderId;
        const itemId = req.params.itemId;


        // Check login
        if (!userId) {
            req.session.errorMessage = "Please login to continue";
            return res.redirect("/user/login");
        }


        // Cancel item
        const result = await cancelOrderItemService(
            userId,
            orderId,
            itemId
        );


        // If cancellation failed
        if (!result.success) {
            req.session.errorMessage = result.message;

            return res.redirect(
                `/user/orders/${orderId}`
            );
        }


        // Success
        req.session.successMessage = result.message;

        return res.redirect(
            `/user/orders/${orderId}`
        );

    } catch (error) {

        console.error(
            "Cancel Order Item Controller Error:",
            error
        );

        req.session.errorMessage =
            "Something went wrong while cancelling the item";

        return res.redirect(
            `/user/orders/${req.params.orderId}`
        );
    }
};

export const requestReturn = async (req, res) => {
    try {
        const userId = req.session.user;

        const { orderId, orderItemId } = req.params;

        const {
            returnReason,
            returnDetails
        } = req.body;

        if (!userId) {
            req.session.errorMessage =
                "Please login to continue";

            return res.redirect("/user/login");
        }

        const result = await requestReturnService(
            orderId,
            orderItemId,
            userId,
            returnReason,
            returnDetails
        );

        if (!result.success) {
            req.session.errorMessage = result.message;

            return res.redirect(
                `/user/orders/${orderId}`
            );
        }

        req.session.successMessage = result.message;

        return res.redirect(
            `/user/orders/${orderId}`
        );

    } catch (error) {
        console.log(
            "REQUEST RETURN CONTROLLER ERROR:",
            error
        );

        req.session.errorMessage =
            "Something went wrong while submitting return request";

        return res.redirect(
            `/user/orders/${req.params.orderId}`
        );
    }
};



export const loadMyCoupons = async (req, res) => {
    try {
        const userId = req.session.user;

        if (!userId) {
            req.session.errorMessage = "Please login to continue";
            return res.redirect("/user/login");
        }

        const result = await getAvailableCouponsService(userId);

        res.render("user/coupon/myCoupons", {
            activePage: "coupons",
            coupons: result.coupons || []
        });
    } catch (error) {
        console.log("LOAD MY COUPONS ERROR:", error);
        req.session.errorMessage = "Unable to load coupons";
        return res.redirect("/user/shop");
    }
};



export const applyCoupon = async (req, res) => {
    try {
        const userId = req.session.user;

        if (!userId) {
            req.session.errorMessage = "Please login to continue";
            return res.redirect("/user/login");
        }

        const { couponCode } = req.body;

        if (!couponCode || !couponCode.trim()) {
            req.session.errorMessage = "Please enter a coupon code";
            req.session.couponSuccess = false;
            return res.redirect("/user/checkout");
        }

        const cartResult = await loadCartService(userId);

        if (
            !cartResult.cart ||
            !cartResult.cart.items ||
            cartResult.cart.items.length === 0
        ) {
            req.session.errorMessage = "Your cart is empty";
            req.session.couponSuccess = false;
            return res.redirect("/user/cart");
        }

        
const eligibleSubtotal = cartResult.cart.items.reduce((sum, item) => {
    const variant = item.variantId;

    if (!variant || !item.productId) {
        return sum;
    }

    const hasOffer =
        variant.offerPrice &&
        variant.offerPrice > 0 &&
        variant.offerPrice < variant.price;

    if (hasOffer) {
        return sum;
    }

    return sum + (variant.price * item.quantity);
}, 0);


if (eligibleSubtotal <= 0) {
    req.session.errorMessage =
        "Coupon cannot be applied to products with offers";
    req.session.couponSuccess = false;
    return res.redirect("/user/checkout");
}



        const result = await validateCouponService(
            couponCode.trim(),
            userId,
            eligibleSubtotal
        );

        if (!result.success) {
            req.session.errorMessage =
                result.message || "Unable to apply coupon";
            req.session.couponSuccess = false;
            return res.redirect("/user/checkout");
        }

        req.session.appliedCoupon = {
            couponId: result.coupon._id,
            couponCode: result.coupon.couponCode,
            couponDiscount: result.couponDiscount
        };

        req.session.successMessage =
            result.message || "Coupon applied successfully";
        req.session.couponSuccess = true;

        return res.redirect("/user/checkout");

    } catch (error) {
        console.log("APPLY COUPON ERROR:", error);
        req.session.errorMessage = "Unable to apply coupon";
        req.session.couponSuccess = false;
        return res.redirect("/user/checkout");
    }
};


export const removeCoupon = async (req, res) => {
    try {
        delete req.session.appliedCoupon;

        req.session.successMessage = "Coupon removed successfully";
        req.session.couponSuccess = false;

        return res.redirect("/user/checkout");
    } catch (error) {
        console.log("REMOVE COUPON ERROR:", error);

        req.session.errorMessage = "Unable to remove coupon";
        return res.redirect("/user/checkout");
    }
};


