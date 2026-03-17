import { healthController } from "../controllers/health.controller";
import { Router } from "express";
const router=Router();

router.get('/',healthController);
export default router;
