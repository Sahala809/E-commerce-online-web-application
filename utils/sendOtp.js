import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendOtp = async (email, otp) => {

    try {

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Chronix Email Verification",
            html: `
                <h2>Email Verification</h2>

                <p>Your OTP is:</p>

                <h1 style="letter-spacing:5px;">
                    ${otp}
                </h1>

                <p>This OTP is valid for <b>5 minutes</b>.</p>
            `
        });

        console.log("✅ OTP Email Sent");

    } catch (error) {

        console.log("SMTP ERROR:", error);

        // During development, print OTP to terminal
        console.log("\n===========================");
        console.log("EMAIL :", email);
        console.log("OTP   :", otp);
        console.log("===========================\n");
    }

};

export default sendOtp;