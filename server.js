import "dotenv/config"

import express from "express"
import path from "path"
import { fileURLToPath } from "url"
import session from "express-session"
import passport from "passport";
import nocache from "nocache";

import connectDB from "./config/db.js";
import "./config/passport.js";


import userRoutes from "./routes/userRoutes.js"
import { sendOtp } from "./utils/sendOtp.js";

console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "Loaded" : "Missing");

// Connect Database
connectDB();

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 10
        }
    })
);




app.use(passport.initialize());
app.use(passport.session());

app.use(express.urlencoded({ extended:true }))
app.use(express.json())

app.use(nocache());  

app.use(express.static(path.join(__dirname, "public")))

// view engine
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))

app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

app.use("/", userRoutes);


const PORT = process.env.PORT 



app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`))