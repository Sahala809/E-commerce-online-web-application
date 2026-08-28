import Product from "../../models/productModel.js"
import Category from "../../models/categoryModel.js"
import Variant from "../../models/variantModel.js"
export const loadShopService = async (filters = {}) => {
     console.log("FILTERS RECEIVED:", filters);
    const page = Number(filters.page) || 1
    const limit = 12
    const skip = (page - 1) * limit


    const selectedCategories = filters.category
    ? Array.isArray(filters.category)
        ? filters.category
        : [filters.category]
    : [];

    const selectedColors = filters.color || []
    const maxPrice = Number(filters.maxPrice) || 50000;

    const variantFilter = {
        isActive: true, 
        stock: { $gt: 0 },
        price: { $lte: maxPrice}
    }


    if(selectedColors.length > 0) {
        variantFilter.color = {
            $in: selectedColors
        }
    }

    const variants = await Variant.find(variantFilter)
    .populate("productId")
    .lean()

    const productIds = variants
        .map(variant => variant.productId?._id)
        .filter(Boolean);


    const productFilter = {
        isActive: true
    };

    if (selectedCategories.length > 0) {

        productFilter.categoryId = {
            $in: selectedCategories
        };

    }

    if (selectedColors.length > 0) {

        productFilter._id = {
            $in: productIds
        };

    }

    const totalProducts = await Product.countDocuments(
        productFilter
    ).lean();


    
    let products = await Product.find(productFilter)
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

