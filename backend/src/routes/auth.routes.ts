import { Router } from "express";
const router=Router();
import { loginUser, registerUser } from "../controllers/auth.controller";
router.post('/register',registerUser);
router.post('/login',loginUser);

export default router;