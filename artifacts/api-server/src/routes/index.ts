import { Router, type IRouter } from "express";
import healthRouter from "./health";
import stocksRouter from "./stocks";
import searchRouter from "./search";
import translateRouter from "./translate";
import chartRouter from "./chart";
import trendingRouter from "./trending";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/stocks", stocksRouter);
router.use("/search", searchRouter);
router.use("/translate", translateRouter);
router.use("/stocks", chartRouter);
router.use("/trending", trendingRouter);

export default router;
