import Category from "../../models/categoryModel.js";
import { validateAddCategory } from "./validationService.js";

export const loadCategoryService = async() => {
    const categories = await Category.find().sort({createAt: -1})

    return {
        categories
    }
}

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