import { Router } from "express"; 
import { registerUser } from "../controllers/user.controller.js";

const router = Router() // syntax same as express...

router.route("/register").post(registerUser)

export default router;