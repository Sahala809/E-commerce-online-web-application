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
        .sort({createdAt: -1})
        .lean()

    let relatedProducts = [];

    const categoryId = product.categoryId?._id;

      console.log("CATEGORY ID:", product.categoryId?._id);
console.log("CATEGORY NAME:", product.categoryId?.name);



if (categoryId) {

        relatedProducts = await Product.find({
            _id: { $ne: productId },
            categoryId: categoryId,
            isActive: true
        })
            .populate("categoryId")
            .limit(4)
            .lean();
    }


    console.log(
        "RELATED PRODUCTS:",
        relatedProducts.map(item => item.productName)
    );
      
console.log("CURRENT PRODUCT:", product.productName);
console.log("CURRENT CATEGORY:", product.categoryId);
console.log("RELATED PRODUCTS:", relatedProducts);
    // Get variants for related products
    const relatedProductIds = relatedProducts.map(
        item => item._id
    );

    const relatedVariants = await Variant.find({
        productId: { $in: relatedProductIds },
        isActive: true
    })
        .lean();


    // Attach first variant to each related product
    relatedProducts.forEach(item => {

        const variant = relatedVariants.find(
            variant =>
                variant.productId.toString() ===
                item._id.toString()
        );

        item.variant = variant || null;
    });


    return {
        product,
        variants,
        relatedProducts
    }
};