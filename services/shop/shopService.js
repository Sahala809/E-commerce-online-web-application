import Product from "../../models/productModel.js"
import Category from "../../models/categoryModel.js"
import Variant from "../../models/variantModel.js"

export const loadShopService = async (filters = {}) => {
     
    console.log("FILTERS RECEIVED:", filters);

    const page = Number(filters.page) || 1
    const limit = 12
    const skip = (page - 1) * limit

    
    const sort = filters.sort || "";

    const search = filters.search?.trim() || "";

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

// Search by product name
if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    productFilter.productName = {
        $regex: escapedSearch,
        $options: "i"
    };
}
 
    if (selectedColors.length > 0) {

        productFilter._id = {
            $in: productIds
        };

    }

    if (variants.length === 0) { 
        productFilter._id = { 
            $in: [] 
        }; 
    }

    const totalProducts = await Product.countDocuments(
        productFilter
    ).lean();


    if (sort === "priceLow") { 
        variants.sort((a, b) => {
             const priceA = 
                a.offerPrice && 
                a.offerPrice > 0 && 
                a.offerPrice < a.price 
                ? a.offerPrice 
                : a.price; 
             const priceB = 
                b.offerPrice && 
                b.offerPrice > 0 && 
                b.offerPrice < b.price 
                ? b.offerPrice 
                : b.price; 
             return priceA - priceB; 
            }); 

        } else if (sort === "priceHigh") { 
            variants.sort((a, b) => {
                const priceA = 
                    a.offerPrice && 
                    a.offerPrice > 0 && 
                    a.offerPrice < a.price 
                    ? a.offerPrice 
                    : a.price;

                const priceB = 
                    b.offerPrice && 
                    b.offerPrice > 0 && 
                    b.offerPrice < b.price 
                    ? b.offerPrice 
                    : b.price; 
                    
                return priceB - priceA; 
            }); 
        
        } else if (sort === "newest") { 
            // Newest product first 
            
            variants.sort((a, b) => { 
                const dateA = 
                    a.productId?.createdAt 
                    ? new Date(a.productId.createdAt) 
                    : 0; 
                    
                const dateB = 
                    b.productId?.createdAt 
                    ? new Date(b.productId.createdAt) 
                    : 0; 
                    
                return dateB - dateA; 
            }); 
        }

        const sortedProductIds = [ 
            ...new Set( 
                variants .map(variant => 
                    variant.productId?._id?.toString() 
                ) 
                .filter(Boolean) 
            ) 
        ];

    
    let products = await Product.find(productFilter)
        .populate("categoryId")
        .lean()

    
    if ( 
        sort === "priceLow" ||
        sort === "priceHigh" ||
        sort === "newest" 
    ) { 
        products.sort((a, b) => { 
            const indexA = 
                sortedProductIds.indexOf( 
                    a._id.toString() 
                );
            
            const indexB = 
                sortedProductIds.indexOf( 
                    b._id.toString() 
                ); 
                
                // Products without matching variant 
                // go to the end 
                
                if (indexA === -1) return 1; 
                if (indexB === -1) return -1; 
                
                return indexA - indexB; 
        }); 
            
    } else {

            // Default = newest products first 
            
        products.sort((a, b) => {
            return (
                    new Date(b.createdAt) - 
                    new Date(a.createdAt) 
                ); 
            }); 
        }


        products = 
            products.slice( skip, skip + limit );

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

