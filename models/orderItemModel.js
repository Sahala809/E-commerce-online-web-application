import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
    {
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true
        },

        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },

        variantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Variant",
            required: true
        },

        quantity: {
            type: Number,
            required: true,
            min: 1
        },

        price: {
            type: Number,
            required: true
        },

        orderItemStatus: {
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

        returnReason: {
            type: String,
            default: null
        },

        refundAmount: {
            type: Number,
            default: 0
        },

        cancelReason: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true
    }
);

const OrderItem = mongoose.model("OrderItem", orderItemSchema);

export default OrderItem;