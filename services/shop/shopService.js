import Product from "../../models/productModel.js"
import Category from "../../models/categoryModel.js"
import Variant from "../../models/variantModel.js"
export const loadShopService = async (filters) => {
    let products = await Product.find({
        isActive: true
    }).lean()

    // if(filters.color){
    //     const selectedColors = Array.isArray(filters.colors)
    //         ? filters.color 
    //         : [filters.color]

    //     const normalizedSelectedColors = selectedColors.map(colors =>
    //         color.trim().toLowerCase()
    //     )

    //     const variants = await Variant.find({
    //         color: { $in: normalizedSelectedColors}
    //     }).select("productId")

    //     const productId = variants.map(variant => variant.productId)

    //     products = await Product.find({
    //         _id: { $in: productId }
    //     })

    // }else {
    //     products = await Product.find()
    // }


    const categories = await Category.find({
        isActive: true
    }).lean()

    const variants = await Variant.find({
        isActive: true,
        stock: { $gt: 0}
    })


    const shopProducts = products.map(product => {

        const productVariants = variants.filter(
            variant =>
                variant.productId.toString() === product._id.toString()
        );

        return {
            ...Product,
            variants:productVariants
        }
    })

    const colors = await Variant.distinct("color")

    const normalizedColors = [
        ...new Set(colors.map(color => color.trim().toLowerCase()))
    ];

    return {
        products: shopProducts,
        categories,
        colors: normalizedColors
    }
}

