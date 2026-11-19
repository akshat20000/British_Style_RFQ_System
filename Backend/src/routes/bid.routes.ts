import { Router } from "express";

import {
  submitBid,
  getBids,
  getAuctionActivity,
} from "../controller/bid.controller";

const router = Router();

router.post("/:rfqId", submitBid);

router.get("/:rfqId", getBids);

router.get("/:rfqId/activity", getAuctionActivity);

export default router;