export const validateProfile = (req, res) => {

    const { name, phone } = req.body;

    const error = {};

    const nameRegex = /^[A-Za-z ]+$/;

    if (!name || name.trim() === "") {

        error.name = "Name is required.";

    } else if (name.trim().length < 3) {

        error.name = "Name must be at least 3 characters.";

    } else if (!nameRegex.test(name.trim())) {

        error.name = "Name can contain only letters and spaces.";

    }

    const phoneRegex = /^[6-9]\d{9}$/;

    if (!phone || phone.trim() === "") {

        error.phone = "Phone number is required.";

    } else if (!phoneRegex.test(phone.trim())) {

        error.phone = "Invalid phone number.";

    }

    return error;

};

export const validateChangePassword = (req,res) => {

    const { currentPassword, newPassword, confirmPassword } = req.body;

    const error = {};

    if (!currentPassword) {
        error.currentPassword = "Current password is required.";
    }

    const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if (!newPassword) {

        error.newPassword = "New password is required.";

    } else if (!passwordRegex.test(newPassword)) {

        error.newPassword =
            "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character.";

    }

    if (!confirmPassword) {

        error.confirmPassword = "Confirm password is required.";

    } else if (newPassword !== confirmPassword) {

        error.confirmPassword = "Passwords do not match.";

    }

    return error;

};

export const validateChangeEmail = (req, res) => {

    const { email } = req.body;

    const error = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || email.trim() === "") {

        error.email = "Email is required.";

    } else if (!emailRegex.test(email.trim())) {

        error.email = "Please enter a valid email address.";

    }

    return error;

};


