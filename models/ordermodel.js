import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        totalAmount: {
            type: Number,
            required: true
        },

        status: {
            type: String,
            enum: [
                "PLACED",
                "SHIPPED",
                "OUT_FOR_DELIVERY",
                "DELIVERED",
                "CANCELLED",
                "RETURNED"
            ],
            default: "PLACED"
        },

        shippingAddress: {
            fullName: {
                type: String,
                required: true
            },

            phone: {
                type: String,
                required: true
            },

            houseName: {
                type: String,
                required: true
            },

            street: {
                type: String,
                required: true
            },

            district: {
                type: String,
                required: true
            },

            city: {
                type: String,
                required: true
            },

            state: {
                type: String,
                required: true
            },

            country: {
                type: String,
                required: true
            },

            pincode: {
                type: String,
                required: true
            }
        },

        deliveryDate: {
            type: Date,
            default: null
        },

        isPaid: {
            type: Boolean,
            default: false
        },

        orderItemId: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "OrderItem",
                required: true
            }
        ],

        paymentMethod: {
            type: String,
            enum: [
                "ONLINE",
                "COD",
                "WALLET"
            ],
            required: true
        },

        subTotal: {
            type: Number,
            required: true
        },

        discountAmount: {
            type: Number,
            default: 0
        },

        couponId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Coupon",
            default: null
        },

        paymentStatus: {
            type: String,
            enum: [
                "PENDING",
                "SUCCESS",
                "FAILED",
                "REFUNDED"
            ],
            default: "PENDING"
        },

        deliveryCharge: {
            type: Number,
            default: 0
        }
    },
    {    
        timestamps: true
    }
);

const Order = mongoose.model("Order", orderSchema);


export default Order;