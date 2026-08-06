import Address from "../models/addressModel.js";
import User from "../models/userModel.js";
import Category from "../models/categoryModel.js";

import {
    adminLoginService
} from "../services/admin/adminAuthService.js";


import { dashboardService } from "../services/admin/dashbordService.js"

import { 
    loadUsersService,
    loadUserDetailsService
 } from "../services/admin/usersService.js";

import {
    loadCategoryService,
    addCategoryService,
    editCategoryService
} from "../services/admin/categoryService.js"

import {
    loadProductService,
    addProductService,
    addVariantService,
    editProductService,
    deleteProductService,
    editVariantService,
    deleteVariantService
} from "../services/admin/productService.js"
import Product from "../models/productModel.js";
import Variant from "../models/variantModel.js";


export const loadAdminLogin = (req, res) => {

    return res.render("admin/auth/login", {
        message: null,
        errors: {},
        formData: {}
    });

};

export const adminLogin = async (req, res) => {

    try {

        await adminLoginService(req, res);

    } catch (error) {

        console.log("ADMIN LOGIN ERROR:", error);

        return res.render("admin/auth/login", {
            message: "Something went wrong. Please try again.",
            errors: {},
            formData: req.body
        });

    }

};



export const loadDashboard = async (req, res) => {

    try {

        const result = await dashboardService()

        const successMessage = req.session.successMessage || "";
        const errorMessage = req.session.errorMessage || "";

        req.session.successMessage = null;
        req.session.errorMessage = null;

        if(!result.success){
            return  res.render('admin/dashboard',{

                activePage: "dashboard",
                pageTitle: "Dashboard",
                totalUsers:0,
                totalProducts:0,
                totalOrders: 0,
                totalRevenue:0 ,
                successMessage,
                errorMessage

            })
        }

        return res.render('admin/dashboard', {
            activePage: "dashboard",
            pageTitle: "Dashboard",
            totalUsers: result.totalUsers,
            totalProducts:result.totalProducts,
            totalOrders: result.totalOrders,
            totalRevenue:result.totalRevenue,
            successMessage,
            errorMessage
        })
        
    } catch (error) {
        console.log("LOAD DASHBOARD ERROR:", error);

        req.session.errorMessage = "Something went wrong.";
        return res.redirect("/admin/login");

        
    }
}

export const adminLogout = async (req, res) => {

    try {

        delete req.session.admin;

       
        return res.redirect("/admin/login");

    } catch (err) {

        console.log("ADMIN LOGOUT ERROR:", err);

        return res.redirect("/admin/dashboard");

    }

};

export const loadUsers = async (req, res) => {
    try {

        const result = await loadUsersService(req);
        const message = req.message || "";
console.log("SEARCH VALUE:", req.query.search);
        return res.render("admin/users/users", {
            activePage: "users",
            pageTitle: "Users",
            users: result.users,
            totalUsers: result.totalUsers,
            activeUsers: result.activeUsers,
            blockedUsers: result.blockedUsers,
            currentPage: result.currentPage,
            totalPages: result.totalPages,
            search: result.search,
            message
        });
        
    } catch (error) {
        console.error("LOAD USERS ERROR:", error);

        return res.render("admin/users/users", {
            activePage: "users",
            pageTitle: "Users",
            users: [],
            totalUsers: 0,
            activeUsers: 0,
            blockedUsers: 0,
            currentPage: 1,
            totalPages: 1,
            search: "",
            message: "Something went wrong"
        });
    }
}

export const loadUserDetails = async (req, res) => {
    const result = await loadUserDetailsService(req);
    console.log(result.address);
    res.render("admin/users/userDetails", {
        activePage:"users",
        pageTitle: "Users",
        user: result.user,
        address: result.address,
        message: ""
    });
};

export const blockUser = async (req, res) => {
    try {

        const userId = req.params.id;

        await User.findByIdAndUpdate(userId,{
            isBlocked: true
        })

        req.message = "User blocked successfully";

        return loadUsers(req, res);
       
    } catch (error) {
        console.error("BLOCK USER ERROR:", error);

        req.message = "Failed to block user";

        return loadUsers(req, res);
    }
}



export const unblockUser = async (req, res) => {
    try {

        const userId = req.params.id;

        await User.findByIdAndUpdate(userId,{
            isBlocked: false
        })

        req.message = "User unblocked successfully";

        return loadUsers(req, res);

    } catch (error) {
        console.log(error);

        req.message = "Failed to unblock user";

        return loadUsers(req, res);
    }
}


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

        if(!result.success){
            return res.render("admin/category/addCategory", {
                activePage: "category",
                pageTitle : "Category",
                message: result.message,
                errors: result.errors,
                formData: req.body
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

        const { id } = req.params;

        await Category.findByIdAndDelete(id);

        req.session.message = "Category deleted successfully.";

        return res.redirect("/admin/category");

    } catch (error) {
        console.log("DELETE CATEGORY ERROR:", error);

        req.session.errorMessage = "Something went wrong"
        return res.redirect("/admin/category");
    }
};


export const loadProduct = async (req,res) => {
    try {

        const page = Number(req.query.page) || 1;
        const limit = 5;
        const search = req.query.search || "";
        
        const result = await loadProductService(page, limit, search)

        const successMessage = req.session.successMessage || "" 
        const errorMessage = req.session.errorMessage || ""

        req.session.successMessage = null
        req.session.errorMessage = null

        return res.render("admin/product/product", {
            activePage:"product",
            pageTitle: "Products",
            products: result.products,
            totalProducts: result.totalProducts,
            activeProducts: result.activeProducts,
            inactiveProducts: result.inactiveProducts,
            search,
            currentPage:page,
            totalPages:result.totalPages,
            search,
            successMessage,
            errorMessage
          })
        
    } catch (error) {

        console.log("LOAD PRODUCT ERROR:", error);

        req.session.errorMessage = "Something went wrong.";

        return res.redirect("/admin/dashboard")
        
    }
}

export const loadAddProduct = async (req, res) => {
    try {

        const categories = await Category.find({
            isActive: true
        })

        const successMessage = req.session.successMessage || ""
        const errorMessage = req.session.errorMessage || ""

        req.session.successMessage = null
        req.session.errorMessage = null
        
        return res.render("admin/product/addProduct", {
            activePage: "product",
            pageTitle: "Products",
            categories,
            brands:[],
            formData: {},
            errors: {},
            successMessage,
            errorMessage


        })

    } catch (error) {

        console.log("LOAD ADD PRODUCT ERROR:", error);

        req.session.errorMessage = "Something went wrong"
        return res.redirect("/admin/products")
        
    }
}

export const addProduct = async (req, res) => {
    try {
        
        const result = await addProductService(req)

        const categories = await Category.find({
                isActive: true
            });

        if(!result.success){

            return res.render("admin/product/addProduct", {
                activePage: "product",
                pageTitle: "Products",
                categories,
                brands:[],
                errors: result.errors,
                formData: req.body,
                successMessage:"",
                errorMessage:""
            })
        }



        const successMessage = "Product added successfully. Now add variants."

        return res.redirect(`/admin/products/${result.product._id}/variants`)
        

    } catch (error) {

        console.log("ADD PRODUCT ERROR:", error);

        req.session.errorMessage = "Something went wrong"
        return res.redirect("/admin/products/add")
        
    }
}


export const loadAddVariant = async (req,res) => {
    try {

        const { productId } = req.params

        const product = await Product.findById(productId)
            .populate("categoryId")
            
    
        if(!product){
            req.session.errorMessage = "Product not found."
            return res.redirect("/admin/products")
        }

        const variants = await Variant.find({productId})
        
        const successMessage = req.session.successMessage || ""
        const errorMessage = req.session.errorMessage || ""

        req.session.successMessage = null
        req.session.errorMessage = null

        return res.render("admin/product/addVariant",{
            activePage : "product",
            pageTitle: "Product",
            product,
            variants,
            errors: {},
            formData: {},
            successMessage,
            errorMessage
        })
    } catch (error) {

        console.log("LOAD ADD VARIANT ERROR:", error);

        req.session.errorMessage = "Something went wrong.";
        return res.redirect("/admin/products");
        
    }
}

export const addVariant = async (req, res) => {
    try {
        const result = await addVariantService(req)

        const { productId } =req.params

        if(!result.success){
            const product = await Product.findById(productId)
            const variants = await Variant.find({ productId })

            return res.render("admin/product/addVariant", {
                activePage: "product",
                pageTitle: "Add Variant",
                product,
                variants,
                errors: result.errors,
                formData: req.body,
                successMessage: "",
                errorMessage: ""
            });
        }

        req.session.successMessage = "Variant added successfully.";

        return res.redirect(`/admin/products/${req.params.productId}/variants`)
    } catch (error) {

        console.log("ADD VARIANT ERROR:", error);

        req.session.errorMessage = "Something went wrong."
        return res.redirect(`/admin/products/${req.params.productId}/variants`)
        
    }
}

export const loadEditProduct = async (req,res) => {
    try {
        
        const  productId  = req.params.id
console.log("Product ID:", req.params.id);
        const product = await Product.findById(productId)
console.log(product);
        if(!product){
            req.session.errorMessage = "Product not found.";
            return res.redirect("/admin/products");
        }

        const categories = await Category.find({isActive: true})

        return res.render("admin/product/editProduct", {
            activePage: "product",
            pageTitle: "Edit Product",
            product,
            categories,
            brands:[],
            formData: req.body,
            errors: {},
            successMessage: "",
            errorMessage: ""
        });

    } catch (error) {

        console.log("LOAD EDIT PRODUCT ERROR:", error);

        req.session.errorMessage = "Something went wrong.";
        return res.redirect("/admin/products");
        
    }
}


export const editProduct = async (req,res) => {
    try {
        
        const result = await editProductService(req)

        if(!result.success){
            
            return res.render("admin/product/editProduct", {
                activePage: "product",
                pageTitle: "Product",
                product: result.product,
                categories: result.categories,
                brands: result.brands,
                errors: result.errors,
                formData: req.body,
                successMessage: "",
                errorMessage: ""

            })
        }

        req.session.successMessage =  "Product updated successfully.";

        return res.redirect("/admin/products")

    } catch (error) {
        console.log("EDIT PRODUCT ERROR:", error);

        req.session.errorMessage = "Something went wrong.";

        return res.redirect(`/admin/products/edit/${req.params.id}`);
    }
}


export const deleteProduct = async (req, res) => {
    try {

        const result = await deleteProductService(req);

        if (!result.success) {
            req.session.errorMessage = result.message;
        } else {
            req.session.successMessage = "Product deleted successfully.";
        }

        return res.redirect("/admin/products");

    } catch (error) {

        console.log("DELETE PRODUCT ERROR:", error);

        req.session.errorMessage = "Something went wrong.";

        return res.redirect("/admin/products");
    }
};


export const loadEditVariant = async (req, res) => {
    try {

        const { productId, variantId } = req.params;

        const product = await Product.findById(productId);
        const variant = await Variant.findById(variantId);

        if (!product || !variant) {
            req.session.errorMessage = "Variant not found.";
            return res.redirect(`/admin/products/${productId}/variants`);
        }

        return res.render("admin/product/editVariant", {
            activePage: "product",
            pageTitle: "Edit Variant",
            product,
            variant,
            errors: {},
            formData: req.body,
            successMessage: "",
            errorMessage: ""
        });

    } catch (error) {

        console.log("LOAD EDIT VARIANT ERROR:", error);

        req.session.errorMessage = "Something went wrong.";

        return res.redirect(`/admin/products/${req.params.productId}/variants`);
    }
};


export const editVariant = async (req, res) => {
    try {

        const result = await editVariantService(req);

        if (!result.success) {

            const product = await Product.findById(req.params.productId);

            return res.render("admin/product/editVariant", {
                activePage: "product",
                pageTitle: "Edit Variant",
                product,
                variant: result.variant,
                errors: result.errors,
                formData: req.body,
                successMessage: "",
                errorMessage: ""
            });
        }

        req.session.successMessage = "Variant updated successfully.";

        return res.redirect(`/admin/products/${req.params.productId}/variants`);

    } catch (error) {

        console.log("EDIT VARIANT ERROR:", error);

        req.session.errorMessage = "Something went wrong.";

        return res.redirect(`/admin/products/${req.params.productId}/variants`);
    }
};



export const deleteVariant = async (req, res) => {
    try {

        const result = await deleteVariantService(req);

        if (!result.success) {
            req.session.error = result.message;
            return res.redirect(`/admin/products/${req.params.productId}/variants`);
        }

        req.session.successMessage = "Variant deleted successfully."
        res.redirect(`/admin/products/${req.params.productId}/variants`);

    } catch (error) {
        console.log("DELETE VARIANT ERROR:", error);

        req.session.errorMessage = "Something went wrong.";

        return res.redirect(`/admin/products/${req.params.productId}/variants`);
    }
};