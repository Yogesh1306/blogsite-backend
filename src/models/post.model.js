import mongoose, {Schema} from "mongoose";

const postSchema = new Schema({
    user:{
        type: Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    coverImg:{
        type: String,
    },
    title:{
        type: String,
        required: true,
    },
    slug:{
        type:String,
        required:true,
        unique:true
    },
    desc:{
        type:String
    },
    category:{
        type:String,
        default: "general"
    },
    content:{
        type:String,
        required:true
    },
    isFeatured:{
        type:Boolean,
        default: false
    },
    visits:{
        type:Number,
        default: 0
    }
},{timestamps: true})

export const Post = mongoose.model("Post",postSchema)