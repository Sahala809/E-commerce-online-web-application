import User from "../../models/userModel.js";
import { validateProfile } from "./validationService.js"


export const editProfileService = async (userId, data) => {

    const error = validateProfile(req.body);

    if (Object.keys(error).length > 0) {

        const user = await User.findById(req.session.user);

        return res.render("user/profile/myProfile", {
            user,
            error
        });

    }   

    const { name, phone } = data;

    const existingPhone = await User.findOne({ 
        phone,
        _id: { $ne: req.session.user }
    });

    if (existingPhone) {

        const user = await User.findById(req.session.user);

        return res.render("user/profile/myProfile", {
            user,
            error: {
                phone: "Phone number already exists."
            }
        });

    }
    
    user.name = name.trim();
    user.phone = phone.trim();

    await user.save();

     return res.redirect("/user/profile");
};