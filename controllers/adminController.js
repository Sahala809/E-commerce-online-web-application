import Address from "../models/addressModel.js";
import User from "../models/userModel.js";
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
    addCategoryService
} from "../services/admin/categoryService.js"
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

        if(!result.success){
            return  res.render('admin/dashboard',{

                activePage: "dashboard",
                pageTitle: "Dashboard",
                totalUsers:0,
                totalProducts:0,
                totalOrders: 0,
                totalRevenue:0 ,
                message: result.message

            })
        }

        return res.render('admin/dashboard', {
            activePage: "dashboard",
            pageTitle: "Dashboard",
            totalUsers: result.totalUsers,
            totalProducts:result.totalProducts,
            totalOrders: result.totalOrders,
            totalRevenue:result.totalRevenue,
            message: ""
        })
        
    } catch (error) {
        console.log("LOAD DASHBOARD ERROR:", error);

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
        const result = await loadCategoryService()

        const message = req.session.message;
        req.session.message = null;

        return res.render("admin/category/category", {
            activePage: "category",
            pageTitle: "Category",
            categories: result.categories,
            currentPage:1,
            totalPages:1,
            search:"",
            message

        })
    } catch (error) {
        console.log(error)

        return res.render("admin/category/category", {
            activePage: "category",
            categories: [],
            currentPage:1,
            totalPages:1,
            search:"",
            message:"something went wrong"

        })
        
    }
    
}

export const loadAddCategory = (req,res) =>{
    return res.render('admin/category/addCategory', {
        activePage: "Category",
        pageTitle: "Add Category",
        message:"",
        errors: {},
        formData: {},

    })
}

export const addCategory = async(req,res) => {
    try {
        const result = await addCategoryService(req, res)

        if(!result.success){
            return res.render("admin/category/addCategory", {
                activePage: "category",
                pageTitle : "Add Category",
                message: result.message,
                errors: result.errors,
                formData: req.body
            })
        }

        req.session.message = "Category added successfully";

        return res.redirect("/admin/category")
        
    } catch (error) {
        console.log("ADD CATEGORY ERROR:", error)

        return res.render("admin/category/addCategory", {
            activePage: "category",
            pageTitle: "Add Category",
            message: "Something went wrong",
            errors: {},
            formData: req.body
        });
        
    }
} 


