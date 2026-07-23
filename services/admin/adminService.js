import bcrypt from "bcrypt";

import Admin from "../../models/adminModel.js";

import { validateAdminLogin } from "./validationService.js";

export const adminLoginService = async (req, res) => {
    console.log("BODY:", req.body);

    const error = validateAdminLogin(req.body);

    if (Object.keys(error).length > 0) {

        return res.render("admin/auth/login", {
            error,
            formData: req.body
        });

    }

    const { email, password } = req.body;

    const admin = await Admin.findOne({
        email: email.trim().toLowerCase()
    });
console.log("ADMIN:", admin);
    if (!admin) {

        return res.render("admin/auth/login", {
            error: {
                general: "Invalid email or password."
            },
            formData: req.body
        });

    }

    const isMatch = password === admin.password;
console.log("PASSWORD MATCH:", isMatch);
    if (!isMatch) {

        return res.render("admin/auth/login", {
            error: {
                general: "Invalid email or password."
            },
            formData: req.body
        });

    }

    req.session.admin = admin._id;

    await req.session.save();

    return res.redirect("/admin/dashboard");

};