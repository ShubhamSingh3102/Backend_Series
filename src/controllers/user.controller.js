import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


// const registerUser = asyncHandler( async (req,res) => {
//     res.status(200).json({
//         message: "ok"
//     })
// })

const registerUser = asyncHandler( async (req,res) => {

    // get user details from frontend
    // validation - not empty
    // check if user already exists: username,email
    // check for images,check for avatar
    // upload them to the cloudinary,avatar
    // create user object - create entry in db
    // remove password and refresh token field from the response
    // check for user creation
    // if yes then return res


    // Step 1....
    const {fullName,email,username,password} = req.body
    console.log("email: ", email);

    // if (fullName === "") {
    //     throw new ApiError(400,"fullname is required")
    // }
    // if (email === "") {
    //     throw new ApiError(400,"email is required")
    // }
    // if (username === "") {
    //     throw new ApiError(400,"username is required")
    // }
    // if (password === "") {
    //     throw new ApiError(400,"password is required")
    // }

    // Step 2.....
    if(
        [fullName,email,username,password].some((field) =>
        field?.trim() === "") // if any of the field return true means the field is empty...
    ) {
        throw new ApiError(400,"All fields are required")
    }

    // Step 3.....
    const existedUser = await User.findOne({
        $or: [ {username} , {email} ]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists");
    }
    // console.log(req.files);
    // Step 4.....
    const avatarLocalPath = req.files?.avatar[0]?.path; // ye hamare server pe hai cloudinary pe nhi gya h aabhi tk...
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    // classical way to check if coverImage present or not....optional chaining...
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage)
        && req.files.coverImage.length >0) 
    {
    coverImageLocalPath = req.files.coverImage[0].path
    }


    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required");
    }

    // Step 5.....
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required");
    }

    // Step 6......
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    // Step 7......
    // if user is created succesfully...mongo db aautomatically create _id
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // Step 8......
    if (!createdUser) {
        throw new ApiError(500,"Something went wrong while registering the user")
    }

    // Step 9......
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User register Successfully")
    )
})

export {registerUser}