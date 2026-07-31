import express from "express"
import nocache from "nocache";

const router = express.Router();

import {
    loadAdminLogin,
    loadDashboard,
    adminLogin,
    adminLogout
} from "../controllers/adminController.js"

import {
    loadUsers,
    loadUserDetails,
    blockUser,
    unblockUser
} from "../controllers/adminController.js"

import {
    loadCategory
} from "../controllers/adminController.js"

import { isAdminLogin, isAdminLogout } from "../middleware/adminAuth.js";

import { noCache } from "../middleware/noCache.js";


router.get("/login", noCache,loadAdminLogin)
router.post("/login", adminLogin);
 
router.get("/logout", isAdminLogin, noCache, adminLogout)

router.get("/dashboard", isAdminLogin, noCache, loadDashboard)

router.get('/users', isAdminLogin,noCache, loadUsers)
router.get('/users/:id', loadUserDetails)
router.patch('/block/:id',isAdminLogin, blockUser)
router.patch('/unblock/:id', isAdminLogin, unblockUser)

router.get("/category", loadCategory)

export default router;