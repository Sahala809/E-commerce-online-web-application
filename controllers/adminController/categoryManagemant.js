
import Category from "../../models/categoryModel.js";

import {
    loadCategoryService,
    addCategoryService,
    editCategoryService,
    deleteCategoryService
} from "../../services/admin/categoryService.js";


export const loadCategory = async (req,res) =>{
    try {

        const result = await loadCategoryService(req)

        const successMessage = req.session.successMessage || "";
        const errorMessage = req.session.errorMessage || "";

        req.session.successMessage = null;
        req.session.errorMessage = null;

        return res.render("admin/category/category", {
            activePage: "category",
            pageTitle: "Category",
            categories: result.categories,
            currentPage:result.currentPage,
            totalPages: result.totalPages,
            search:result.search,
            limit:result.limit,
            skip:result.skip,
            successMessage,
            errorMessage

        })
    } catch (error) {
        console.log(error)

        req.session.errorMessage = "Something went wrong.";

        return res.redirect("/admin/dashboard");
        
    }
    
}

export const loadAddCategory = async (req,res) =>{

    try {

        const successMessage = req.session.successMessage || "";
        const errorMessage = req.session.errorMessage || "";

        req.session.successMessage = null;
        req.session.errorMessage = null;

        return res.render('admin/category/addCategory', {
            activePage: "Category",
            pageTitle: "Category",
            errors:{},
            formData:{},
            successMessage,
            errorMessage

        })
        
    } catch (error) {
        console.log("LOAD ADD CATEGORY ERROR:", error)

        req.session.errorMessage = "Something went wrong"
        return res.redirect('/admin/category')
        
    }
    
}

export const addCategory = async(req,res) => {
    try {
        const result = await addCategoryService(req, res)

        const successMessage = req.session.successMessage || "";
        const errorMessage = req.session.errorMessage || "";

        req.session.successMessage = null;
        req.session.errorMessage = null;
        
        if(!result.success){
            return res.render("admin/category/addCategory", {
                activePage: "category",
                pageTitle : "Category",
                message: result.message,
                errors: result.errors,
                formData: req.body,
                successMessage,
                errorMessage
            })
        }

        req.session.successMessage = "category successfully added"
        return res.redirect("/admin/category")
        
    } catch (error) {
        console.log("ADD CATEGORY ERROR:", error)

        req.session.errorMessage = "Something went wrong"
        return res.redirect('/admin/category/add')
        
    }
} 

export const loadEditCategory = async (req,res) =>{
    try {
        
        const {id} = req.params
        const category = await Category.findById(id)

        if(!category){
            return res.redirect('/admin/category')
        }

        return res.render('admin/category/editCategory', {
            activePage: "Category",
            pageTitle: "Category",
            category,
            message:"",
            errors: {},
            formData: {}

        })
            
    } catch (error) {
        console.log("EDIT CATEGORY ERROR:", error);

        req.session.errorMessage = "Something went wrong"
        return res.redirect('/admin/category')
    }
    
}


export const editCategory = async (req, res) => {
    try {

        const { id } = req.params
        const result = await editCategoryService(req, res)
        const category = await Category.findById(id)

        if(!result.success){
            return res.render('admin/category/editCategory', {
                activePage: "category",
                pageTitle: "Category",
                message : result.message,
                errors: result.errors,
                formData: req.body,
                category

            })
        }

        req.session.successMessage =  "Category updated successfully.";
        return res.redirect("/admin/category")

        
    } catch (error) {
        console.log("ADD CATEGORY ERROR:", error)

        req.session.errorMessage = "Something went wrong"
        return res.redirect("/admin/category/edit");
        
    }

    
}


export const deleteCategory = async (req, res) => {
    try {

        const result = await deleteCategoryService(req);

        if (!result.success) {
            req.session.errorMessage = result.message;
            return res.redirect("/admin/category");
        }

        req.session.successMessage = result.message;
        return res.redirect("/admin/category");

    } catch (error) {
        console.log("DELETE CATEGORY ERROR:", error);

        req.session.errorMessage = "Something went wrong"
        return res.redirect("/admin/category");
    }
};
