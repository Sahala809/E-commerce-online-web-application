import bcrypt from "bcrypt";

import User from "../../models/userModel.js";

import { validateLogin } from "./validationService.js";

export const loginService = async (req, res) => {

    const errors = validateLogin(req.body);

    if (Object.keys(errors).length > 0) {

        return  {
            success: false,
            errors,
            formData: req.body
        }

    }

    const { email, password } = req.body;

    const user = await User.findOne({
        email: email.trim().toLowerCase()
    }).lean();

    console.log("User:", user);

    if (!user) {
        req.session.errorMessage =  "Invalid email or password."
        return {
            success:false,
            errors:{},
            formData: req.body
        }

    }

    if (user.isBlocked) {
        req.session.errorMessage = "Your account has been blocked."
        return {
            success:false,
            errors:{},
            formData: req.body
        };

    }

    const isMatch = await bcrypt.compare(password, user.password);
    
    console.log("Password match:", isMatch);

    if (!isMatch) {
        req.session.errorMessage =  "Invalid email or password."

        return {
            success: false,
            errors: {},
            formData: req.body
        }

    }

    req.session.user = user._id;

    await req.session.save();

    return {
        success:true
    }
};