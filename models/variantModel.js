import mongoose from "mongoose";


const variantSchema = new mongoose.Schema(
    {
        productId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        color:{
            type: String,
            required: true,
            trim:true
        },
        images:[{
            type: String,
            required:true
        }],
        stock:{
            type: Number,
            required: true,
            min:0
        },
        price:{
            type: Number,
            default:0,
            min:0
        },
        offerPrice:{
            type: Number,
            default:0,
            min:0
        },
    
        description:{
            type:String,
            default:"",
            trim:true
        },
        isActive:{
            type: Boolean,
            default: true
        }
    },
    {
        timestamps:true
    }
)

const Variant = mongoose.model("Variant", variantSchema)

export default Variant