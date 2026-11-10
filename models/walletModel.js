
import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        balance: {
            type: Number,
            default: 0,
            min: 0
        },

        transactions: [
            {
                type: {
                    type: String,
                    enum: ["CREDIT", "DEBIT"],
                    required: true
                },

                amount: {
                    type: Number,
                    required: true
                },

                description: {
                    type: String,
                    required: true
                },

                status: {
                    type: String,
                    enum: ["SUCCESS", "PENDING", "FAILED"],
                    default: "SUCCESS"
                },

                date: {
                    type: Date,
                    default: Date.now
                }
            }
        ]
    },
    {
        timestamps: true
    }
);

const Wallet = mongoose.model("Wallet", walletSchema);

export default Wallet;
