import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

import Category from "../models/categoryModel.js";
import Product from "../models/productModel.js";
import Variant from "../models/variantModel.js";
import Brand from "../models/brandModel.js";

import {
    loadCategoryService,
    addCategoryService,
    editCategoryService
} from "../services/admin/categoryService.js"

import {
    loadProductService,
    addProductService,
    addVariantService,
    editProductService,
    deleteProductService,
    editVariantService,
    deleteVariantService
} from "../services/admin/productService.js"

import { 
    loadOrdersService,
    loadOrderDetailsService,
    updateOrderItemStatusService,
    loadReturnRequestsService,
    updateReturnRequestService
 } from "../services/admin/orderService.js";


import {
    createBrandService,
    getBrandsService,
    getBrandByIdService,
    editBrandService,
    toggleBrandStatusService,
    deleteBrandService
} from "../services/admin/brandService.js"


import { 
    getInvoiceOrderService
} from "../services/admin/invoiceService.js"


import {
    createCouponService,
    getCouponsService,
    editCouponService,
    toggleCouponStatusService,
    deleteCouponService
} from "../services/admin/couponService.js";


import {
    loadOfferService,
    loadOfferFormDataService,
    createOfferService,
    editOfferService,
    toggleOfferStatusService,
    deleteOfferService
} from "../services/admin/offerService.js";

import { 
    salesReportService
} from "../services/admin/salesReportService.js";




export const loadCategory = async (req,res) =>{
    try {

        const result = await loadCategoryService(req)

        const successMessage = req.session.successMessage || "";
        const errorMessage = req.session.errorMessage || "";

        req.session.successMessage = null;
        req.session.errorMessage = null;

        return res.render("admin/category/category", {
            activePage: "category",
            pageTitle: "Category",
            categories: result.categories,
            currentPage:result.currentPage,
            totalPages: result.totalPages,
            search:result.search,
            limit:result.limit,
            skip:result.skip,
            successMessage,
            errorMessage

        })
    } catch (error) {
        console.log(error)

        req.session.errorMessage = "Something went wrong.";

        return res.redirect("/admin/dashboard");
        
    }
    
}

export const loadAddCategory = async (req,res) =>{

    try {

        const successMessage = req.session.successMessage || "";
        const errorMessage = req.session.errorMessage || "";

        req.session.successMessage = null;
        req.session.errorMessage = null;

        return res.render('admin/category/addCategory', {
            activePage: "Category",
            pageTitle: "Category",
            errors:{},
            formData:{},
            successMessage,
            errorMessage

        })
        
    } catch (error) {
        console.log("LOAD ADD CATEGORY ERROR:", error)

        req.session.errorMessage = "Something went wrong"
        return res.redirect('/admin/category')
        
    }
    
}

export const addCategory = async(req,res) => {
    try {
        const result = await addCategoryService(req, res)

        const successMessage = req.session.successMessage || "";
        const errorMessage = req.session.errorMessage || "";

        req.session.successMessage = null;
        req.session.errorMessage = null;
        
        if(!result.success){
            return res.render("admin/category/addCategory", {
                activePage: "category",
                pageTitle : "Category",
                message: result.message,
                errors: result.errors,
                formData: req.body,
                successMessage,
                errorMessage
            })
        }

        req.session.successMessage = "category successfully added"
        return res.redirect("/admin/category")
        
    } catch (error) {
        console.log("ADD CATEGORY ERROR:", error)

        req.session.errorMessage = "Something went wrong"
        return res.redirect('/admin/category/add')
        
    }
} 

export const loadEditCategory = async (req,res) =>{
    try {
        
        const {id} = req.params
        const category = await Category.findById(id)

        if(!category){
            return res.redirect('/admin/category')
        }

        return res.render('admin/category/editCategory', {
            activePage: "Category",
            pageTitle: "Category",
            category,
            message:"",
            errors: {},
            formData: {}

        })
            
    } catch (error) {
        console.log("EDIT CATEGORY ERROR:", error);

        req.session.errorMessage = "Something went wrong"
        return res.redirect('/admin/category')
    }
    
}


export const editCategory = async (req, res) => {
    try {

        const { id } = req.params
        const result = await editCategoryService(req, res)
        const category = await Category.findById(id)

        if(!result.success){
            return res.render('admin/category/editCategory', {
                activePage: "category",
                pageTitle: "Category",
                message : result.message,
                errors: result.errors,
                formData: req.body,
                category

            })
        }

        req.session.successMessage =  "Category updated successfully.";
        return res.redirect("/admin/category")

        
    } catch (error) {
        console.log("ADD CATEGORY ERROR:", error)

        req.session.errorMessage = "Something went wrong"
        return res.redirect("/admin/category/edit");
        
    }

    
}


export const deleteCategory = async (req, res) => {
    try {

        const { id } = req.params;

        await Category.findByIdAndDelete(id);

        req.session.message = "Category deleted successfully.";

        return res.redirect("/admin/category");

    } catch (error) {
        console.log("DELETE CATEGORY ERROR:", error);

        req.session.errorMessage = "Something went wrong"
        return res.redirect("/admin/category");
    }
};


export const loadProduct = async (req,res) => {
    try {

        const page = Number(req.query.page) || 1;
        const limit = 5;
        const search = req.query.search || "";
        
        const result = await loadProductService(page, limit, search)

        const successMessage = req.session.successMessage || "" 
        const errorMessage = req.session.errorMessage || ""

        req.session.successMessage = null
        req.session.errorMessage = null

        return res.render("admin/product/product", {
            activePage:"product",
            pageTitle: "Products",
            products: result.products,
            totalProducts: result.totalProducts,
            activeProducts: result.activeProducts,
            inactiveProducts: result.inactiveProducts,
            search,
            currentPage:page,
            totalPages:result.totalPages,
            search,
            successMessage,
            errorMessage,
            limit,
            skip: result.skip
          })
        
    } catch (error) {

        console.log("LOAD PRODUCT ERROR:", error);

        req.session.errorMessage = "Something went wrong.";

        return res.redirect("/admin/dashboard")
        
    }
}

export const loadAddProduct = async (req, res) => {
    try {

        const categories = await Category.find({
            isActive: true
        })

        const brands = await Brand.find({
            isActive: true
        }).sort({ brandName: 1 });


        const variants= await Variant.find()

        //const priceLowToHigh = await Product.find().populate(variant.price).sort({variant.price:-1})

        const successMessage = req.session.successMessage || ""
        const errorMessage = req.session.errorMessage || ""

        req.session.successMessage = null
        req.session.errorMessage = null
        
        return res.render("admin/product/addProduct", {
            activePage: "product",
            pageTitle: "Products",
            categories,
            brands,
            formData: {},
            errors: {},
            successMessage,
            errorMessage


        })

    } catch (error) {

        console.log("LOAD ADD PRODUCT ERROR:", error);

        req.session.errorMessage = "Something went wrong"
        return res.redirect("/admin/products")
        
    }
}

export const addProduct = async (req, res) => {
    try {
        
        const result = await addProductService(req)

        const categories = await Category.find({
                isActive: true
            });

        const brands = await Brand.find({
            isActive: true
        }).sort({ brandName: 1 });


        if(!result.success){

            return res.render("admin/product/addProduct", {
                activePage: "product",
                pageTitle: "Products",
                categories,
                brands,
                errors: result.errors,
                formData: req.body,
                successMessage:"",
                errorMessage:""
            })
        }



        const successMessage = "Product added successfully. Now add variants."

        return res.redirect(`/admin/products/${result.product._id}/variants`)
        

    } catch (error) {

        console.log("ADD PRODUCT ERROR:", error);

        req.session.errorMessage = "Something went wrong"
        return res.redirect("/admin/products/add")
        
    }
}


export const loadAddVariant = async (req,res) => {
    try {

        const { productId } = req.params

        const page = parseInt(req.query.page) || 1;
        const limit = 5;

        const skip = (page - 1) * limit;

        const product = await Product.findById(productId)
            .populate("categoryId")
            
    
        if(!product){
            req.session.errorMessage = "Product not found."
            return res.redirect("/admin/products")
        }

        const variants = await Variant.find({productId})
                                .sort({createdAt:-1})
                                .skip(skip)
                                .limit(limit)
         
        const totalVariants = await Variant.countDocuments({ productId });
        const totalPages = Math.ceil(totalVariants / limit);

        const successMessage = req.session.successMessage || ""
        const errorMessage = req.session.errorMessage || ""


        console.log("SUCCESS FROM SESSION:", successMessage);
console.log("ERROR FROM SESSION:", errorMessage);


        req.session.successMessage = null
        req.session.errorMessage = null



        return res.render("admin/product/manageVariant",{
            activePage : "product",
            pageTitle: "Product",
            product,
            variants,
            errors: {},
            formData: {},
            uploadedImages: [],
            successMessage,
            errorMessage,
            page,
            limit,
            skip,
            totalPages
        })
    } catch (error) {

        console.log("LOAD ADD VARIANT ERROR:", error);

        req.session.errorMessage = "Something went wrong.";
        return res.redirect("/admin/products");
        
    }
}

export const addVariant = async (req, res) => {
    try {
        const { productId } =req.params

        const result = await addVariantService(
            productId,
            req.body,
            req.files
        )


        
        const page = parseInt(req.query.page) || 1;
        const limit = 5;

        const skip = (page - 1) * limit;

         if (!result.success) {
            return res.status(422).json({
                success: false,
                errors: result.errors,
                message: "Please correct the highlighted fields."
            });
        }
        
        req.session.successMessage = "Variant added successfully.";

        return res.json({
            success: true,
            redirect: `/admin/products/${req.params.productId}/variants/add`
        });
 } catch (error) {

        console.log("ADD VARIANT ERROR:", error);

        req.session.errorMessage = "Something went wrong."
        return res.redirect(`/admin/products/${req.params.productId}/variants`)
        
    }
}

export const loadEditProduct = async (req,res) => {
    try {
        
        const  productId  = req.params.id

        const product = await Product.findById(productId)

        if(!product){
            req.session.errorMessage = "Product not found.";
            return res.redirect("/admin/products");
        }

        const categories = await Category.find({isActive: true})

        return res.render("admin/product/editProduct", {
            activePage: "product",
            pageTitle: "Edit Product",
            product,
            categories,
            brands:[],
            formData: req.body,
            errors: {},
            successMessage: "",
            errorMessage: ""
        });

    } catch (error) {

        console.log("LOAD EDIT PRODUCT ERROR:", error);

        req.session.errorMessage = "Something went wrong.";
        return res.redirect("/admin/products");
        
    }
}


export const editProduct = async (req,res) => {
    try {
        
        const result = await editProductService(req)

        if(!result.success){
            
            return res.render("admin/product/editProduct", {
                activePage: "product",
                pageTitle: "Product",
                product: result.product,
                categories: result.categories,
                brands: [],
                errors: result.errors,
                formData: req.body,
                uploadedImages: result.uploadedImages || [],
                successMessage: "",
                errorMessage: ""

            })
        }

        req.session.successMessage =  "Product updated successfully.";

        return res.redirect("/admin/products")

    } catch (error) {
        console.log("EDIT PRODUCT ERROR:", error);

        req.session.errorMessage = "Something went wrong.";

        return res.redirect(`/admin/products/edit/${req.params.id}`);
    }
}


export const deleteProduct = async (req, res) => {
    try {

        const result = await deleteProductService(req);

        if (!result.success) {
            req.session.errorMessage = result.message;
        } else {
            req.session.successMessage = "Product deleted successfully.";
        }

        return res.redirect("/admin/products");

    } catch (error) {

        console.log("DELETE PRODUCT ERROR:", error);

        req.session.errorMessage = "Something went wrong.";

        return res.redirect("/admin/products");
    }
};


export const loadEditVariant = async (req, res) => {
    try {

        const { productId, variantId } = req.params;

        const product = await Product.findById(productId);
        const variant = await Variant.findById(variantId);

        if (!product || !variant) {
            req.session.errorMessage = "Variant not found.";
            return res.redirect(`/admin/products/${productId}/variants`);
        }

        return res.render("admin/product/editVariant", {
            activePage: "product",
            pageTitle: "Edit Variant",
            product,
            variant,
            errors: {},
            formData: req.body,
            successMessage: "",
            errorMessage: ""
        });

    } catch (error) {

        console.log("LOAD EDIT VARIANT ERROR:", error);

        req.session.errorMessage = "Something went wrong.";

        return res.redirect(`/admin/products/${req.params.productId}/variants`);
    }
};


export const editVariant = async (req, res) => {
    try {

        const result = await editVariantService(req);

        if (!result.success) {

            const product = await Product.findById(req.params.productId);

            return res.render("admin/product/editVariant", {
                activePage: "product",
                pageTitle: "Edit Variant",
                product,
                variant: result.variant,
                errors: result.errors,
                formData: req.body,
                successMessage: "",
                errorMessage: ""
            });
        }

        req.session.successMessage = "Variant updated successfully.";

        return res.json({
            success: true,
            redirect: `/admin/products/${req.params.productId}/variants/add`
        });
    } catch (error) {

        console.log("EDIT VARIANT ERROR:", error);

        req.session.errorMessage = "Something went wrong.";

        return res.redirect(`/admin/products/${req.params.productId}/variants`);
    }
};



export const deleteVariant = async (req, res) => {
    try {

        const result = await deleteVariantService(req);

        if (!result.success) {
            req.session.error = result.message;
            
            return res.redirect(`/admin/products/${req.params.productId}/variants`);
        }

        req.session.successMessage = "Variant deleted successfully."
        res.redirect(`/admin/products/${req.params.productId}/variants`);

    } catch (error) {
        console.log("DELETE VARIANT ERROR:", error);

        req.session.errorMessage = "Something went wrong.";

        return res.redirect(`/admin/products/${req.params.productId}/variants`);
    }
};




export const loadOrders = async (req, res) => {
    try {

        const search = req.query.search?.trim() || "";
        const status = req.query.status || "";
        const sort = req.query.sort || "newest"

        const page = parseInt(req.query.page) || 1;

        const result = await loadOrdersService(
            search,
            status,
            sort,
            page
        );

        if (!result.success) {
            req.session.errorMessage = "Failed to load orders";
            return res.redirect("/admin/dashboard");
        }

        const successMessage = req.session.successMessage;
        const errorMessage = req.session.errorMessage;

        req.session.successMessage = null;
        req.session.errorMessage = null;

        return res.render("admin/orders/orders", {
            activePage: "orders",
            pageTitle: "Orders",
            orders: result.orders,
            pendingOrders: result.pendingOrders,
            shippedToday: result.shippedToday,
            processingOrders: result.processingOrders,
            returnedOrders: result.returnedOrders,
            cancelledOrders: result.cancelledOrders,

            search,
            status,
            sort,
            
            page: result.page,
            totalPages: result.totalPages,

            successMessage,
            errorMessage
        });

    } catch (error) {
        console.log("LOAD ORDERS CONTROLLER ERROR:", error);

        req.session.errorMessage = "Something went wrong while loading orders";
        return res.redirect("/admin/dashboard");
    }
};


export const loadOrderDetails = async (req, res) => {
    try {

        const { orderId } = req.params;

        const result = await loadOrderDetailsService(orderId);

        if (!result.success) {

            req.session.errorMessage = result.message || "Order not found";

            return res.redirect("/admin/orders");
        }

        const successMessage = req.session.successMessage;
        const errorMessage = req.session.errorMessage;

        req.session.successMessage = null;
        req.session.errorMessage = null;

        return res.render("admin/orders/orderDetails", {
            activePage: "orders",
            pageTitle: "Order Details",
            order: result.order,
            successMessage,
            errorMessage
        });

    } catch (error) {

        console.log("LOAD ORDER DETAILS CONTROLLER ERROR:", error);

        req.session.errorMessage =
            "Something went wrong while loading order details";

        return res.redirect("/admin/orders");
    }
};



export const updateOrderItemStatus = async (req, res) => {
    try {
        const { orderItemId } = req.params;
        const { status, orderId } = req.body;

        console.log("ORDER ITEM ID:", orderItemId);
        console.log("STATUS:", status);
        console.log("ORDER ID:", orderId);

        const result = await updateOrderItemStatusService(
            orderItemId,
            status
        );

        if (!result.success) {
            req.session.errorMessage = result.message;
            return res.redirect(`/admin/orders/${orderId}`);
        }

        req.session.successMessage = result.message;

        return res.redirect(`/admin/orders/${orderId}`);

    } catch (error) {
        console.log("UPDATE ORDER ITEM STATUS CONTROLLER ERROR:", error);

        req.session.errorMessage =
            "Something went wrong while updating order status";

        return res.redirect(`/admin/orders/${req.body.orderId}`);
    }
};



export const loadReturnRequests = async (req, res) => {
    try {
        const result = await loadReturnRequestsService();

        if (!result.success) {
            req.session.errorMessage = "Failed to load return requests";
            return res.redirect("/admin/orders");
        }

        const successMessage = req.session.successMessage;
        const errorMessage = req.session.errorMessage;

        req.session.successMessage = null;
        req.session.errorMessage = null;

        return res.render("admin/orders/returnRequests", {
            activePage: "orders",
            pageTitle: "Return Requests",
            returnRequests: result.returnRequests,
            successMessage,
            errorMessage
        });
    } catch (error) {
        console.log("LOAD RETURN REQUESTS CONTROLLER ERROR:", error);

        req.session.errorMessage =
            "Something went wrong while loading return requests";

        return res.redirect("/admin/orders");
    }
};

export const approveReturnRequest = async (req, res) => {
    try {
        const result = await updateReturnRequestService(
            req.params.orderItemId,
            "APPROVED"
        );

        if (!result.success) {
            req.session.errorMessage = result.message;
            return res.redirect("/admin/orders/return-requests");
        }

        req.session.successMessage = result.message;
        return res.redirect("/admin/orders/return-requests");
    } catch (error) {
        console.log("APPROVE RETURN REQUEST CONTROLLER ERROR:", error);

        req.session.errorMessage = "Failed to approve return request";
        return res.redirect("/admin/orders/return-requests");
    }
};

export const rejectReturnRequest = async (req, res) => {
    try {
        const result = await updateReturnRequestService(
            req.params.orderItemId,
            "REJECTED"
        );

        if (!result.success) {
            req.session.errorMessage = result.message;
            return res.redirect("/admin/orders/return-requests");
        }

        req.session.successMessage = result.message;
        return res.redirect("/admin/orders/return-requests");
    } catch (error) {
        console.log("REJECT RETURN REQUEST CONTROLLER ERROR:", error);

        req.session.errorMessage = "Failed to reject return request";
        return res.redirect("/admin/orders/return-requests");
    }
};



export const loadBrands = async (req, res) => {
    try {
        const result = await getBrandsService();

        if (!result.success) {
            req.session.errorMessage = result.message;
            return res.redirect("/admin/dashboard");
        }

        return res.render("admin/brands/brands", {
            brands: result.brands || [],
            activePage: "brands",
            pageTitle: "Brand Management",
            successMessage: req.session.successMessage || "",
            errorMessage: req.session.errorMessage || ""
        });

    } catch (error) {
        console.log("LOAD BRANDS CONTROLLER ERROR:", error);

        req.session.errorMessage = "Failed to load brands";

        return res.render("admin/brands/brands", {

            brands: [],

            activePage: "brands",

            pageTitle: "Brand Management",

            successMessage: "",

            errorMessage: "Failed to load brands"

        });
    }
};

export const loadAddBrand = async (req, res) => {
    try {

        return res.render("admin/brands/addBrand", {

            activePage: "brands",

            pageTitle: "Add Brand",

            successMessage:
                req.session.successMessage || "",

            errorMessage:
                req.session.errorMessage || "",

            formData: {},

            errors: {}

        });

    } catch (error) {

        console.log(
            "LOAD ADD BRAND CONTROLLER ERROR:",
            error
        );

        return res.render("admin/brands/addBrand", {

            activePage: "brands",

            pageTitle: "Add Brand",

            successMessage: "",

            errorMessage: "Failed to load add brand page",

            formData: {},

            errors: {}

        });
    }
};

export const createBrand = async (req, res) => {
    try {
        const { brandName, description } = req.body;

        const brandImage = req.file
            ? `/uploads/brands/${req.file.filename}`
            : null;

        const result = await createBrandService(
            brandName,
            description,
            brandImage
        );

        if (!result.success) {
            req.session.errorMessage = result.message;
            return res.redirect("/admin/brands");
        }

        req.session.successMessage = result.message;

        return res.redirect("/admin/brands");

    } catch (error) {
        console.log("CREATE BRAND CONTROLLER ERROR:", error);

        req.session.errorMessage = "Failed to create brand";

        return res.redirect("/admin/brands");
    }
};

export const loadEditBrand = async (req, res) => {
    try {
        const { brandId } = req.params;

        const result = await getBrandByIdService(brandId);

        if (!result.success) {
            req.session.errorMessage = result.message;
            return res.redirect("/admin/brands");
        }

        return res.render("admin/editBrand", {
            brand: result.brand,
            message: req.session.successMessage || "",
            errorMessage: req.session.errorMessage || ""
        });

    } catch (error) {
        console.log("LOAD EDIT BRAND CONTROLLER ERROR:", error);

        req.session.errorMessage = "Failed to load brand";

        return res.redirect("/admin/brands");
    }
};


export const editBrand = async (req, res) => {
    try {
        const { brandId } = req.params;
        const { brandName, description } = req.body;

        const brandImage = req.file
            ? `/uploads/brands/${req.file.filename}`
            : null;

        const result = await editBrandService(
            brandId,
            brandName,
            description,
            brandImage
        );

        if (!result.success) {
            req.session.errorMessage = result.message;

            return res.redirect(
                `/admin/brands/edit/${brandId}`
            );
        }

        req.session.successMessage = result.message;

        return res.redirect("/admin/brands");

    } catch (error) {
        console.log("UPDATE BRAND CONTROLLER ERROR:", error);

        req.session.errorMessage = "Failed to update brand";

        return res.redirect(
            `/admin/brands/edit/${req.params.brandId}`
        );
    }
};


export const toggleBrandStatus = async (req, res) => {
    try {
        const { brandId } = req.params;

        const result = await toggleBrandStatusService(brandId);

        if (!result.success) {
            req.session.errorMessage = result.message;
            return res.redirect("/admin/brands");
        }

        req.session.successMessage = result.message;

        return res.redirect("/admin/brands");

    } catch (error) {
        console.log(
            "TOGGLE BRAND STATUS CONTROLLER ERROR:",
            error
        );

        req.session.errorMessage =
            "Failed to update brand status";

        return res.redirect("/admin/brands");
    }
};


export const deleteBrand = async (req, res) => {
    try {
        const { brandId } = req.params;

        const result = await deleteBrandService(brandId);

        if (!result.success) {
            req.session.errorMessage = result.message;
            return res.redirect("/admin/brands");
        }

        req.session.successMessage = result.message;

        return res.redirect("/admin/brands");

    } catch (error) {
        console.log("DELETE BRAND CONTROLLER ERROR:", error);

        req.session.errorMessage = "Failed to delete brand";

        return res.redirect("/admin/brands");
    }
};



export const generateInvoice = async (req, res) => {
    try {
        const { orderId } = req.params;

        const result = await getInvoiceOrderService(orderId, res);

        if (!result.success) {
            req.session.errorMessage = result.message;
            return res.redirect(`/admin/orders/${orderId}`);
        }

    } catch (error) {
        console.log("GENERATE INVOICE CONTROLLER ERROR:", error);

        req.session.errorMessage =
            "Something went wrong while generating invoice";

        return res.redirect(`/admin/orders/${req.params.orderId}`);
    }
};



export const createCoupon = async (req, res) => {
    try {
        const result = await createCouponService(req.body);

        if (!result.success) {
            req.session.couponValidation = {
                modal: "add",
                formData: req.body,
                errors: result.errors || {}
            };

            req.session.errorMessage = result.message;
            return res.redirect("/admin/coupons?modal=add");
        }

        req.session.successMessage = result.message;
        return res.redirect("/admin/coupons");

    } catch (error) {
        console.log("CREATE COUPON CONTROLLER ERROR:", error);
        req.session.errorMessage = "Failed to create coupon";
        return res.redirect("/admin/coupons?modal=add");
    }
};


export const getCoupons = async (req, res) => {
    try {
        const {
            search = "",
            page = 1,
            couponType = ""
        } = req.query;

        const result = await getCouponsService(
            search,
            page,
            couponType
        );

        if (!result.success) {
            req.session.errorMessage = result.message;
            return res.redirect("/admin");
        }

        const successMessage = req.session.successMessage;
        const errorMessage = req.session.errorMessage;
        const validationData = req.session.couponValidation || {};

        delete req.session.successMessage;
        delete req.session.errorMessage;
        delete req.session.couponValidation;

        const openModal =
            validationData.modal || req.query.modal || "";

        const editCouponId =
            validationData.couponId || req.query.couponId || "";

        return res.render("admin/coupon/coupon", {
            pageTitle: "Coupon Management",
            activePage: "coupon",
            coupons: result.coupons,
            totalCoupons: result.totalCoupons,
            activeCoupons: result.activeCoupons,
            expiredCoupons: result.expiredCoupons,
            currentPage: result.currentPage,
            totalPages: result.totalPages,
            search: result.search,
            couponType,
            skip: (result.currentPage - 1) * 5,
            successMessage,
            errorMessage,
            openModal,
            editCouponId,
            formData: validationData.formData || {},
            errors: validationData.errors || {}
        });

    } catch (error) {
        console.log("GET COUPONS CONTROLLER ERROR:", error);
        req.session.errorMessage = "Failed to load coupons";
        return res.redirect("/admin/coupons");
    }
};


export const editCoupon = async (req, res) => {
    try {
        const { couponId } = req.params;

        const result = await editCouponService(couponId, req.body);

        if (!result.success) {
            req.session.couponValidation = {
                modal: "edit",
                couponId,
                formData: req.body,
                errors: result.errors || {}
            };

            req.session.errorMessage = result.message;

            return res.redirect(
                `/admin/coupons?modal=edit&couponId=${couponId}`
            );
        }

        req.session.successMessage = result.message;
        return res.redirect("/admin/coupons");

    } catch (error) {
        console.log("EDIT COUPON CONTROLLER ERROR:", error);
        req.session.errorMessage = "Failed to update coupon";

        return res.redirect(
            `/admin/coupons?modal=edit&couponId=${req.params.couponId}`
        );
    }
};


export const toggleCouponStatus = async (req, res) => {
    try {
        const { couponId } = req.params;

        const result = await toggleCouponStatusService(couponId);

        if (!result.success) {
            req.session.errorMessage = result.message;
            return res.redirect("/admin/coupons");
        }

        req.session.successMessage = result.message;
        return res.redirect("/admin/coupons");

    } catch (error) {
        console.log("TOGGLE COUPON STATUS CONTROLLER ERROR:", error);
        req.session.errorMessage = "Failed to update coupon status";
        return res.redirect("/admin/coupons");
    }
};


export const deleteCoupon = async (req, res) => {
    try {
        const { couponId } = req.params;

        const result = await deleteCouponService(couponId);

        if (!result.success) {
            req.session.errorMessage = result.message;
            return res.redirect("/admin/coupons");
        }

        req.session.successMessage = result.message;
        return res.redirect("/admin/coupons");

    } catch (error) {
        console.log("DELETE COUPON CONTROLLER ERROR:", error);
        req.session.errorMessage = "Failed to delete coupon";
        return res.redirect("/admin/coupons");
    }
};





export const getOffers = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = 5;
        const search = req.query.search || "";
const type = req.query.type || "";

        const result = await loadOfferService(page, limit, search, type);

        const formData = req.session.offerFormData || {};
        const validationErrors = req.session.offerValidationErrors || {};
        const successMessage = req.session.successMessage;
        const errorMessage = req.session.errorMessage;

        delete req.session.offerFormData;
        delete req.session.offerValidationErrors;
        delete req.session.successMessage;
        delete req.session.errorMessage;

        const formOptions = await loadOfferFormDataService();

        return res.render("admin/offer/offer", {
            ...result,
            ...formOptions,
            formData,
            validationErrors,
            successMessage,
            errorMessage,
            openModal: req.query.modal || "",
            activePage: "offers",
            pageTitle: "Offer Management",
            search,
            type
        });
    } catch (error) {
        console.log("GET OFFERS CONTROLLER ERROR:", error);
        req.session.errorMessage = "Failed to load offers.";
        return res.redirect("/admin/dashboard");
    }
};

export const createOffer = async (req, res) => {
    try {
        const result = await createOfferService(req.body);

        if (!result.success) {
            req.session.offerFormData = req.body;
            req.session.offerValidationErrors = result.errors || {};
            req.session.errorMessage = "Please correct the offer details.";
            return res.redirect("/admin/offers?modal=add");
        }

        req.session.successMessage = "Offer created successfully.";
        return res.redirect("/admin/offers");
    } catch (error) {
        console.log("CREATE OFFER CONTROLLER ERROR:", error);
        req.session.offerFormData = req.body;
        req.session.errorMessage = "Failed to create offer.";
        return res.redirect("/admin/offers?modal=add");
    }
};




export const editOffer = async (req, res) => {
    try {
        const result = await editOfferService(
            req.params.offerId,
            req.body
        );

        if (!result.success) {
            req.session.offerFormData = req.body;
            req.session.offerValidationErrors = result.errors || {};
            req.session.errorMessage = "Please correct the offer details.";

            return res.redirect(
                `/admin/offers?modal=edit&offerId=${req.params.offerId}`
            );
        }

        req.session.successMessage = "Offer updated successfully.";
        return res.redirect("/admin/offers");
    } catch (error) {
        console.log("EDIT OFFER CONTROLLER ERROR:", error);

        req.session.offerFormData = req.body;
        req.session.errorMessage = "Failed to update offer.";

        return res.redirect(
            `/admin/offers?modal=edit&offerId=${req.params.offerId}`
        );
    }
};


export const toggleOfferStatus = async (req, res) => {
    try {
        const { offerId } = req.params;

        console.log("TOGGLE CONTROLLER CALLED");
        console.log("OFFER ID:", offerId);

        const result = await toggleOfferStatusService(offerId);

        console.log("SERVICE RESULT:", result);

        if (!result.success) {
            req.session.errorMessage = result.message;
        } else {
            req.session.successMessage = result.offer.isActive
                ? "Offer activated successfully."
                : "Offer deactivated successfully.";
        }

        return res.redirect("/admin/offers");

    } catch (error) {
        console.error("TOGGLE OFFER STATUS ERROR:", error);

        req.session.errorMessage = "Failed to update offer status.";

        return res.redirect("/admin/offers");
    }
};

export const deleteOffer = async (req, res) => {
    try {
        const result = await deleteOfferService(req.params.offerId);

        if (!result.success) {
            req.session.errorMessage = result.message;
        } else {
            req.session.successMessage = result.message;
        }

        return res.redirect("/admin/offers");
    } catch (error) {
        console.log("DELETE OFFER ERROR:", error);
        req.session.errorMessage = "Failed to delete offer.";
        return res.redirect("/admin/offers");
    }
};




export const loadSalesReport = async (req, res) => {
    try {
        const result = await salesReportService({
            period: req.query.period || "weekly",
            from: req.query.from,
            to: req.query.to,
            page: req.query.page
        });

        return res.render("admin/salesReport/salesReport", {
            activePage: "salesReport",
            pageTitle: "Sales Report",
            ...result
        });

    } catch (error) {
        console.log("LOAD SALES REPORT ERROR:", error);
        return res.redirect("/admin/dashboard");
    }
};




export const downloadSalesReportPDF = async (req, res) => {
    try {
        const report = await salesReportService({
            period: req.query.period || "weekly",
            from: req.query.from,
            to: req.query.to,
            exportAll: true
        });

        if (!report.success) {
            return res.redirect("/admin/sales-report");
        }

        const doc = new PDFDocument({
            size: "A4",
            margin: 40,
            bufferPages: true
        });

        const PAGE_WIDTH = 595.28;
        const LEFT = 40;
        const RIGHT = 555;
        const TABLE_WIDTH = RIGHT - LEFT;
        const BOTTOM_LIMIT = 755;

        const NAVY = "#142F50";
        const LIGHT_BLUE = "#DCEBFA";
        const BORDER = "#AAB4BF";

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            'attachment; filename="Chronix-Sales-Report.pdf"'
        );

        doc.pipe(res);

        const formatMoney = amount =>
            `Rs. ${Number(amount || 0).toFixed(2)}`;

        const formatDate = date =>
            new Date(date).toLocaleDateString("en-IN");

        // FIRST PAGE HEADER
        doc.fillColor(NAVY)
            .font("Helvetica-Bold")
            .fontSize(23)
            .text("CHRONIX", LEFT, 40);

        doc.font("Helvetica-Bold")
            .fontSize(15)
            .text("SALES REPORT", LEFT, 69);

        doc.font("Helvetica")
            .fontSize(9)
            .fillColor("#555555")
            .text("E-commerce Sales Analytics", LEFT, 89);

        doc.moveTo(LEFT, 110)
            .lineTo(RIGHT, 110)
            .lineWidth(1)
            .strokeColor(NAVY)
            .stroke();

        // REPORT PERIOD
        doc.roundedRect(LEFT, 120, TABLE_WIDTH, 28, 4)
            .fill(NAVY);

        doc.fillColor("#FFFFFF")
            .font("Helvetica-Bold")
            .fontSize(10)
            .text(
                `Period: ${report.period.toUpperCase()}    |    From: ${formatDate(report.fromDate)}    To: ${formatDate(report.toDate)}`,
                LEFT + 10,
                129,
                {
                    width: TABLE_WIDTH - 20,
                    align: "center"
                }
            );

        doc.y = 165;

        // CHECK AVAILABLE PAGE SPACE
        const checkPageSpace = requiredHeight => {
            if (doc.y + requiredHeight > BOTTOM_LIMIT) {
                doc.addPage();
            }
        };

        // SECTION HEADING
        const drawSectionHeading = title => {
            checkPageSpace(55);

            doc.moveDown(0.5);

            doc.fillColor(NAVY)
                .font("Helvetica-Bold")
                .fontSize(14)
                .text(title, LEFT, doc.y);

            doc.moveDown(0.7);
        };

        // REUSABLE TABLE FUNCTION
        const drawTable = (columns, rows) => {
            const headerHeight = 25;
            const padding = 5;
            const fontSize = 8;

            const drawTableHeader = () => {
                let x = LEFT;
                const y = doc.y;

                columns.forEach(column => {
                    doc.rect(x, y, column.width, headerHeight)
                        .fillAndStroke(NAVY, BORDER);

                    doc.fillColor("#FFFFFF")
                        .font("Helvetica-Bold")
                        .fontSize(fontSize)
                        .text(
                            column.header,
                            x + padding,
                            y + 7,
                            {
                                width: column.width - padding * 2,
                                align: column.align || "left"
                            }
                        );

                    x += column.width;
                });

                doc.y = y + headerHeight;
            };

            checkPageSpace(headerHeight + 25);
            drawTableHeader();

            rows.forEach(row => {
                doc.font("Helvetica")
                    .fontSize(fontSize);

                // CALCULATE ROW HEIGHT
                const cellHeights = columns.map((column, index) => {
                    const value = String(row[index] ?? "");

                    return doc.heightOfString(value, {
                        width: column.width - padding * 2,
                        align: column.align || "left",
                        lineGap: 1
                    });
                });

                const rowHeight = Math.max(
                    22,
                    ...cellHeights.map(height => height + padding * 2)
                );

                // MOVE TO NEXT PAGE IF REQUIRED
                if (doc.y + rowHeight > BOTTOM_LIMIT) {
                    doc.addPage();
                    drawTableHeader();
                }

                const y = doc.y;
                let x = LEFT;

                columns.forEach((column, index) => {
                    doc.rect(x, y, column.width, rowHeight)
                        .fillAndStroke("#FFFFFF", BORDER);

                    doc.fillColor("#222222")
                        .font("Helvetica")
                        .fontSize(fontSize)
                        .text(
                            String(row[index] ?? ""),
                            x + padding,
                            y + padding,
                            {
                                width: column.width - padding * 2,
                                height: rowHeight - padding * 2,
                                align: column.align || "left",
                                lineGap: 1
                            }
                        );

                    x += column.width;
                });

                doc.y = y + rowHeight;
            });

            doc.moveDown(0.8);
        };

        // 1. SALES SUMMARY
        drawSectionHeading("Sales Summary");

        drawTable(
            [
                { header: "Description", width: 300 },
                { header: "Amount", width: 215, align: "right" }
            ],
            [
                ["Gross Sales", formatMoney(report.grossSales)],
                ["Total Discounts", formatMoney(report.totalDiscounts)],
                ["Total Refunds", formatMoney(report.totalRefunds)],
                ["Net Sales", formatMoney(report.netSales)],
                ["Total Orders", String(report.totalOrders)]
            ]
        );

        // 2. BEST SELLING PRODUCTS
        drawSectionHeading("Best Selling Products");

        const productRows = report.bestSellingProducts.map(product => [
            product.productName || "Unknown",
            String(product.totalSold || 0),
            formatMoney(product.revenue)
        ]);

        drawTable(
            [
                { header: "Product Name", width: 235 },
                { header: "Quantity Sold", width: 115, align: "center" },
                { header: "Revenue", width: 165, align: "right" }
            ],
            productRows.length
                ? productRows
                : [["No product sales found", "-", "-"]]
        );

        // 3. RECENT SALES
        drawSectionHeading("Recent Sales");

        const recentSalesRows = report.recentSales.map(sale => [
            sale.orderId || "-",
            formatDate(sale.date),
            sale.customerName || "Unknown",
            sale.paymentMethod || "-",
            formatMoney(sale.amount),
            sale.status || "-"
        ]);

        drawTable(
            [
                { header: "Order ID", width: 65 },
                { header: "Date", width: 65 },
                { header: "Customer", width: 95 },
                { header: "Payment", width: 80 },
                { header: "Amount", width: 105, align: "right" },
                { header: "Status", width: 105 }
            ],
            recentSalesRows.length
                ? recentSalesRows
                : [["-", "-", "No sales found", "-", "-", "-"]]
        );

        // ADD FOOTER AND PAGE NUMBERS
        const pageRange = doc.bufferedPageRange();
        const totalPages = pageRange.count;

        for (
            let pageIndex = pageRange.start;
            pageIndex < pageRange.start + totalPages;
            pageIndex++
        ) {
            doc.switchToPage(pageIndex);

            doc.moveTo(LEFT, 775)
                .lineTo(RIGHT, 775)
                .lineWidth(0.7)
                .strokeColor(BORDER)
                .stroke();

            doc.fillColor("#555555")
                .font("Helvetica")
                .fontSize(8)
                .text(
                    "Chronix E-commerce",
                    LEFT,
                    784
                );

            doc.text(
                `Page ${pageIndex + 1} of ${totalPages}`,
                LEFT,
                784,
                {
                    width: TABLE_WIDTH,
                    align: "right"
                }
            );
        }

        doc.end();

    } catch (error) {
        console.log("SALES REPORT PDF ERROR:", error);

        if (!res.headersSent) {
            return res.redirect("/admin/sales-report");
        }
    }
};





export const downloadSalesReportExcel = async (req, res) => {
    try {
        const report = await salesReportService({
            period: req.query.period || "weekly",
            from: req.query.from,
            to: req.query.to
        });

        if (!report.success) {
            return res.redirect("/admin/sales-report");
        }

        const workbook = new ExcelJS.Workbook();

        // SALES SUMMARY SHEET
        const summarySheet = workbook.addWorksheet("Sales Summary");

        summarySheet.columns = [
            { header: "Description", key: "description", width: 25 },
            { header: "Amount", key: "amount", width: 20 }
        ];

        summarySheet.addRows([
            { description: "Period", amount: report.period },
            {
                description: "From Date",
                amount: new Date(report.fromDate).toLocaleDateString("en-IN")
            },
            {
                description: "To Date",
                amount: new Date(report.toDate).toLocaleDateString("en-IN")
            },
            { description: "Gross Sales", amount: report.grossSales },
            { description: "Total Discounts", amount: report.totalDiscounts },
            { description: "Total Refunds", amount: report.totalRefunds },
            { description: "Net Sales", amount: report.netSales },
            { description: "Total Orders", amount: report.totalOrders }
        ]);

        summarySheet.getRow(1).font = { bold: true };

        // RECENT SALES SHEET
        const salesSheet = workbook.addWorksheet("Recent Sales");

        salesSheet.columns = [
            { header: "Order ID", key: "orderId", width: 18 },
            { header: "Date", key: "date", width: 18 },
            { header: "Customer", key: "customerName", width: 25 },
            { header: "Payment Method", key: "paymentMethod", width: 18 },
            { header: "Amount", key: "amount", width: 15 },
            { header: "Status", key: "status", width: 20 }
        ];

        salesSheet.addRows(
            report.recentSales.map(sale => ({
                orderId: sale.orderId,
                date: new Date(sale.date).toLocaleDateString("en-IN"),
                customerName: sale.customerName,
                paymentMethod: sale.paymentMethod,
                amount: sale.amount,
                status: sale.status
            }))
        );

        salesSheet.getRow(1).font = { bold: true };

        // BEST SELLING PRODUCTS SHEET
        const productSheet = workbook.addWorksheet("Best Selling Products");

        productSheet.columns = [
            { header: "Product Name", key: "productName", width: 30 },
            { header: "Quantity Sold", key: "totalSold", width: 18 },
            { header: "Revenue", key: "revenue", width: 18 }
        ];

        productSheet.addRows(report.bestSellingProducts);

        productSheet.getRow(1).font = { bold: true };

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.setHeader(
            "Content-Disposition",
            'attachment; filename="Chronix-Sales-Report.xlsx"'
        );

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.log("SALES REPORT EXCEL ERROR:", error);

        if (!res.headersSent) {
            return res.redirect("/admin/sales-report");
        }
    }
};
