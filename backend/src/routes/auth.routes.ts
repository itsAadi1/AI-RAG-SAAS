import { Router } from "express";
import { loginUser, registerUser } from "../controllers/auth.controller";

const router = Router();

// Test route to verify router is working
router.get('/test', (req, res) => {
  res.json({ message: 'Auth router is working' });
});

router.post('/register', registerUser);
router.post('/login', loginUser);

export default router;
