import { Router } from "express";

import {
  submitBid,
  getBids,
  getAuctionActivity,
} from "../controller/bid.controller";

const router = Router();

router.post("/:rfqId/bids", submitBid);

router.get("/:rfqId/bids", getBids);

router.get("/:rfqId/activity", getAuctionActivity);

export default router;