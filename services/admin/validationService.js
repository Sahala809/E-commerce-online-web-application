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




export const validateCoupon = (data) => {
    const errors = {};

    const {
        couponCode,
        discount,
        couponType,
        maxDiscountAmount,
        expDate,
        minimumPurchase,
        usageLimit,
        perUserUsageLimit,
        isPublic,
        userId
    } = data;

    if (!couponCode || !couponCode.trim()) {
        errors.couponCode = "Coupon code is required";
    } else if (!/^[A-Za-z0-9_-]+$/.test(couponCode.trim())) {
        errors.couponCode = "Use only letters, numbers, hyphens or underscores";
    }

    if (discount === "" || discount === undefined || Number.isNaN(Number(discount))) {
        errors.discount = "Valid discount is required";
    } else if (Number(discount) <= 0) {
        errors.discount = "Discount must be greater than zero";
    } else if (
        couponType === "PERCENTAGE" &&
        Number(discount) > 100
    ) {
        errors.discount = "Percentage discount cannot exceed 100";
    }

    if (!["FIXED", "PERCENTAGE"].includes(couponType)) {
        errors.couponType = "Select a valid coupon type";
    }

    if (!expDate || Number.isNaN(new Date(expDate).getTime())) {
        errors.expDate = "A valid expiry date is required";
    }

    if (
        minimumPurchase !== "" &&
        minimumPurchase !== undefined &&
        (!Number.isFinite(Number(minimumPurchase)) ||
            Number(minimumPurchase) < 0)
    ) {
        errors.minimumPurchase = "Minimum purchase cannot be negative";
    }

    if (
        usageLimit === "" ||
        usageLimit === undefined ||
        !Number.isInteger(Number(usageLimit)) ||
        Number(usageLimit) <= 0
    ) {
        errors.usageLimit = "Usage limit must be a positive whole number";
    }

    if (
        perUserUsageLimit === "" ||
        perUserUsageLimit === undefined ||
        !Number.isInteger(Number(perUserUsageLimit)) ||
        Number(perUserUsageLimit) <= 0
    ) {
        errors.perUserUsageLimit = "Per-user usage limit must be a positive whole number";
    }

    if (
        maxDiscountAmount !== "" &&
        maxDiscountAmount !== undefined &&
        maxDiscountAmount !== null &&
        (!Number.isFinite(Number(maxDiscountAmount)) ||
            Number(maxDiscountAmount) <= 0)
    ) {
        errors.maxDiscountAmount = "Maximum discount must be greater than zero";
    }

    if (
        (isPublic === false || isPublic === "false") &&
        !userId
    ) {
        errors.userId = "Select a user for a private coupon";
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};




