
import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
    {
        couponCode: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true
        },

        discount: {
            type: Number,
            required: true,
            min: [0.01, "Discount must be greater than zero"],
            validate: {
                validator: function (value) {
                    if (this.couponType === "PERCENTAGE") {
                        return value <= 100;
                    }

                    return true;
                },
                message: "Percentage discount cannot exceed 100%"
            }
        },

        couponType: {
            type: String,
            enum: ["FIXED", "PERCENTAGE"],
            required: true
        },

        maxDiscountAmount: {
            type: Number,
            min: 0,
            default: null
        },

        expDate: {
            type: Date,
            required: true
        },

        minimumPurchase: {
            type: Number,
            required: true,
            min: 0,
            default: 0
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        isActive: {
            type: Boolean,
            default: true
        },

        applicableCategories: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category"
        }],

        applicableProducts: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product"
        }],

        usageLimit: {
            type: Number,
            min: 1,
            default: 1
        },

        usedCount: {
            type: Number,
            min: 0,
            default: 0
        },

        perUserUsageLimit: {
            type: Number,
            min: 1,
            default: 1
        },
        isPublic: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;
