import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async(userId) => 
{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        // database me save krwa chuka hu....
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating refresh and access token")
    }
}

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

const LoginUser = asyncHandler(async(req,res) => {

    // req body --> data
    // username or email login accesed to the user
    // find the user in the database
    // if yes,user is present password check
    // access and refresh token generated and send to the user
    // send cookie



    // Step 1....
    const {email,username,password} = req.body

    if (!(username || email)) {
        throw new ApiError(400,"Username or email is required")
    }

    // Step 2....
    // query
    const user = await User.findOne({
        $or: [{username},{email}]
    })

    // Step 3....
    if(!user) {
        throw new ApiError(404,"User does not exist")
    }

    // Step 4....
    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credentials")
    }

    // Step 5....
    const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)

   // optional
    const loggedInUser = await User.findById(user._id).
    select("-password -refreshToken")

    // Step 6....
    // send cookie...
    const options = {
        httpOnly: true,
        secure: true
    }

    return res.
    status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,accessToken,refreshToken
            },
            "User logged In Successfully"
        )
    )
})

const logoutUser = asyncHandler(async(req,res) => {
    
    // clear refresh token and access token....
    // clear all the cookies...


    // Step 1....
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true // jo return me respond milega usme new updated value milega...
        }
    )

    
    // Step 2....
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(
            200,
            {},
            "User logged Out Successfully"
        )
    )
})


// end point for refresh access token....
const refreshAccessToken = asyncHandler(async(req,res) => {
    // aggar koi uss end point ko hit kr rha hai to cookies se usko access kr leta hu...
    const incomingRefreshToken = req.cookies.refreshAccessToken || req.body.refreshAccessToken

    if (!incomingRefreshToken) {
        throw new ApiError(401,"Unauthorized request")
    }

    // verify for decoded token...
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user) {
            throw new ApiError(401,"Invalid refresh token")
        }
    
        // database saved token and user token should match each other...
        if(incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401,"Refresh token is expired or used")
        }
    
         // if matched
        const options = {
            httpOnly: true,
            secure: true
        }
    
        // generating new refresh token
        const {accessToken,newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed successfully!!"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh token")
    }
})


// update controllers...
const changeCurrentPassword = asyncHandler(async(req,res) => {
   const {oldPassword, newPassword} = req.body

   const user = await User.findById(req.user?._id)
   const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

   if (!isPasswordCorrect) {
        throw new ApiError(400,"Invalid old password")
   }

   // setting new password...
   user.password = newPassword
   await user.save({validateBeforeSave: false})

   return res
   .status(200)
   .json(new ApiResponse(200,{},"Password changed successfully"))

})

// get current user...
const getCurrentUser = asyncHandler(async(req,res) => {
    return res
    .status(200)
    .json(new ApiResponse(200,req.user,"Current user fetched successfully"))
})


// update user details...
const updateAccountDetails = asyncHandler(async(req,res) => {
    const {fullName, email} = req.body

    if((!fullName || !email)) {
        throw new ApiError(400,"All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName: fullName,
                email: email
            }
        },
        {new: true} // update hone ke baad jo information aati h wo return hoti h...
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Account details updated successfully"))
})


// update files...
const updateUserAvatar = asyncHandler(async(req,res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400,"Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400,"Error while uploading on avatar")
    }

    // now update avatar field...
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"Avatar Image updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async(req,res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400,"Cover Image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400,"Error while uploading on cover Image")
    }

    // now update avatar field...
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200,user,"Cover Image updated successfully")
    )
})

export {registerUser,LoginUser,logoutUser,refreshAccessToken,changeCurrentPassword,getCurrentUser,updateAccountDetails,updateUserAvatar,updateUserCoverImage}