
import mongoose from "mongoose";

const offerSchema = new mongoose.Schema(
    {
        offerName: {
            type: String,
            required: true,
            trim: true
        },

        offerType: {
            type: String,
            enum: ["VARIANT", "PRODUCT", "CATEGORY"],
            required: true
        },

        variantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Variant",
            default: null
        },

        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            default: null
        },

        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            default: null
        },

        discountPercentage: {
            type: Number,
            required: true,
            min: 1,
            max: 99
        },

        startDate: {
            type: Date,
            required: true
        },

        endDate: {
            type: Date,
            required: true
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

offerSchema.index({ offerType: 1, isActive: 1 });

const Offer = mongoose.model("Offer", offerSchema);

export default Offer;
