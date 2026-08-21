import Product from "../../models/productModel.js"
import Category from "../../models/categoryModel.js"
import Variant from "../../models/variantModel.js"
export const loadShopService = async (filters = {}) => {
    
    const page = Number(filters.page) || 1
    const limit = 12
    const skip = (page - 1) * limit

    const totalProducts =await Product.countDocuments({
        isActive: true
    }).lean()

    let products = await Product.find({
        isActive: true
    })
    .sort({createdAt: -1})
    .populate("categoryId")
    .skip(skip)
    .limit(limit)
    .lean()


    const categories = await Category.find({
        isActive: true
    }).lean()

    const colors = await Variant.distinct("color",{
        isActive: true
    })

    const variants = await Variant.find({
        isActive: true,
        stock: { $gt: 0}
    })
    .populate("productId")
    .lean()

    const shopProducts = products.map(product => {

        const productVariants = variants.filter(variant => {

            return (
                variant.productId &&
                variant.productId._id.toString() === product._id.toString()
            );

        });

        return {
            ...product,
            variant: productVariants[0] || null
        };
    });

    const totalPages = Math.ceil(totalProducts / limit)

    const normalizedColors = [
        ...new Set(
            colors.map(color =>
                color.trim().toLowerCase()
            )
        )
    ];


    return {
        products: shopProducts,
        categories,
        colors: normalizedColors,
        
        currentPage : page,
        totalPages,
        totalProducts
    };
}

