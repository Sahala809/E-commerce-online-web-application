import Product from "../../models/productModel.js";
import Variant from "../../models/variantModel.js";

export const loadProductDetailService = async (productId) => {
    
    const product = await Product.findOne({
        _id: productId,
        isActive: true
    
    })
        .populate("categoryId")
        .lean()

    if(!product){
        return null
    }

    const variants = await Variant.find({
        productId:productId,
        isActive: true
    })
        .sort({createAt: -1})
        .lean()

    return {
        product,
        variants
    }
};