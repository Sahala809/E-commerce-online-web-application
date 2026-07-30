export const validateAdminLogin = (data) => {

    const errors = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    const { email, password } = data;

    if (!email || email.trim() === "") {

         errors.email = "Email is required";

    } 

    if (!password || password.trim() === "") {
        
        errors.password = "Password is required";

    }

    return {
        success: Object.keys(errors).length === 0,
        errors
    };

};