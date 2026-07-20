import { error } from "console";

export const validateSignup = (data) => {

    const { name, email, phone, password, confirmPassword } = data;

    const error = {};

    const nameRegex = /^[A-Za-z ]+$/;

    if (!name || name.trim() === "") {
        error.name = "Name is required.";
    } else if (name.trim().length < 3) {
        error.name = "Name must be at least 3 characters.";
    } else if (!nameRegex.test(name)) {
        error.name = "Name can contain only letters and spaces.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || email.trim() === "") {
        error.email = "Email is required.";
    } else if (!emailRegex.test(email.trim())) {
        error.email = "Invalid email address.";
    }

    const phoneRegex = /^[6-9]\d{9}$/;

    if (!phone || phone.trim() === "") {
        error.phone = "Phone number is required.";
    } else if (!phoneRegex.test(phone.trim())) {
        error.phone = "Invalid phone number.";
    }

    const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if (!password) {
        error.password = "Password is required.";
    } else if (!passwordRegex.test(password)) {
        error.password =
            "Password must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character.";
    }

    if (!confirmPassword) {
        error.confirmPassword = "Confirm password is required.";
    } else if (password !== confirmPassword) {
        error.confirmPassword = "Passwords do not match.";
    }

    return error;
};

export const validateLogin = (data) => {

    const { email, password } = data;

    const error = {};

    if (!email || email.trim() === "") {
        error.email = "Email is required.";
    }

    if (!password) {
        error.password = "Password is required.";
    }

    return error;
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