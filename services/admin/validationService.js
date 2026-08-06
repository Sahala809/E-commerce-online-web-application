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


export const validateAddProduct = (data) => {

    const errors = {}

    const {
        productName,
        description,
        categoryId
    } = data

    if(!productName || !productName.trim()){
        errors.productName = "Product name is required";
    }

    if (!description || !description.trim()) {
        errors.description = "Description is required";
    }

    if (!categoryId) {
        errors.categoryId = "Category is required";
    }

    return errors
}

export const validateAddVariant = (data, files) => {
    
    const errors = {};

    const {
        color,
        stock,
        price,
        description,
        offerPrice
    } = data;

    if (!color || !color.trim()) {
        errors.color = "Color is required";
    }

    if (!stock || stock <= 0) {
        errors.stock = "Stock must be greater than 0";
    }

    if (!price || price <= 0) {
        errors.price = "Price is required";
    }

    if (offerPrice && Number(offerPrice) > Number(price)) {
        errors.offerPrice = "Offer price cannot be greater than price";
    }

    if (!files || files.length === 0) {
        errors.images = "At least one image is required";
    }

    return errors
}


export const validateEditVariant = (data) => {
    const errors = {};

    const {
        color,
        stock,
        price,
        offerPrice,
        description
    } = data;


    if (!color || color.trim() === "") {
        errors.color = "Color is required";
    }

    if (stock === undefined || stock === "") {
        errors.stock = "Stock is required";
    } else if (Number(stock) < 0) {
        errors.stock = "Stock cannot be negative";
    }

    if (!price || price === "") {
        errors.price = "Price is required";
    } else if (Number(price) <= 0) {
        errors.price = "Price must be greater than zero";
    }

    if (offerPrice && Number(offerPrice) >= Number(price)) {
        errors.offerPrice = "Offer price must be less than price";
    }

    if (!description || description.trim() === "") {
        errors.description = "Description is required";
    }


    return errors;
};