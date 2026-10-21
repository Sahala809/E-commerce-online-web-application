
import Coupon from "../../models/couponModel.js";


export const getAvailableCouponsService = async (userId) => {
    try {
        const now = new Date();

        const coupons = await Coupon.find({
            isActive: true,
            expDate: { $gte: now },
            $or: [
                { isPublic: true },
                { userId: userId }
            ]
        })
        .select(
            "couponCode discount couponType maxDiscountAmount minimumPurchase expDate"
        )
        .sort({ expDate: 1 })
        .lean();

        return {
            success: true,
            coupons
        };

    } catch (error) {
        console.error("GET AVAILABLE COUPONS ERROR:", error);

        return {
            success: false,
            coupons: []
        };
    }
};


export const validateCouponService = async (
    couponCode,
    userId,
    subtotal
) => {
    try {
        const code = couponCode?.trim().toUpperCase();

        if (!code) {
            return {
                success: false,
                message: "Please enter a coupon code"
            };
        }

        const coupon = await Coupon.findOne({
            couponCode: code
        });

        if (!coupon || !coupon.isActive) {
            return {
                success: false,
                message: "Invalid or inactive coupon code"
            };
        }

        if (new Date(coupon.expDate) < new Date()) {
            return {
                success: false,
                message: "This coupon has expired"
            };
        }

        if (
            !coupon.isPublic &&
            (!coupon.userId ||
                coupon.userId.toString() !== userId.toString())
        ) {
            return {
                success: false,
                message: "This coupon is not available for your account"
            };
        }

        if (coupon.usedCount >= coupon.usageLimit) {
            return {
                success: false,
                message: "This coupon has reached its usage limit"
            };
        }

        if (subtotal < coupon.minimumPurchase) {
            return {
                success: false,
                message: `Minimum purchase of ₹${coupon.minimumPurchase} is required`
            };
        }

        let couponDiscount = 0;

        if (coupon.couponType === "FIXED") {
            couponDiscount = coupon.discount;
        } else {
            couponDiscount = subtotal * coupon.discount / 100;

            if (coupon.maxDiscountAmount != null) {
                couponDiscount = Math.min(
                    couponDiscount,
                    coupon.maxDiscountAmount
                );
            }
        }

        // A coupon must not reduce the payable amount below zero.
        couponDiscount = Math.min(
            Math.round(couponDiscount * 100) / 100,
            subtotal
        );

        return {
            success: true,
            message: "Coupon applied successfully",
            coupon,
            couponDiscount
        };

    } catch (error) {
        console.error("VALIDATE COUPON SERVICE ERROR:", error);

        return {
            success: false,
            message: "Unable to validate coupon right now"
        };
    }
};


