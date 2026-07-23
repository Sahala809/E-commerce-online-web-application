import {
    adminLoginService
} from "../services/admin/adminService.js";

export const loadAdminLogin = async (req, res) => {

    try {

         return res.render("admin/auth/login", {
            error: null,
            formData: {}
    });

    } catch (err) {

        console.log("LOAD ADMIN LOGIN ERROR:", err);

        return res.redirect("/admin/login");

    }

};

export const adminLogin = async (req, res) => {
console.log("POST /admin/login");
    try {

        await adminLoginService(req, res);

    } catch (err) {

        console.log("ADMIN LOGIN ERROR:", err);

        return res.render("admin/auth/login", {
            error: {
                general: "Something went wrong."
            },
            formData: req.body
        });

    }

};

export const loadDashboard = async (req, res) => {

    try {

        return res.render("admin/dashboard", {
        admin: req.session.admin
    });


    } catch (err) {

        console.log("LOAD DASHBOARD ERROR:", err);

        return res.redirect("/admin/login");

    }

};

export const adminLogout = async (req, res) => {

    try {

        delete req.session.admin;

        await req.session.save();

        return res.redirect("/admin/login");

    } catch (err) {

        console.log("ADMIN LOGOUT ERROR:", err);

        return res.redirect("/admin/dashboard");

    }

};