import Address from "../../models/addressModel.js";
import User from "../../models/userModel.js";


export const loadUsersService = async (req) => {
     
    const page = Number(req.query.page) || 1

    const limit = 5;

    const skip = (page - 1) * limit;

    
    const search = req.query.search || "";

    const query = {};

    if(search){

        query.$or = [
            {
                name:{
                    $regex: search,
                    $options:"i"
                }
            },
            {
                email:{
                    $regex: search,
                    $options:"i"
                }
            },
            {
                phone:{
                    $regex: search,
                    $options:"i"
                }
            }
        ];

    }



    const users = await User.find(query)
    .sort({createAt : -1})
    .skip(skip)
    .limit(limit);

    const totalUsers = await User.countDocuments(query);

    const totalPages = Math.ceil(totalUsers/limit)

    const activeUsers = await User.countDocuments({
        isBlocked:false
    });


    const blockedUsers = await User.countDocuments({
        isBlocked:true
    });


    console.log("SEARCH:", search);
    console.log("FOUND USERS:", users.length);



    return {
        success: true,
        users,
        totalUsers,
        activeUsers,
        blockedUsers,
        currentPage: page,
        totalPages,
        search
    }
}

export const loadUserDetailsService = async(req, res) =>{
    const id = req.params.id
    const user = await User.findById(id)

    
    if(!user){
        return {
            success : false,
            message: "User not found"
        }
    }

    const addressDoc = await Address.findOne({
        userId: user._id
    });

    const address = addressDoc?.addresses.find(addr => addr.isDefault);

    return { 
        success: true,
        user,
        address
    }
}