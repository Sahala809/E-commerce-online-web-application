
import Category from "../../models/categoryModel.js"
import Product from "../../models/productModel.js"
import Variant from "../../models/variantModel.js"
import { 
    validateAddProduct,
    validateAddVariant,
    validateEditVariant
 } from "./validationService.js"

export const loadProductService = async (page, limit, search) => {

    const skip = (page - 1) * limit

    const filter = {}

    if(search){
        filter.productName = {
            $regex: search,
            $options: "i"
        }
    }
    const products = await Product.find(filter)
        .populate("categoryId")
        .skip(skip)
        .limit(limit)
    
    for (const product of products) {

        const firstVariant = await Variant.findOne({
            productId: product._id
        });

        product.firstVariant = firstVariant;
    }


    const totalProducts = await Product.countDocuments(filter)

    const activeProducts = await Product.countDocuments({
        isActive:true
    })
    const inactiveProducts = await Product.countDocuments({
        isActive: false
    })

    const totalPages = Math.ceil(totalProducts / limit)

    return {
        products,
        totalProducts,
        activeProducts,
        inactiveProducts,
        totalPages
    }
}

export const addProductService = async (req,res) => {

    const {
        productName,
        description,
        categoryId,
        brandId,
        isActive
    } = req.body

    const errors = validateAddProduct(req.body)

    const existingProduct = await Product.findOne({
        productName: productName.trim()
    })

    if (existingProduct) {
        errors.productName = "Product name already exists.";
    }

    if (Object.keys(errors).length > 0) {
        return {
            success: false,
            errors
        };
    }

    

    const product = await Product.create({
        productName: productName.trim(),
        description: description.trim(),
        brandId: brandId || null,
        categoryId,
        isActive
    })

    return{
        success: true,
        product
    }
}

export const addVariantService = async (req,res) => {
    console.log("REQ BODY:", req.body);
    console.log("REQ FILES:", req.files);
    console.log("REQ PARAMS:", req.params);
    const { productId } = req.params

    const { 
        color,
        stock,
        price,
        offerPrice,
        description,
        isActive
    } = req.body

    const errors = await validateAddVariant(req.body, req.files)

    if (Object.keys(errors).length > 0) {
        return {
            success: false,
            errors
        };
    }

    const images = req.files.map(file => file.filename)

    const variant = await Variant.create({
        productId,
        color:color.trim(),
        stock,
        price,
        offerPrice,
        description,
        images,
        isActive:isActive === "true"
    })

    return {
        success: true,
        variant
    }


}

export const editProductService = async(req, res) => {
    const   productId  = req.params.id

    
    const {
        productName,
        categoryId,
        brandId,
        description,
        isActive
    } = req.body

    const errors = validateAddProduct(req.body)

    const existingProduct = await Product.findOne({
        productName: productName.trim(),
        _id: {$ne: productId}
    })

    if (existingProduct) {
        errors.productName = "Product name already exists.";
    }

    if (Object.keys(errors).length > 0) {

        const product = await Product.findById(productId)
        const categories = await Category.find({ isActive: true });
    

        return {
            success: false,
            errors,
            product,
            categories
        };
    }

    await Product.findByIdAndUpdate(productId, {
        productName: productName.trim(),
        categoryId,
        brandId: brandId || null,
        description: description.trim(),
        isActive: !!isActive
    });

    return {
        success: true
    };

}

export const deleteProductService = async (req) => {

    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
        return {
            success: false,
            message: "Product not found."
        };
    }

    // Check whether variants exist
    const variantExists = await Variant.findOne({
        productId: id
    });

    if (variantExists) {
        return {
            success: false,
            message: "Cannot delete product. Delete its variants first."
        };
    }

    await Product.findByIdAndDelete(id);

    return {
        success: true
    };
};


export const editVariantService = async (req) => {

    const { variantId } = req.params;
    
    const {
        color,
        stock,
        price,
        offerPrice,
        description,
        isActive
    } = req.body;

    const errors = validateEditVariant(req.body);

    if (Object.keys(errors).length > 0) {

        const variant = await Variant.findById(variantId);

        return {
            success: false,
            errors,
            variant
        };
    }

    const updateData = {
        color,
        stock,
        price,
        offerPrice,
        description,
        isActive: isActive === "true"
    };

    if (req.files && req.files.length > 0) {
        updateData.images = req.files.map(file => file.filename);
    }

    await Variant.findByIdAndUpdate(variantId, updateData);

    return {
        success: true
    };
};



export const deleteVariantService = async (req) => {

    const { variantId } = req.params;

    const variant = await Variant.findById(variantId);

    if (!variant) {
        return {
            success: false,
            message: "Variant not found"
        };
    }


    await Variant.findByIdAndDelete(variantId);


    return {
        success: true
    };
};