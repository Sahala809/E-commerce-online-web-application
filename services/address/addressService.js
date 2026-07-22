import Address from "../../models/addressModel.js"
import { validateAddress } from "./validationService.js";

export const addAddressService = async (req, res) => {

    const error = validateAddress(req);

    if (Object.keys(error).length > 0) {

        return res.render("user/address/addAddress", {
            error,
            formData: req.body,
            activePage: "address"
        });

    }

    const {
        fullName,
        phone,
        houseName,
        street,
        district,
        city,
        state,
        country,
        pincode,
        isDefault
    } = req.body;

    const newAddress = {
        fullName,
        phone,
        houseName,
        street,
        district,
        city,
        state,
        country,
        pincode,
        isDefault: isDefault === "on"
    };


    let userAddresses = await Address.findOne({
        userId: req.session.user
    });

    if (!userAddresses) {

        userAddresses = new Address({
            userId: req.session.user,
            addresses: [newAddress]
        });

    } else {

        if (newAddress.isDefault) {

            userAddresses.addresses.forEach(address => {
                address.isDefault = false;
            });

        }

        if (
            userAddresses.addresses.length === 0 ||
            !userAddresses.addresses.some(address => address.isDefault)
        ) {

            newAddress.isDefault = true;

        }

        userAddresses.addresses.push(newAddress);

    }

    await userAddresses.save();

    req.session.success = "Address added successfully.";

    return res.redirect("/user/address");

};

export const editAddressService = async (req, res) => {

    const { id } = req.params;

    const error = validateAddress(req);

    const userAddresses = await Address.findOne({
        userId: req.session.user
    });

    if (!userAddresses) {

        return res.redirect("/user/address");

    }

    const address = userAddresses.addresses.id(id);

    if (!address) {

        return res.redirect("/user/address");

    }

    if (Object.keys(error).length > 0) {

        return res.render("user/address/editAddress", {
            address,
            formData: req.body,
            error,
            activePage: "address"
        });

    }

    address.fullName = req.body.fullName.trim();
    address.phone = req.body.phone.trim();
    address.houseName = req.body.houseName.trim();
    address.street = req.body.street.trim();
    address.district = req.body.district.trim();
    address.city = req.body.city.trim();
    address.state = req.body.state.trim();
    address.country = req.body.country.trim();
    address.pincode = req.body.pincode.trim();

    if (req.body.isDefault === "on") {

        userAddresses.addresses.forEach(item => {
            item.isDefault = false;
        });

        address.isDefault = true;

    }

    await userAddresses.save();

    req.session.success = "Address updated successfully.";

    return res.redirect("/user/address");

};



export const deleteAddressService = async (req, res) => {

    const { id } = req.params;

    const userAddresses = await Address.findOne({
        userId: req.session.user
    });

    if (!userAddresses) {

        return res.redirect("/user/address");

    }

    userAddresses.addresses.pull(id);

    // Make another address default if the deleted one was the default
    if (
        userAddresses.addresses.length > 0 &&
        !userAddresses.addresses.some(address => address.isDefault)
    ) {

        userAddresses.addresses[0].isDefault = true;

    }

    await userAddresses.save();

    req.session.success = "Address deleted successfully.";

    return res.redirect("/user/address");

};


export const setDefaultAddressService = async (req, res) => {

    const { id } = req.params;

    const userAddresses = await Address.findOne({
        userId: req.session.user
    });

    if (!userAddresses) {

        return res.redirect("/user/address");

    }

    // Remove existing default
    userAddresses.addresses.forEach(address => {

        address.isDefault = false;

    });

    // Set selected address as default
    const selectedAddress = userAddresses.addresses.id(id);

    if (!selectedAddress) {

        return res.redirect("/user/address");

    }

    selectedAddress.isDefault = true;

    await userAddresses.save();

    req.session.success = "Default address updated successfully.";

    return res.redirect("/user/address");

};