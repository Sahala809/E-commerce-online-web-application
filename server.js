import "dotenv/config"

import express from "express"
import path from "path"
import { fileURLToPath } from "url"
import session from "express-session"
import passport from "passport";
import nocache from "nocache";
import methodOverride from "method-override";
import cron from "node-cron";

import connectDB from "./config/db.js";
import "./config/passport.js";

import { testRefreshVariantOfferPrices } from "./services/admin/offerService.js";
import userRoutes from "./routes/userRoutes.js"
import sendOtp from "./utils/sendOtp.js";
import adminRouter from "./routes/adminRoutes.js"
import { navbarCount } from "./middleware/navbarCount.js";

console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "Loaded" : "Missing");



// Connect Database
connectDB();


cron.schedule("* * * * *", async () => {
    try {
        await testRefreshVariantOfferPrices();
        console.log("Offer prices refreshed successfully");
    } catch (error) {
        console.error("Offer price refresh failed:", error);
    }
});

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


app.use(navbarCount);
app.use(methodOverride("_method"));
app.use(passport.initialize());
app.use(passport.session());

app.use(express.urlencoded({ extended:true }))
app.use(express.json())

app.use(nocache());  

app.use(express.static(path.join(__dirname, "public")))

// view engine
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))

app.get("/", (req, res) => {
    res.redirect("/user");
});


app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});


app.use((req, res, next) => {
    console.log("Request:", req.method, req.url);
    next();
});


app.use("/user", userRoutes);
app.use("/admin", adminRouter)


const PORT = process.env.PORT 



app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`))


