import { Router } from "express"; 
import { registerUser } from "../controllers/user.controller.js";
import {upload}  from "../middlewares/multer.middleware.js"

const router = Router() // syntax same as express...

router.route("/register").post(
    // middleware inject krna hoga
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser);

export default router;