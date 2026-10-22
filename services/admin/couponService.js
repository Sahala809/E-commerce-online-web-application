
import Coupon from "../../models/couponModel.js";
import { validateCoupon } from "./validationService.js";

// CREATE COUPON
export const createCouponService = async (couponData) => {
    try {
        const {
            couponCode,
            discount,
            couponType,
            maxDiscountAmount,
            expDate,
            minimumPurchase,
            usageLimit,
            perUserUsageLimit,
            isPublic,
            userId,
            applicableCategories,
            applicableProducts
        } = couponData;

        // Validate all coupon fields
        const validation = validateCoupon(couponData);

        if (!validation.isValid) {
            return {
                success: false,
                message: "Please correct the highlighted fields",
                errors: validation.errors
            };
        }

        // Prepare validated values
        const normalizedCode = couponCode.trim().toUpperCase();
        const discountValue = Number(discount);

        const maxDiscountValue =
            maxDiscountAmount === "" ||
            maxDiscountAmount === undefined ||
            maxDiscountAmount === null
                ? null
                : Number(maxDiscountAmount);

        const expiryDate = new Date(expDate);
        const minimumValue = Number(minimumPurchase ?? 0);
        const totalLimit = Number(usageLimit);
        const userLimit = Number(perUserUsageLimit);

        // Check duplicate coupon code
        const existingCoupon = await Coupon.findOne({
            couponCode: normalizedCode
        });

        if (existingCoupon) {
            return {
                success: false,
                message: "Please correct the highlighted fields",
                errors: {
                    couponCode: "Coupon code already exists"
                }
            };
        }

        // Create coupon
        const coupon = new Coupon({
            couponCode: normalizedCode,
            discount: discountValue,
            couponType,
            maxDiscountAmount: maxDiscountValue,
            expDate: expiryDate,
            minimumPurchase: minimumValue,
            usageLimit: totalLimit,
            perUserUsageLimit: userLimit,
            usedCount: 0,
            isPublic: isPublic === true || isPublic === "true",
            userId: userId || null,
            applicableCategories: applicableCategories || [],
            applicableProducts: applicableProducts || []
        });

        await coupon.save();

        return {
            success: true,
            message: "Coupon created successfully"
        };

    } catch (error) {
        console.log("CREATE COUPON SERVICE ERROR:", error);

        if (error.code === 11000) {
            return {
                success: false,
                message: "Please correct the highlighted fields",
                errors: {
                    couponCode: "Coupon code already exists"
                }
            };
        }

        if (
            error.name === "ValidationError" ||
            error.name === "CastError"
        ) {
            return {
                success: false,
                message: "Invalid coupon details"
            };
        }

        return {
            success: false,
            message: "Failed to create coupon"
        };
    }
};



export const getCouponsService = async (
    search = "", 
    page = 1,
    couponType = ""
) => {
    try {
        const limit = 5;
        const currentPage = Math.max(1, parseInt(page, 10) || 1);

        const filter = {};

        if (search.trim()) {
            const escapedSearch = search
                .trim()
                .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

            filter.couponCode = {
                $regex: escapedSearch,
                $options: "i"
            };
        }


        if (["FIXED", "PERCENTAGE"].includes(couponType)) {
            filter.couponType = couponType;
        }

        const totalCoupons = await Coupon.countDocuments(filter);

        const coupons = await Coupon.find(filter)
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * limit)
            .limit(limit);

        const activeCoupons = await Coupon.countDocuments({
            isActive: true
        });

        const expiredCoupons = await Coupon.countDocuments({
            expDate: { $lte: new Date() }
        });



        return {
            success: true,
            coupons,
            totalCoupons,
            activeCoupons,
            expiredCoupons,
            currentPage,
            totalPages: Math.ceil(totalCoupons / limit),
            search,
            couponType
        };
        
    } catch (error) {
        console.log("GET COUPONS SERVICE ERROR:", error);

        return {
            success: false,
            message: "Failed to load coupons"
        };
    }
};


export const editCouponService = async (couponId, couponData) => {
    try {
        const {
            couponCode,
            discount,
            couponType,
            maxDiscountAmount,
            expDate,
            minimumPurchase,
            usageLimit,
            perUserUsageLimit,
            isPublic,
            isActive
        } = couponData;

        // Find existing coupon
        const coupon = await Coupon.findById(couponId);

        if (!coupon) {
            return {
                success: false,
                message: "Coupon not found"
            };
        }

        // Validate all coupon fields
        const validation = validateCoupon(couponData);

        if (!validation.isValid) {
            return {
                success: false,
                message: "Please correct the highlighted fields",
                errors: validation.errors
            };
        }

        // Prepare validated values
        const normalizedCode = couponCode.trim().toUpperCase();
        const discountValue = Number(discount);

        const maxDiscountValue =
            maxDiscountAmount === "" ||
            maxDiscountAmount === undefined ||
            maxDiscountAmount === null
                ? null
                : Number(maxDiscountAmount);

        const expiryDate = new Date(expDate);
        const minimumValue = Number(minimumPurchase ?? 0);
        const totalLimit = Number(usageLimit);
        const userLimit = Number(perUserUsageLimit);

        // Do not reduce usage limit below current usage
        if (totalLimit < coupon.usedCount) {
            return {
                success: false,
                message: "Please correct the highlighted fields",
                errors: {
                    usageLimit:
                        `Usage limit cannot be less than the current usage (${coupon.usedCount})`
                }
            };
        }

        // Check duplicate coupon code, excluding current coupon
        const existingCoupon = await Coupon.findOne({
            couponCode: normalizedCode,
            _id: { $ne: couponId }
        });

        if (existingCoupon) {
            return {
                success: false,
                message: "Please correct the highlighted fields",
                errors: {
                    couponCode: "Coupon code already exists"
                }
            };
        }

        // Update coupon fields
        coupon.couponCode = normalizedCode;
        coupon.discount = discountValue;
        coupon.couponType = couponType;
        coupon.maxDiscountAmount = maxDiscountValue;
        coupon.expDate = expiryDate;
        coupon.minimumPurchase = minimumValue;
        coupon.usageLimit = totalLimit;
        coupon.perUserUsageLimit = userLimit;
        coupon.isPublic = isPublic === "true";
        coupon.isActive = isActive === "true";

        await coupon.save();

        return {
            success: true,
            message: "Coupon updated successfully"
        };

    } catch (error) {
        console.log("EDIT COUPON SERVICE ERROR:", error);

        if (error.code === 11000) {
            return {
                success: false,
                message: "Please correct the highlighted fields",
                errors: {
                    couponCode: "Coupon code already exists"
                }
            };
        }

        if (
            error.name === "ValidationError" ||
            error.name === "CastError"
        ) {
            return {
                success: false,
                message: "Invalid coupon details"
            };
        }

        return {
            success: false,
            message: "Failed to update coupon"
        };
    }
};


// TOGGLE COUPON STATUS
export const toggleCouponStatusService = async (couponId) => {
    try {
        const coupon = await Coupon.findById(couponId);

        if (!coupon) {
            return {
                success: false,
                message: "Coupon not found"
            };
        }

        coupon.isActive = !coupon.isActive;

        await coupon.save();

        return {
            success: true,
            message: `Coupon ${coupon.isActive ? "activated" : "deactivated"} successfully`
        };

    } catch (error) {
        console.log("TOGGLE COUPON STATUS SERVICE ERROR:", error);

        return {
            success: false,
            message: "Failed to update coupon status"
        };
    }
};


// DELETE COUPON
export const deleteCouponService = async (couponId) => {
    try {
        const coupon = await Coupon.findById(couponId);

        if (!coupon) {
            return {
                success: false,
                message: "Coupon not found"
            };
        }

        await Coupon.findByIdAndDelete(couponId);

        return {
            success: true,
            message: "Coupon deleted successfully"
        };

    } catch (error) {
        console.log("DELETE COUPON SERVICE ERROR:", error);

        return {
            success: false,
            message: "Failed to delete coupon"
        };
    }
};
