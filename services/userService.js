import User from "../models/userModel.js";

export const checkUserExists = async (email, phone) => {

    const existingEmail = await User.findOne({ email });

    if (existingEmail) {
        return "Email already exists.";
    }

    const existingPhone = await User.findOne({ phone });

    if (existingPhone) {
        return "Phone number already exists.";
    }

    return null;
};

export const getUserByEmail = async (email) => {
    return await User.findOne({ email });
};