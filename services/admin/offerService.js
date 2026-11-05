
import mongoose from "mongoose";
import Offer from "../../models/offerModel.js";
import Product from "../../models/productModel.js";
import Variant from "../../models/variantModel.js";
import Category from "../../models/categoryModel.js";

export const loadOfferService = async (
    page = 1, 
    limit = 5, 
    search = "",
    type = "" 
) => {
    const skip = (page - 1) * limit;

    const filter = {};

    if (search && search.trim()) {
        filter.offerName = {
            $regex: search.trim(),
            $options: "i"
        };
    }

    if (type && ["VARIANT", "PRODUCT", "CATEGORY"].includes(type)) {
        filter.offerType = type;
    }

    const offers = await Offer.find(filter)
        .populate("variantId")
        .populate("productId")
        .populate("categoryId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const totalOffers = await Offer.countDocuments(filter);
    const activeOffers = await Offer.countDocuments({
        isActive: true
    });
    const inactiveOffers = await Offer.countDocuments({
        isActive: false
    });

    const totalPages = Math.ceil(totalOffers / limit);

    return {
        offers,
        totalOffers,
        activeOffers,
        inactiveOffers,
        totalPages,
        currentPage: page,
        limit,
        search
    };
};

export const loadOfferFormDataService = async () => {
    const [products, variants, categories] = await Promise.all([
        Product.find({ isActive: true }).sort({ productName: 1 }),
        Variant.find({ isActive: true, stock: { $gt: 0 } })
            .populate("productId")
            .sort({ createdAt: -1 }),
        Category.find({ isActive: true }).sort({ categoryName: 1 })
    ]);

    return {
        products,
        variants,
        categories
    };
};

const refreshVariantOfferPrices = async () => {
    try {
        const now = new Date();

        const allOffers = await Offer.find({
            offerType: { $in: ["VARIANT", "PRODUCT", "CATEGORY"] }
        }).lean();

        const variants = await Variant.find({
            isActive: true
        }).populate("productId");

        for (const variant of variants) {

            const product = variant.productId;

            if (!product) continue;

            const variantId = String(variant._id);
            const productId = String(product._id);
            const categoryId = String(product.categoryId);

            // Find all offers targeting this variant
            const targetedOffers = allOffers.filter((offer) =>
                (
                    offer.offerType === "VARIANT" &&
                    String(offer.variantId) === variantId
                ) ||
                (
                    offer.offerType === "PRODUCT" &&
                    String(offer.productId) === productId
                ) ||
                (
                    offer.offerType === "CATEGORY" &&
                    String(offer.categoryId) === categoryId
                )
            );

            // Only active offers within the date range
            const activeOffers = targetedOffers.filter((offer) =>
                offer.isActive &&
                new Date(offer.startDate) <= now &&
                new Date(offer.endDate) >= now
            );

            // Calculate discounted prices
            const calculatedOffers = activeOffers.map((offer) => ({
                offerType: offer.offerType,
                finalPrice: Number(
                    (
                        variant.price *
                        (1 - offer.discountPercentage / 100)
                    ).toFixed(2)
                )
            }));

            // Lowest price means highest discount
            calculatedOffers.sort(
                (a, b) => a.finalPrice - b.finalPrice
            );

            const bestOffer = calculatedOffers[0];

            // Original variant prices
            const originalPrice = Number(variant.price);
            const currentOfferPrice = Number(variant.currentOfferPrice);

            // Variant's own offer price
            const basePrice =
                currentOfferPrice > 0 && currentOfferPrice < originalPrice
                    ? currentOfferPrice
                    : originalPrice;

            // Select the lowest price
            const newOfferPrice = bestOffer
                ? Math.min(bestOffer.finalPrice, basePrice)
                : basePrice;

            // Update offerPrice only
            // Never modify currentOfferPrice or price
            if (Number(variant.offerPrice) !== newOfferPrice) {

                variant.offerPrice = newOfferPrice;

                await variant.save();

                console.log(
                    "UPDATED VARIANT:",
                    variant._id,
                    "OLD OFFER PRICE:",
                    variant.offerPrice,
                    "NEW OFFER PRICE:",
                    newOfferPrice
                );
            }
        }

        console.log("Variant offer prices refreshed successfully.");

    } catch (error) {
        console.error("REFRESH VARIANT OFFER PRICE ERROR:", error);
        throw error;
    }
};


export const createOfferService = async (body) => {
    const {
        offerName,
        offerType,
        variantId,
        productId,
        categoryId,
        discountPercentage,
        startDate,
        endDate
    } = body;

    const errors = {};

    // Validate offer name
    if (!offerName || !offerName.trim()) {
        errors.offerName = "Offer name is required.";
    }

    // Validate offer type
    if (!["VARIANT", "PRODUCT", "CATEGORY"].includes(offerType)) {
        errors.offerType = "Please select a valid offer type.";
    }

    // Validate discount percentage
    const discount = Number(discountPercentage);

    if (
        discountPercentage === undefined ||
        discountPercentage === "" ||
        !Number.isFinite(discount) ||
        discount < 1 ||
        discount > 99
    ) {
        errors.discountPercentage =
            "Discount must be between 1 and 99.";
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (!startDate || Number.isNaN(start.getTime())) {
        errors.startDate = "Please select a valid start date.";
    }

    if (!endDate || Number.isNaN(end.getTime())) {
        errors.endDate = "Please select a valid end date.";
    } else if (
        startDate &&
        !Number.isNaN(start.getTime()) &&
        end <= start
    ) {
        errors.endDate = "End date must be after the start date.";
    }

    // Validate the selected target
    let targetExists = false;

    if (offerType === "VARIANT" && variantId) {
        targetExists = Boolean(
            await Variant.findOne({
                _id: variantId,
                isActive: true
            })
        );

        if (!targetExists) {
            errors.variantId = "Please select a valid active variant.";
        }
    } else if (offerType === "PRODUCT" && productId) {
        targetExists = Boolean(
            await Product.findOne({
                _id: productId,
                isActive: true
            })
        );

        if (!targetExists) {
            errors.productId = "Please select a valid active product.";
        }
    } else if (offerType === "CATEGORY" && categoryId) {
        targetExists = Boolean(
            await Category.findOne({
                _id: categoryId,
                isActive: true
            })
        );

        if (!targetExists) {
            errors.categoryId = "Please select a valid active category.";
        }
    } else if (["VARIANT", "PRODUCT", "CATEGORY"].includes(offerType)) {
        const field = {
            VARIANT: "variantId",
            PRODUCT: "productId",
            CATEGORY: "categoryId"
        }[offerType];

        errors[field] = "Please select a target for this offer.";
    }

    if (Object.keys(errors).length > 0) {
        return {
            success: false,
            errors
        };
    }

    const offer = await Offer.create({
        offerName: offerName.trim(),
        offerType,
        variantId: offerType === "VARIANT" ? variantId : null,
        productId: offerType === "PRODUCT" ? productId : null,
        categoryId: offerType === "CATEGORY" ? categoryId : null,
        discountPercentage: discount,
        startDate: start,
        endDate: end,
        isActive: true
    });

    await refreshVariantOfferPrices();

    return {
        success: true,
        offer
    };
};


export const testRefreshVariantOfferPrices = async () => {
    await refreshVariantOfferPrices();
};



export const editOfferService = async (offerId, body) => {
    const {
        offerName,
        offerType,
        variantId,
        productId,
        categoryId,
        discountPercentage,
        startDate,
        endDate
    } = body;

    const errors = {};

    if (!offerName || !offerName.trim()) {
        errors.offerName = "Offer name is required.";
    }

    if (!["VARIANT", "PRODUCT", "CATEGORY"].includes(offerType)) {
        errors.offerType = "Please select a valid offer type.";
    }

    const discount = Number(discountPercentage);

    if (
        discountPercentage === "" ||
        discountPercentage === undefined ||
        !Number.isFinite(discount) ||
        discount < 1 ||
        discount > 99
    ) {
        errors.discountPercentage = "Discount must be between 1 and 99.";
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (!startDate || Number.isNaN(start.getTime())) {
        errors.startDate = "Please select a valid start date.";
    }

    if (!endDate || Number.isNaN(end.getTime())) {
        errors.endDate = "Please select a valid end date.";
    } else if (
        startDate &&
        !Number.isNaN(start.getTime()) &&
        end <= start
    ) {
        errors.endDate = "End date must be after the start date.";
    }

    const targets = {
        VARIANT: {
            field: "variantId",
            Model: Variant,
            value: variantId
        },
        PRODUCT: {
            field: "productId",
            Model: Product,
            value: productId
        },
        CATEGORY: {
            field: "categoryId",
            Model: Category,
            value: categoryId
        }
    };

    const target = targets[offerType];

    if (target) {
        if (!target.value) {
            errors[target.field] = "Please select a target for this offer.";
        } else {
            const exists = await target.Model.findOne({
                _id: target.value,
                isActive: true
            });

            if (!exists) {
                errors[target.field] = "Please select a valid active target.";
            }
        }
    }

    if (Object.keys(errors).length > 0) {
        return { success: false, errors };
    }

    const offer = await Offer.findById(offerId);

    if (!offer) {
        return {
            success: false,
            errors: { general: "Offer not found." }
        };
    }

    offer.offerName = offerName.trim();
    offer.offerType = offerType;
    offer.variantId = offerType === "VARIANT" ? variantId : null;
    offer.productId = offerType === "PRODUCT" ? productId : null;
    offer.categoryId = offerType === "CATEGORY" ? categoryId : null;
    offer.discountPercentage = discount;
    offer.startDate = start;
    offer.endDate = end;

    await offer.save();
    await refreshVariantOfferPrices();

    return { success: true, offer };
};

export const toggleOfferStatusService = async (offerId) => {
    try {
        // Check whether the ID is valid
        if (!mongoose.Types.ObjectId.isValid(offerId)) {
            return {
                success: false,
                message: "Invalid offer ID."
            };
        }

        // Find the offer
        const offer = await Offer.findById(offerId);

        if (!offer) {
            console.log("OFFER NOT FOUND:", offerId);

            return {
                success: false,
                message: "Offer not found."
            };
        }

        console.log("BEFORE TOGGLE:", offer.isActive);

        // Change the offer status
        const newStatus = !offer.isActive;

        // Update MongoDB
        const updatedOffer = await Offer.findByIdAndUpdate(
            offerId,
            { $set: { isActive: newStatus } },
            { new: true, runValidators: true }
        );

        console.log("AFTER DATABASE UPDATE:", updatedOffer.isActive);

        // Refresh variant offer prices
        await refreshVariantOfferPrices();

        return {
            success: true,
            offer: updatedOffer
        };

    } catch (error) {
        console.error("TOGGLE OFFER SERVICE ERROR:", error);
        throw error;
    }
};

export const deleteOfferService = async (offerId) => {
    const offer = await Offer.findById(offerId);

    if (!offer) {
        return {
            success: false,
            message: "Offer not found."
        };
    }

    await Offer.findByIdAndDelete(offerId);

    // Refresh variant offer prices after deleting the offer
    await refreshVariantOfferPrices();

    return {
        success: true,
        message: "Offer deleted successfully."
    };
};

