import mongoose from "mongoose";


const wishlistSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        items: [
            {
                
                productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true
                },

                variantId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Variant",
                    required: true
                }
            },
            
        
        ]
    },
    {
        timestamps: true
    }
);


const Wishlist = mongoose.model(
    "Wishlist",
    wishlistSchema
);

export default Wishlist;