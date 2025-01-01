import {Router} from "express";

import {registerUser,logoutUser} from "../controllers/user.controllers.js";
import { verifyJwt } from "../middlewares/auth.middlewares.js";
import {upload} from "../middlewares/multer.middleware.js";
const router = Router();

router.post("/register").post(
    upload.fields([{name: "avatar", maxCount: 1}, {name: "coverImage", maxCount: 1}]),
    registerUser);
//secured routes
router.route("/logout").post(verifyJwt,logoutUser)
export default router;