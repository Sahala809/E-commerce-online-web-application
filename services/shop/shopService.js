import Product from "../../models/productModel.js";
import Category from "../../models/categoryModel.js";
import Variant from "../../models/variantModel.js";

export const loadShopService = async (filters = {}) => {
    try {
        console.log("FILTERS RECEIVED:", filters);

        const page = Number(filters.page) || 1;
        const limit = 8;
        const skip = (page - 1) * limit;

        const sort = filters.sort || "";
        const search = filters.search?.trim() || "";

        const selectedCategories = filters.category
            ? Array.isArray(filters.category)
                ? filters.category
                : [filters.category]
            : [];

        const selectedColors = filters.color
            ? Array.isArray(filters.color)
                ? filters.color
                : [filters.color]
            : [];

        const maxPrice = Number(filters.maxPrice) || 50000;

        // -----------------------------------
        // VARIANT FILTER
        // -----------------------------------

        const variantFilter = {
            isActive: true,
            stock: { $gt: 0 },
            price: { $lte: maxPrice }
        };

        if (selectedColors.length > 0) {
            variantFilter.color = {
                $in: selectedColors
            };
        }

        const variants = await Variant.find(variantFilter)
            .populate("productId")
            .lean();

        // -----------------------------------
        // PRODUCT FILTER
        // -----------------------------------

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
            const escapedSearch = search.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );

            productFilter.productName = {
                $regex: escapedSearch,
                $options: "i"
            };
        }

        // Only products having available variants
        const productIds = variants
            .map(variant => variant.productId?._id)
            .filter(Boolean);

        productFilter._id = {
            $in: productIds
        };

        // -----------------------------------
        // GET PRODUCTS
        // -----------------------------------

        let products = await Product.find(productFilter)
            .populate("categoryId")
            .lean();

        // -----------------------------------
        // ATTACH ONE VARIANT TO EACH PRODUCT
        // -----------------------------------

        const shopProducts = products.map(product => {

            const productVariants = variants.filter(variant => {
                return (
                    variant.productId &&
                    variant.productId._id.toString() ===
                    product._id.toString()
                );
            });

            if (productVariants.length === 0) {
                return null;
            }

            // Find lowest priced variant
            const firstVariant = productVariants.reduce(
                (lowest, current) => {

                    const lowestPrice =
                        lowest.offerPrice &&
                        lowest.offerPrice > 0 &&
                        lowest.offerPrice < lowest.price
                            ? lowest.offerPrice
                            : lowest.price;

                    const currentPrice =
                        current.offerPrice &&
                        current.offerPrice > 0 &&
                        current.offerPrice < current.price
                            ? current.offerPrice
                            : current.price;

                    return currentPrice < lowestPrice
                        ? current
                        : lowest;
                }
            );

            return {
                ...product,
                variant: firstVariant
            };

        }).filter(Boolean);

        // -----------------------------------
        // SORT PRODUCTS
        // -----------------------------------

        const getVariantPrice = (variant) => {

            if (
                variant.offerPrice &&
                variant.offerPrice > 0 &&
                variant.offerPrice < variant.price
            ) {
                return variant.offerPrice;
            }

            return variant.price;
        };

        if (sort === "priceLow") {

            shopProducts.sort((a, b) => {
                return (
                    getVariantPrice(a.variant) -
                    getVariantPrice(b.variant)
                );
            });

        } else if (sort === "priceHigh") {

            shopProducts.sort((a, b) => {
                return (
                    getVariantPrice(b.variant) -
                    getVariantPrice(a.variant)
                );
            });

        } else if (sort === "newest") {

            shopProducts.sort((a, b) => {
                return (
                    new Date(b.createdAt) -
                    new Date(a.createdAt)
                );
            });

        } else {

            // Default = newest products first

            shopProducts.sort((a, b) => {
                return (
                    new Date(b.createdAt) -
                    new Date(a.createdAt)
                );
            });
        }

        // -----------------------------------
        // PAGINATION
        // -----------------------------------

        const totalProducts = shopProducts.length;

        const paginatedProducts = shopProducts.slice(
            skip,
            skip + limit
        );

        // -----------------------------------
        // CATEGORIES
        // -----------------------------------

        const categories = await Category.find({
            isActive: true
        }).lean();

        // -----------------------------------
        // COLORS
        // -----------------------------------

        const colors = await Variant.distinct("color", {
            isActive: true,
            stock: { $gt: 0 }
        });

        const normalizedColors = [
            ...new Set(
                colors
                    .filter(Boolean)
                    .map(color =>
                        color.trim().toLowerCase()
                    )
            )
        ];

        // -----------------------------------
        // TOTAL PAGES
        // -----------------------------------

        const totalPages = Math.ceil(
            totalProducts / limit
        );

        // -----------------------------------
        // RETURN
        // -----------------------------------

        return {
            products: paginatedProducts,
            categories,
            colors: normalizedColors,
            currentPage: page,
            totalPages,
            totalProducts
        };

    } catch (error) {

        console.error(
            "Load shop service error:",
            error
        );

        return {
            products: [],
            categories: [],
            colors: [],
            currentPage: 1,
            totalPages: 0,
            totalProducts: 0
        };
    }
};