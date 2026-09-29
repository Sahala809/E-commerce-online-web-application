import mongoose from "mongoose";

const brandSchema = new mongoose.Schema(
    {
        brandName: {
            type: String,
            required: true,
            trim: true
        },

        brandImage: {
            type: String,
            required: true
        },

        description: {
            type: String,
            required: true,
            trim: true
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

const Brand = mongoose.model("Brand", brandSchema);

export default Brand;