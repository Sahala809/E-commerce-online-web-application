export const validateAddress = (req) => {

    const {
        fullName,
        phone,
        houseName,
        street,
        district,
        city,
        state,
        country,
        pincode
    } = req.body;

    const error = {};

    // Full Name
    const nameRegex = /^[A-Za-z ]+$/;

    if (!fullName || fullName.trim() === "") {

        error.fullName = "Full name is required.";

    } else if (fullName.trim().length < 3) {

        error.fullName = "Full name must be at least 3 characters.";

    } else if (!nameRegex.test(fullName.trim())) {

        error.fullName = "Full name can contain only letters and spaces.";

    }

    // Phone
    const phoneRegex = /^[6-9]\d{9}$/;

    if (!phone || phone.trim() === "") {

        error.phone = "Phone number is required.";

    } else if (!phoneRegex.test(phone.trim())) {

        error.phone = "Invalid phone number.";

    }

    // House Name
    if (!houseName || houseName.trim() === "") {

        error.houseName = "House name is required.";

    }

    // Street
    if (!street || street.trim() === "") {

        error.street = "Street is required.";

    }

    // District
    if (!district || district.trim() === "") {

        error.district = "District is required.";

    }

    // City
    if (!city || city.trim() === "") {

        error.city = "City is required.";

    }

    // State
    if (!state || state.trim() === "") {

        error.state = "State is required.";

    }

    // Country
    if (!country || country.trim() === "") {

        error.country = "Country is required.";

    }

    // Pincode
    const pincodeRegex = /^\d{6}$/;

    if (!pincode || pincode.trim() === "") {

        error.pincode = "Pincode is required.";

    } else if (!pincodeRegex.test(pincode.trim())) {

        error.pincode = "Pincode must be 6 digits.";

    }

    return error;

};