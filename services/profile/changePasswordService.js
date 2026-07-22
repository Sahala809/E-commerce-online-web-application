import bcrypt from "bcrypt";
import User from "../../models/userModel.js";

import { validateChangePassword } from "./validationService.js";

export const changePasswordService = async (req, res) => {

    const error = validateChangePassword(req, res);
console.log(req.body);
    if (Object.keys(error).length > 0) {

        return res.render("user/profile/changePassword", {
            error,
            formData: req.body,
            success: null,
            activePage: "changePassword"
        });

    }
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.session.user);

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {

        return res.render("user/profile/changePassword", {
            error: {
                currentPassword: "Current password is incorrect."
            },
            formData: req.body,
            success: null,
            activePage: "changePassword"
        });

    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);

    if (isSamePassword) {

        return res.render("user/profile/changePassword", {
            error: {
                newPassword: "New password cannot be the same as the current password."
            },
            formData: req.body,
            success: null,
            activePage: "changePassword"
        });

    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;

    await user.save();

    req.session.success = "Password changed successfully.";

    return res.redirect("/user/profile")

};