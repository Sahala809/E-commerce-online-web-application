import { 
    adminLoginService
} from "../../services/admin/adminAuthService.js";


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



export const adminLogout = async (req, res) => {

    try {

        delete req.session.admin;

       
        return res.redirect("/admin/login");

    } catch (err) {

        console.log("ADMIN LOGOUT ERROR:", err);

        return res.redirect("/admin/dashboard");

    }

};


