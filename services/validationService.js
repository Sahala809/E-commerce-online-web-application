export const validateSignup = ({ name, email, phone, password, confirmPassword }) => {
    
    if( !name || name.trim() === ""){
        return "Name is required.";
    }

    if (name.trim().length < 3) {
        return "Name must be at least 3 characters.";
    }

    const nameRegex = /^[A-Za-z ]+$/;

     if (!nameRegex.test(name.trim())) {
        return "Name can contain only letters and spaces.";
    }

    if(!email || email.trim() === ""){
        return "Email is required.";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if( !emailRegex.test(email.trim()) ) {
        return "Invalid email address"
    }

    if (!phone || phone.trim() === "") {
        return "Phone number is required.";
    }

    const phoneRegex = /^[6-9]\d{9}$/;

    if( !phoneRegex.test(phone.trim())){
        return "Invalid phone number"
    }

    if (!password) {
        return "Password is required.";
    }


    const passwordRegex=  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if(!passwordRegex.test(password)){
       return "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character.";
    }

    if (!confirmPassword) {
        return "Confirm password is required.";
    }
        
    if (password !== confirmPassword) {
        return "Passwords do not match.";
    }

    return null
}


export const validateLogin = ({ email, password }) => {

    // Email
    if (!email || email.trim() === "") {
        return "Email is required.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
        return "Please enter a valid email address.";
    }

    // Password
    if (!password) {
        return "Password is required.";
    }

    return null;
};