import Category from "../../models/categoryModel.js";

export const loadCategoryService = async() => {
    const categories = await Category.find().sort({createAt: -1})

    return {
        categories
    }
}