export const validateAdminLogin = (data) => {

    const error = {};

    const { email, password } = data;

    if (!email || email.trim() === "") {

        error.email = "Email is required.";

    } else if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {

        error.email = "Please enter a valid email address.";

    }


    if (!password || password.trim() === "") {

        error.password = "Password is required.";

    }

    return error;

};