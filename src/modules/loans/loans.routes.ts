import { Router } from "express";
import { asyncHandler } from "../../shared/middlewares/asyncHandler";
import { LoansController } from "./loans.controller";

const router = Router();
const loansController = new LoansController();

router.post("/", asyncHandler(loansController.create));
router.get("/", asyncHandler(loansController.findAll));
router.get("/:id", asyncHandler(loansController.findById));
router.put("/:id", asyncHandler(loansController.update));
router.delete("/:id", asyncHandler(loansController.delete));

export default router;