import { Request, Response, NextFunction } from "express";
import prisma from "../db/database";
import {
  submitBid as submitAuctionBid,
} from "../services/auction.service";


/**
 * POST /api/rfqs/:rfqId/bids
 * Submit a bid
 */
export const submitBid = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { rfqId } = req.params;

    const {
      supplierId,
      supplierName,
      amount,
      freightCharges,
      originCharges,
      destinationCharges,
      transitTime,
      quoteValidity,
    } = req.body;

    if (!supplierId || !supplierName || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: "supplierId, supplierName and amount are required",
      });
    }

    const result = await submitAuctionBid({
      rfqId,
      supplierId,
      supplierName,
      amount: Number(amount),
      freightCharges:
        freightCharges !== undefined
          ? Number(freightCharges)
          : undefined,
      originCharges:
        originCharges !== undefined
          ? Number(originCharges)
          : undefined,
      destinationCharges:
        destinationCharges !== undefined
          ? Number(destinationCharges)
          : undefined,
      transitTime:
        transitTime !== undefined
          ? Number(transitTime)
          : undefined,
      quoteValidity: quoteValidity
        ? new Date(quoteValidity)
        : undefined,
    });

    return res.status(201).json({
      success: true,
      message: "Bid submitted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/rfqs/:rfqId/bids
 * Get all bids for an auction
 */
export const getBids = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { rfqId } = req.params;

    const bids = await prisma.bid.findMany({
      where: {
        rfqId,
      },
      orderBy: {
        amount: "asc",
      },
    });

    res.status(200).json({
      success: true,
      data: bids,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/rfqs/:rfqId/activity
 * Get auction activity
 */
export const getAuctionActivity = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { rfqId } = req.params;

    const events = await prisma.auctionEvent.findMany({
      where: {
        rfqId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};