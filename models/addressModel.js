import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({

    userId: {

        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true

    },

    addresses: [

        {

            fullName: {

                type: String,
                required: true

            },

            phone: {

                type: String,
                required: true

            },

            houseName: {

                type: String,
                required: true

            },

            street: {

                type: String,
                required: true

            },

            district: {

                type: String,
                required: true

            },

            city: {

                type: String,
                required: true

            },

            state: {

                type: String,
                required: true

            },

            country: {

                type: String,
                required: true

            },

            pincode: {

                type: String,
                required: true

            },

            isDefault: {

                type: Boolean,
                default: false

            }

        }

    ]

}, {

    timestamps: true

});

const Address = mongoose.model("Address", addressSchema);

export default Address;