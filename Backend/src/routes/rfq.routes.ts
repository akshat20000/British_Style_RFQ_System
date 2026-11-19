import { Router } from "express";

import {
  getAllRFQs,
  createRFQ,
  getRFQById,
} from "../controller/rfq.controller";

const router = Router();

router.get("/", getAllRFQs);

router.post("/", createRFQ);

router.get("/:id", getRFQById);

export default router;