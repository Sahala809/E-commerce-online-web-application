import bcrypt from "bcrypt";

import User from "../../models/userModel.js";

import { validateLogin } from "./validationService.js";

export const loginService = async (req, res) => {
    console.log("Login request:", req.body);
    const error = validateLogin(req.body);

    if (Object.keys(error).length > 0) {

        return res.render("user/auth/login", {
            error,
            formData: req.body
        });

    }

    const { email, password } = req.body;

    const user = await User.findOne({
        email: email.trim().toLowerCase()
    });

    console.log("User:", user);

    if (!user) {

    return res.render("user/auth/login", {
        error: {
                general: "Invalid email or password."
            },
            formData: req.body
        });

    }

    if (user.isBlocked) {

    return res.render("user/auth/login", {
            error: {
                general: "Your account has been blocked."
            },
            formData: req.body
        });

    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password match:", isMatch);
    if (!isMatch) {

        return res.render("user/auth/login", {
            error: {
                general: "Invalid email or password."
            },
            formData: req.body
        });

    }

    req.session.user = user._id;

    await req.session.save();

    return res.redirect("/user/home");
};