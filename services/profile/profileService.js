import User from "../../models/userModel.js";
import { validateProfile } from "./validationService.js"


export const editProfileService = async (req, res) => {

    const error = validateProfile(req, res);

    if (Object.keys(error).length > 0) {

        const user = await User.findById(req.session.user);

        return res.render("user/profile/myProfile", {
            user,
            formData: req.body,
            error,
            activePage: "profile",
            success:null
        });

    }   

    const { name, phone } = req.body;

    const existingPhone = await User.findOne({ 
        phone,
        _id: { $ne: req.session.user }
    });

    if (existingPhone) {

        const user = await User.findById(req.session.user);

        return res.render("user/profile/myProfile", {
            user,
            formData: req.body,
            error: {
                phone: "Phone number already exists."
            },
            activePage: "profile",
            success: null
        });

    }
    
    const user = await User.findById(req.session.user);
    
    user.name = name.trim();
    user.phone = phone.trim();

    await user.save();

    req.session.success = "Profile updated successfully.";
    
     return res.redirect("/user/profile");
};