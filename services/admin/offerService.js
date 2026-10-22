
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
    const now = new Date();

    // Find variants targeted by Offer Management offers,
    // including expired or inactive offers.
    const allOffers = await Offer.find({
        $or: [
            { offerType: "VARIANT" },
            { offerType: "PRODUCT" },
            { offerType: "CATEGORY" }
        ]
    }).lean();

    if (allOffers.length === 0) return;

    const products = await Product.find().select("_id categoryId isActive").lean();

    const variants = await Variant.find({
        isActive: true
    }).populate("productId");

    for (const variant of variants) {
        const product = variant.productId;

        if (!product) continue;

        const variantId = String(variant._id);
        const productId = String(product._id);
        const categoryId = String(product.categoryId);

        const targetedOffers = allOffers.filter((offer) =>
            (offer.offerType === "VARIANT" &&
                String(offer.variantId) === variantId) ||
            (offer.offerType === "PRODUCT" &&
                String(offer.productId) === productId) ||
            (offer.offerType === "CATEGORY" &&
                String(offer.categoryId) === categoryId)
        );

        // Leave variants that were never targeted by Offer Management unchanged.
        if (targetedOffers.length === 0) continue;

        const activeOffers = targetedOffers.filter((offer) =>
            offer.isActive &&
            new Date(offer.startDate) <= now &&
            new Date(offer.endDate) >= now
        );

        // Priority: Variant > Product > Category.
        const applicableOffer =
            activeOffers.find((offer) =>
                offer.offerType === "VARIANT"
            ) ||
            activeOffers.find((offer) =>
                offer.offerType === "PRODUCT"
            ) ||
            activeOffers.find((offer) =>
                offer.offerType === "CATEGORY"
            );

            console.log("Applicable offer:", applicableOffer);

        const newOfferPrice = applicableOffer
            ? Number(
                (
                    variant.price *
                    (1 - applicableOffer.discountPercentage / 100)
                ).toFixed(2)
            )
            : 0;

        if (Number(variant.offerPrice) !== newOfferPrice) {
    variant.offerPrice = newOfferPrice;
    await variant.save();

    console.log("UPDATED OFFER PRICE:", variant.offerPrice);
}
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
    const offer = await Offer.findById(offerId);

    if (!offer) {
        return {
            success: false,
            message: "Offer not found."
        };
    }

    offer.isActive = !offer.isActive;

    await offer.save();

    // Refresh variant offer prices after activation/deactivation
    await refreshVariantOfferPrices();

    return {
        success: true,
        offer
    };
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

