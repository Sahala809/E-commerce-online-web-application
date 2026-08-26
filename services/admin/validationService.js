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

    const name = categoryName?.trim();

    const categoryNameRegex = /^[A-Za-z ]+$/;

    if (!name) {
        errors.categoryName = "Name is required";
    } else if (!categoryNameRegex.test(name)) {
        errors.categoryName = "Name should contain only letters";
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

    const name = productName?.trim()

    if(!name){
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

        errors.color = "Color is required.";

    } else if (!/[A-Za-z]/.test(color.trim())) {

        errors.color = "Please enter a valid color.";

    }

    
          ////////

    if (stock === undefined || stock === "") {

        errors.stock = "Stock is required.";

    } else if (Number(stock) < 0) {

        errors.stock = "Stock cannot be negative.";

    } else if (!Number.isInteger(Number(stock))) {

        errors.stock = "Stock must be a valid number.";

    }
                            
                //////////

    if (price === undefined || price === "") {

        errors.price = "Price is required.";

    } else if (Number(price) <= 0) {

        errors.price = "Price must be greater than 0.";

    } else if (isNaN(Number(price))) {

        errors.price = "Price must be a valid number.";

    }
            //////////

    if (offerPrice !== undefined && offerPrice !== "") {

        if (Number(offerPrice) < 0) {

            errors.offerPrice =
                "Offer price cannot be negative.";

        } else if (
            Number(offerPrice) >= Number(price)
        ) {

            errors.offerPrice =
                "Offer price must be less than the regular price.";

        }

    }


    if (!description || description.trim() === "") {

        errors.description = "Description is required";

    }

    ///////////

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

    } else if (Number.isNaN(Number(stock))) {

        errors.stock = "Stock must be a valid number";

    } else if (Number(stock) < 0) {

        errors.stock = "Stock cannot be negative";

    }


    if (price === undefined || price === "") {

        errors.price = "Price is required";

    } else if (Number.isNaN(Number(price))) {

        errors.price = "Price must be a valid number";

    } else if (Number(price) <= 0) {

        errors.price = "Price must be greater than zero";

    }


    if (offerPrice !== undefined && offerPrice !== "") {

        if (Number.isNaN(Number(offerPrice))) {

            errors.offerPrice = "Offer price must be a valid number";

        } else if (Number(offerPrice) <= 0) {

            errors.offerPrice = "Offer price must be greater than zero";

        } else if (
            price !== undefined &&
            price !== "" &&
            Number(offerPrice) >= Number(price)
        ) {

            errors.offerPrice =
                "Offer price must be less than price";

        }
    }


    if (!description || description.trim() === "") {
        errors.description = "Description is required";
    }


    return errors;
};







