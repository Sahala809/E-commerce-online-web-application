import Wallet from "../../models/walletModel.js";

// GET OR CREATE WALLET
export const createWallet = async (userId) => {
    return await Wallet.findOneAndUpdate(
        { userId },
        {
            $setOnInsert: {
                userId,
                balance: 0,
                transactions: []
            }
        },
        {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true
        }
    );
};

// GET WALLET
export const getWallet = async (userId) => {
    return await getOrCreateWallet(userId);
};

// CREDIT WALLET
export const creditWallet = async (userId, amount, description) => {
    amount = Number(amount);

    if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Invalid credit amount");
    }

    const wallet = await Wallet.findOneAndUpdate(
        { userId },
        {
            $setOnInsert: { userId },
            $inc: { balance: amount },
            $push: {
                transactions: {
                    type: "CREDIT",
                    amount,
                    description,
                    status: "SUCCESS",
                    date: new Date()
                }
            }
        },
        {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true
        }
    );

    return wallet;
};

// DEBIT WALLET
export const debitWallet = async (userId, amount, description) => {
    amount = Number(amount);

    if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Invalid debit amount");
    }

    const wallet = await Wallet.findOneAndUpdate(
        {
            userId,
            balance: { $gte: amount }
        },
        {
            $inc: { balance: -amount },
            $push: {
                transactions: {
                    type: "DEBIT",
                    amount,
                    description,
                    status: "SUCCESS",
                    date: new Date()
                }
            }
        },
        { new: true }
    );

    if (!wallet) {
        throw new Error("Insufficient wallet balance");
    }

    return wallet;
};