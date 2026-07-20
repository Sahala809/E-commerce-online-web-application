export const validateProfile = (data) => {

    const { name, phone } = data;

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