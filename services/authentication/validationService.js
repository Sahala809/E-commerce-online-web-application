

export const validateSignup = (data) => {

    
    const name = data.name?.trim();
    const email = data.email?.trim().toLowerCase();
    const phone = data.phone?.trim();
    const password = data.password;
    const confirmPassword = data.confirmPassword;

    const errors = {};

    const nameRegex = /^[A-Za-z ]+$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[6-9]\d{9}$/;
    const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if (!name) {
        errors.name = "Name is required.";
    } else if (name.length < 3) {
        errors.name = "Name must be at least 3 characters.";
    } else if (!nameRegex.test(name)) {
        errors.name = "Name can contain only letters and spaces.";
    }

    
    if (!email) {
        errors.email = "Email is required.";
    } else if (!emailRegex.test(email)) {
        errors.email = "Invalid email address.";
    }

   

    if (!phone) {
        errors.phone = "Phone number is required.";
    } else if (!phoneRegex.test(phone)) {
        errors.phone = "Invalid phone number.";
    }

    
    if (!password) {
        errors.password = "Password is required.";
    } else if (!passwordRegex.test(password)) {
        errors.password =
            "Password must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character.";
    }

    if (!confirmPassword) {
        errors.confirmPassword = "Confirm password is required.";
    } else if (password !== confirmPassword) {
        errors.confirmPassword = "Passwords do not match.";
    }

    return errors;
};

export const validateLogin = (data) => {

    const { email, password } = data;

    const errors = {};

    if (!email || email.trim() === "") {
        errors.email = "Email is required.";
    }

    if (!password) {
        errors.password = "Password is required.";
    }

    return errors;
};

export const validateForgotPassword = (data) => {

    const { email } = data;

    const error = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || email.trim() === "") {
    
        error.email = "Email is required."

    } else if (!emailRegex.test(email.trim())) {
        
        error.email = "Please enter a valid email address."
    }

    return error;
};

export const validateResetPassword = (data) => {

    const { password, confirmPassword } = data;

    const error = {};

    const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if (!password) {

        error.password = "Password is required.";

    } else if (!passwordRegex.test(password)) {

        error.password =
            "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character.";

    }

    if (!confirmPassword) {

        error.confirmPassword =
            "Confirm password is required.";

    } else if (password !== confirmPassword) {

        error.confirmPassword =
            "Passwords do not match.";

    }

    return error;

};