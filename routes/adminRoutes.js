import express from "express"
import nocache from "nocache";
import upload from "../middleware/multer.js";
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
    loadCategory,
    loadAddCategory,
    addCategory,
    loadEditCategory,
    editCategory,
    deleteCategory
} from "../controllers/adminController.js"

import {
    loadProduct,
    loadAddProduct,
    addProduct,
    loadAddVariant,
    addVariant,
    loadEditProduct,
    editProduct,
    deleteProduct,
    loadEditVariant,
    editVariant, 
    deleteVariant
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
router.get("/category/add", loadAddCategory)
router.post("/category/add", addCategory)
router.get("/category/edit/:id", loadEditCategory)
router.patch('/category/edit/:id', editCategory)
router.delete('/category/:id', deleteCategory)

router.get("/products", loadProduct)
router.get("/products/add", loadAddProduct)
router.post("/products/add", addProduct)
router.get("/products/:productId/variants", loadAddVariant)

router.post(
    "/products/:productId/variants",
    upload.array("images", 4),
    addVariant
);

router.get("/products/edit/:id", loadEditProduct);
router.patch("/products/edit/:id", editProduct)

router.delete("/products/delete/:id", deleteProduct)

router.get("/products/:productId/variants/edit/:variantId", loadEditVariant);
router.patch(
  "/products/:productId/variants/edit/:variantId",
  upload.array("images", 5),
  editVariant
);

router.delete(
    "/products/:productId/variants/delete/:variantId",
    deleteVariant
);


export default router;