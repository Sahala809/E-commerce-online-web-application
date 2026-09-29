import Brand from "../../models/brandModel.js";


// CREATE BRAND
export const createBrandService = async (
    brandName,
    description,
    brandImage
) => {
    try {

        if (!brandName || !brandName.trim()) {
            return {
                success: false,
                message: "Brand name is required"
            };
        }

        if (!description || !description.trim()) {
            return {
                success: false,
                message: "Brand description is required"
            };
        }

        if (!brandImage) {
            return {
                success: false,
                message: "Brand image is required"
            };
        }

        const existingBrand = await Brand.findOne({
            brandName: {
                $regex: `^${brandName.trim()}$`,
                $options: "i"
            }
        });

        if (existingBrand) {
            return {
                success: false,
                message: "Brand already exists"
            };
        }

        const brand = await Brand.create({
            brandName: brandName.trim(),
            description: description.trim(),
            brandImage,
            isActive: true
        });

        return {
            success: true,
            message: "Brand created successfully",
            brand
        };

    } catch (error) {

        console.log("CREATE BRAND SERVICE ERROR:", error);

        return {
            success: false,
            message: "Failed to create brand"
        };
    }
};


// GET ALL BRANDS
export const getBrandsService = async () => {
    try {

        const brands = await Brand
            .find()
            .sort({ createdAt: -1 });

        return {
            success: true,
            brands
        };

    } catch (error) {

        console.log("GET BRANDS SERVICE ERROR:", error);

        return {
            success: false,
            brands: [],
            message: "Failed to load brands"
        };
    }
};


// GET BRAND BY ID
export const getBrandByIdService = async (brandId) => {
    try {

        const brand = await Brand.findById(brandId);

        if (!brand) {
            return {
                success: false,
                message: "Brand not found"
            };
        }

        return {
            success: true,
            brand
        };

    } catch (error) {

        console.log("GET BRAND BY ID SERVICE ERROR:", error);

        return {
            success: false,
            message: "Failed to load brand"
        };
    }
};



export const editBrandService = async (
    brandId,
    brandName,
    description,
    brandImage
) => {
    try {

        if (!brandName || !brandName.trim()) {
            return {
                success: false,
                message: "Brand name is required"
            };
        }

        if (!description || !description.trim()) {
            return {
                success: false,
                message: "Brand description is required"
            };
        }

        const brand = await Brand.findById(brandId);

        if (!brand) {
            return {
                success: false,
                message: "Brand not found"
            };
        }

        const existingBrand = await Brand.findOne({
            brandName: {
                $regex: `^${brandName.trim()}$`,
                $options: "i"
            },
            _id: {
                $ne: brandId
            }
        });

        if (existingBrand) {
            return {
                success: false,
                message: "Brand already exists"
            };
        }

        brand.brandName = brandName.trim();
        brand.description = description.trim();

        // Update image only when a new image is uploaded
        if (brandImage) {
            brand.brandImage = brandImage;
        }

        await brand.save();

        return {
            success: true,
            message: "Brand updated successfully",
            brand
        };

    } catch (error) {

        console.log("UPDATE BRAND SERVICE ERROR:", error);

        return {
            success: false,
            message: "Failed to update brand"
        };
    }
};


// TOGGLE BRAND STATUS
export const toggleBrandStatusService = async (brandId) => {
    try {

        const brand = await Brand.findById(brandId);

        if (!brand) {
            return {
                success: false,
                message: "Brand not found"
            };
        }

        brand.isActive = !brand.isActive;

        await brand.save();

        return {
            success: true,
            message: brand.isActive
                ? "Brand activated successfully"
                : "Brand deactivated successfully",
            brand
        };

    } catch (error) {

        console.log(
            "TOGGLE BRAND STATUS SERVICE ERROR:",
            error
        );

        return {
            success: false,
            message: "Failed to update brand status"
        };
    }
};


export const deleteBrandService = async (brandId) => {
    try {

        const brand = await Brand.findById(brandId);

        if (!brand) {
            return {
                success: false,
                message: "Brand not found"
            };
        }

        await Brand.findByIdAndDelete(brandId);

        return {
            success: true,
            message: "Brand deleted successfully"
        };

    } catch (error) {

        console.log("DELETE BRAND SERVICE ERROR:", error);

        return {
            success: false,
            message: "Failed to delete brand"
        };
    }
};