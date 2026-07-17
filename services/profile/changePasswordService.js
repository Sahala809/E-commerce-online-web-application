import bcrypt from "bcrypt";
import User from "../../models/userModel.js";

export const changePasswordService = async (
    userId,
    currentPassword,
    newPassword,
    confirmPassword
) => {

    // Check empty fields
    if (!currentPassword || !newPassword || !confirmPassword) {
        throw new Error("Please fill all fields.");
    }

    // New & Confirm Password match
    if (newPassword !== confirmPassword) {
        throw new Error("New password and confirm password do not match.");
    }

    // Find user
    const user = await User.findById(userId);

    if (!user) {
        throw new Error("User not found.");
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
        throw new Error("Current password is incorrect.");
    }

    // Prevent same password
    const isOldPassword = await bcrypt.compare(newPassword, user.password);

    if (isOldPassword) {
        throw new Error("New password must be different from the current password.");
    }

    // Password strength
    const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!passwordRegex.test(newPassword)) {
        throw new Error(
            "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character."
        );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Save
    user.password = hashedPassword;

    await user.save();

    return true;

};