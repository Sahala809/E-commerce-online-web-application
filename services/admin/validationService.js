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

export const validateAddCategory = (data) => {
    const errors = {};

    const { categoryName, description } = data;

    const categoryNameRegex = /^[A-Za-z ]+$/;

    if (!categoryName || categoryName.trim() === "") {
        errors.categoryName = "Category name is required";
    } else if (!categoryNameRegex.test(categoryName.trim())) {
        errors.categoryName = "Category name should contain only letters";
    }

    if (!description || description.trim() === "") {
        errors.description = "Description is required";
    }

    return errors
}