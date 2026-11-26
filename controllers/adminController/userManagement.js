 import User from "../../models/userModel.js";
 
 import {
    loadUsersService,
    loadUserDetailsService
 } from "../../services/admin/usersService.js";


 export const loadUsers = async (req, res) => {
     try {
 
         const result = await loadUsersService(req);
         const message = req.message || "";
 
         return res.render("admin/users/users", {
             activePage: "users",
             pageTitle: "Users",
             users: result.users,
             totalUsers: result.totalUsers,
             activeUsers: result.activeUsers,
             blockedUsers: result.blockedUsers,
             currentPage: result.currentPage,
             totalPages: result.totalPages,
             search: result.search,
             message
         });
         
     } catch (error) {
         console.error("LOAD USERS ERROR:", error);
 
         return res.render("admin/users/users", {
             activePage: "users",
             pageTitle: "Users",
             users: [],
             totalUsers: 0,
             activeUsers: 0,
             blockedUsers: 0,
             currentPage: 1,
             totalPages: 1,
             search: "",
             message: "Something went wrong"
         });
     }
 }
 
 export const loadUserDetails = async (req, res) => {

     const result = await loadUserDetailsService(req);

     
     res.render("admin/users/userDetails", {
         activePage:"users",
         pageTitle: "Users",
         user: result.user,
         address: result.address,
         message: ""
     });
 };
 
 export const blockUser = async (req, res) => {
     try {
 
         const userId = req.params.id;
 
         await User.findByIdAndUpdate(userId,{
             isBlocked: true
         })
 
         req.message = "User blocked successfully";
 
         return loadUsers(req, res);
        
     } catch (error) {
         console.error("BLOCK USER ERROR:", error);
 
         req.message = "Failed to block user";
 
         return loadUsers(req, res);
     }
 }
 
 
 
 export const unblockUser = async (req, res) => {
     try {
 
         const userId = req.params.id;
 
         await User.findByIdAndUpdate(userId,{
             isBlocked: false
         })
 
         req.message = "User unblocked successfully";
 
         return loadUsers(req, res);
 
     } catch (error) {
         console.log(error);
 
         req.message = "Failed to unblock user";
 
         return loadUsers(req, res);
     }
 }
 
 