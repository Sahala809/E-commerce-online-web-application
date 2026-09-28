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
    getUserOrdersService,
    getOrderDetailsService,
    cancelOrderItemService,
    requestReturnService
} from "../services/orderManagement/orderService.js"

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

        return res.redirect("/user/home")

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
            search
            
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

        res.render("user/product/productDetail", {
            activePage:"shop",
            product: result.product,
            variants: result.variants || [],
            relatedProducts: result.relatedProducts || []
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

        res.render("user/cart/cart", {
            activePage: "cart",
            cart: result.cart,
            subtotal: result.subtotal,
            discount: result.discount,

            shippingCharge: result.shippingCharge,

            tax: result.tax,

            total: result.total
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

        return res.status(
            result.success ? 200 : 400
        ).json({
            success: result.success,
            message: result.message
        });

    } catch (error) {

        console.log(
            "REMOVE UNAVAILABLE CART ITEM ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Unable to remove item from cart."
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

        const result = await addToWishlistService(
            userId,
            productId,
            variantId
        );

        
        return res.status(200).json({
            success: result.success,
            message: result.message
        });
    } catch (error) {

        console.error("Add wishlist error:", error);

        return res.status(400).json({
            success: false,
            message:
                error.message ||
                "Unable to add product to wishlist."
        });
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
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }

        return res.status(200).json({
            success: true,
            message: result.message
        });

    } catch (error) {

        console.error("Remove wishlist error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to remove product from wishlist."
        });
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
            total: carResult.total,

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
            orderId
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