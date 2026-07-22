import express from "express"


const router = express.Router();

import {
    loadAdmin
} from "../controllers/adminController.js"



router.get("/login", loadAdminLogin)



export default router;