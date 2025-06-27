import { Router } from "express"; 
import { LoginUser, logoutUser, registerUser,refreshAccessToken } from "../controllers/user.controller.js";
import {upload}  from "../middlewares/multer.middleware.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

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

// router.get("/test", (req, res) => {
//   res.status(200).json({ success: true, message: "Test route working!" });
// });


router.route("/login").post(LoginUser)


// secured routes
router.route("/logout").post(verifyJWT , logoutUser)

router.route("/refresh-token").post(refreshAccessToken)
export default router;