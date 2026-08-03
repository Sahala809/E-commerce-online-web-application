import Category from "../../models/categoryModel.js";
import { validateAddCategory } from "./validationService.js";


export const loadCategoryService = async (req) => {

    const page = Number(req.query.page) || 1
    const limit = 5
    const skip = (page-1) * limit

    const search = req.query.search || "";

    const filter = {}

    if(search){
        filter.categoryName={
            $regex: search,
            $options: "i"
        }
    }

    const totalCategories = await Category.countDocuments(filter)

    const categories = await Category.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const totalPages = Math.ceil(totalCategories / limit)    

    return {
        success: true,
        categories,
        currentPage:page,
        totalPages,
        search
    };

};

export const addCategoryService = async(req, res) => {

    const errors = await validateAddCategory(req.body)

    
    
    if(Object.keys(errors).length > 0) {
        return {
            success: false,
            errors,
            message:""
        }
    }

    const { categoryName, description, isActive } = req.body;
    
    const existingCategory = await Category.findOne({
        categoryName: categoryName.trim()
    })

    if(existingCategory){
        return {
            success: false,
            errors:{
                categoryName: "Category already exists"
            },
            message: ""
        }
    }

    await Category.create({
        categoryName: categoryName.trim(),
        description: description.trim(),
        isActive: isActive == "on"
    })

    
    return {
        success : true
    }
}

export const editCategoryService =  async(req, res) => {

    const errors = await validateAddCategory(req.body)
    
    if(Object.keys(errors).length > 0) {
        return {
            success: false,
            errors,
            message:""
        }
    }

    const { categoryName, description ,isActive} = req.body;
    const { id } = req.params

    const existingCategory = await Category.findOne({
        categoryName: categoryName.trim(),
        _id: { $ne: id}

    })

    if(existingCategory){
        return {
            success: false,
            errors:{
                categoryName: "Category already exists."
            },
            message: ""
        }
    }

    await Category.findByIdAndUpdate(id, {
        categoryName: categoryName.trim(),
        description: description.trim(),
        isActive: isActive === "on"
    })

    return {
        success: true
    }
}