import User from "../../models/userModel.js";

export const getMyProfile = async (userId) => {
    return await User.findById(userId);
};

export const updateMyProfile = async (userId, data) => {
    const { name, phone } = data;

    const user = await User.findById(userId);

    if (!user) {
        throw new Error("User not found.");
    }

    if (!name || name.trim() === "") {
        throw new Error("Name is required.");
    }

    if (name.trim().length < 3) {
        throw new Error("Name must be at least 3 characters.");
    }

    const phoneRegex = /^[6-9]\d{9}$/;

    if (!phoneRegex.test(phone.trim())) {
        throw new Error("Invalid phone number.");
    }

    if (
        user.name === data.name &&
        user.phone === data.phone
    ) {
        throw new Error("No changes were made.");
    }

    user.name = name.trim();
    user.phone = phone.trim();

    await user.save();

    return user;
};