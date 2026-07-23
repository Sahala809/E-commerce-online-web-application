import express from "express"


const router = express.Router();

import {
    loadAdminLogin,
    loadDashboard,
    adminLogin,
    adminLogout
} from "../controllers/adminController.js"

import { isAdminLogin, isAdminLogout } from "../middleware/adminAuth.js";

import { noCache } from "../middleware/noCache.js";

router.get("/login", isAdminLogout, noCache, loadAdminLogin)
router.post("/login", isAdminLogout, adminLogin);

router.get("/dashboard", isAdminLogin, noCache, loadDashboard)
 
router.get("/logout", isAdminLogin, noCache, adminLogout)


export default router;