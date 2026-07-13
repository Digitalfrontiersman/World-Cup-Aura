import { Router, type IRouter } from "express";
import healthRouter from "./health";
import auraRouter from "./aura";
import worldcupRouter from "./worldcup";
import shipRouter from "./ship";

const router: IRouter = Router();

router.use(healthRouter);
router.use(auraRouter);
router.use(worldcupRouter);
router.use(shipRouter);

export default router;
