import { Request, Response, NextFunction } from "express";
import prisma from "../db/database";

/**
 * GET /api/rfqs
 * Get all RFQs / auctions
 */
export const getAllRFQs = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const rfqs = await prisma.rFQ.findMany({
      include: {
        auctionConfig: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      data: rfqs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/rfqs
 * Create a new RFQ / auction
 */
export const createRFQ = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      name,
      referenceId,
      startTime,
      closeTime,
      forcedCloseTime,
      pickupServiceDate,
      triggerWindowMinutes,
      extensionMinutes,
      extensionTrigger,
    } = req.body;

    // Basic validation
    if (
      !name ||
      !referenceId ||
      !startTime ||
      !closeTime ||
      !forcedCloseTime ||
      triggerWindowMinutes === undefined ||
      extensionMinutes === undefined ||
      !extensionTrigger
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing equired fields",
        helper: req.body
      });
    }

    const start = new Date(startTime);
    const close = new Date(closeTime);
    const forcedClose = new Date(forcedCloseTime);

    // Forced close must be later than bid close.
    if (forcedClose <= close) {
      return res.status(400).json({
        success: false,
        message: "Forced close time must be later than bid close time",
      });
    }

    if (start >= close) {
      return res.status(400).json({
        success: false,
        message: "Start time must be before bid close time",
      });
    }

    if (triggerWindowMinutes <= 0 || extensionMinutes <= 0) {
      return res.status(400).json({
        success: false,
        message: "Trigger window and extension duration must be positive",
      });
    }

    const rfq = await prisma.rFQ.create({
      data: {
        name,
        referenceId,
        startTime: start,
        closeTime: close,
        forcedCloseTime: forcedClose,
        pickupServiceDate: pickupServiceDate
          ? new Date(pickupServiceDate)
          : null,

        auctionConfig: {
          create: {
            triggerWindowMinutes,
            extensionMinutes,
            extensionTrigger,
          },
        },
      },
      include: {
        auctionConfig: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "RFQ created successfully",
      data: rfq,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/rfqs/:id
 * Get a specific RFQ / auction
 */
export const getRFQById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const rfq = await prisma.rFQ.findUnique({
      where: {
        id,
      },
      include: {
        auctionConfig: true,
        bids: {
          orderBy: {
            amount: "asc",
          },
        },
        events: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!rfq) {
      return res.status(404).json({
        success: false,
        message: "RFQ not found",
      });
    }

    res.status(200).json({
      success: true,
      data: rfq,
    });
  } catch (error) {
    next(error);
  }
};