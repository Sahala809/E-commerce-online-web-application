import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {   
        googleId: {
            type: String,
            default: ""
        },
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        phone: {
            type: String,
            unique: true,
            sparse: true
        },

        password: {
            type: String,
            default: ""
        },

        referralCode: {
            type: String,
            default: ""
        },

        profileImage: {
            type: String,
            default: ""
        },

        isVerified: {
            type: Boolean,
            default: false
        },

        isBlocked: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

const User = mongoose.model("User", userSchema);

export default User;