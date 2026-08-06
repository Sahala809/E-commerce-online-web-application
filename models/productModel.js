import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        productName:{
            type: String,
            required: true,
            trim: true
            },

        description: {
            type: String,
            required: true,
            trim: true
        },

        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref:"Category",
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

)

const Product = mongoose.model("Product", productSchema)

export default Product