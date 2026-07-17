import User from "../../models/userModel.js";
import generateOtp from "../../utils/generateOtp.js";
import sendOtp from "../../utils/sendOtp.js";

export const changeEmailOtpService = async (newEmail) => {

    // Check if email is already registered
    const existingUser = await User.findOne({
        email: newEmail.toLowerCase().trim()
    });

    if (existingUser) {
        throw new Error("Email already exists.");
    }

    // Generate OTP
    const otp = generateOtp();

    // Send OTP to the new email
    await sendOtp(newEmail, otp);

    return otp;

};


export const verifyChangeEmailOtpService = async (
    userId,
    enteredOtp,
    sessionData
) => {

    if (!sessionData) {
        throw new Error("OTP expired. Please try again.");
    }

    if (enteredOtp !== sessionData.otp) {
        throw new Error("Invalid OTP.");
    }

    const user = await User.findById(userId);

    if (!user) {
        throw new Error("User not found.");
    }

    user.email = sessionData.email;

    await user.save();

    return true;

};