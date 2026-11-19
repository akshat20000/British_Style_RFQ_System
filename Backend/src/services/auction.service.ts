import { Prisma } from "@prisma/client";
import prisma from "../db/database";

interface SubmitBidInput {
  rfqId: string | string[];
  supplierId: string;
  supplierName: string;
  amount: number;
  freightCharges?: number;
  originCharges?: number;
  destinationCharges?: number;
  transitTime?: number;
  quoteValidity?: Date;
}

export const submitBid = async (input: SubmitBidInput) => {
  return prisma.$transaction(
    async (tx:any) => {
      /*
       * ---------------------------------------------------------
       * 1. Get the auction
       * ---------------------------------------------------------
       */

      const rfq = await tx.rFQ.findUnique({
        where: {
          id: input.rfqId,
        },
        include: {
          auctionConfig: true,
        },
      });

      if (!rfq) {
        throw new Error("RFQ not found");
      }

      if (!rfq.auctionConfig) {
        throw new Error("Auction configuration not found");
      }

      /*
       * ---------------------------------------------------------
       * 2. Check auction timing
       * ---------------------------------------------------------
       */

      const now = new Date();

      if (now < rfq.startTime) {
        throw new Error("Auction has not started yet");
      }

      if (now >= rfq.closeTime) {
        throw new Error("Auction has closed");
      }

      if (rfq.status !== "ACTIVE") {
        throw new Error("Auction is not active");
      }

      /*
       * ---------------------------------------------------------
       * 3. Get the current lowest bid
       * ---------------------------------------------------------
       */

      const lowestBid = await tx.bid.findFirst({
        where: {
          rfqId: input.rfqId,
        },
        orderBy: {
          amount: "asc",
        },
      });

      /*
       * ---------------------------------------------------------
       * 4. Validate that the new bid is lower
       * ---------------------------------------------------------
       */

      if (lowestBid && input.amount >= Number(lowestBid.amount)) {
        throw new Error(
          `Bid must be lower than the current lowest bid of ${lowestBid.amount}`
        );
      }

      /*
       * ---------------------------------------------------------
       * 5. Determine whether the bid is inside trigger window
       * ---------------------------------------------------------
       *
       * Example:
       *
       * closeTime = 6:00 PM
       * triggerWindow = 10 minutes
       *
       * Trigger starts at 5:50 PM.
       */

      const triggerWindowStart = new Date(
        rfq.closeTime.getTime() -
          rfq.auctionConfig.triggerWindowMinutes * 60 * 1000
      );

      const isInsideTriggerWindow = now >= triggerWindowStart;

      /*
       * ---------------------------------------------------------
       * 6. Determine rank change
       * ---------------------------------------------------------
       *
       * Because we already require the new bid to be lower than
       * the current lowest bid, a new bid always becomes L1.
       *
       * Therefore:
       *
       * - BID_RECEIVED       -> trigger
       * - ANY_RANK_CHANGE    -> trigger
       * - L1_RANK_CHANGE     -> trigger
       */

      const rankChanged = lowestBid
        ? lowestBid.supplierId !== input.supplierId
        : true;

      const l1Changed = lowestBid
        ? lowestBid.supplierId !== input.supplierId
        : true;

      /*
       * ---------------------------------------------------------
       * 7. Create the bid
       * ---------------------------------------------------------
       */

      const bid = await tx.bid.create({
        data: {
          rfqId: input.rfqId,
          supplierId: input.supplierId,
          supplierName: input.supplierName,
          amount: new Prisma.Decimal(input.amount),

          freightCharges:
            input.freightCharges !== undefined
              ? new Prisma.Decimal(input.freightCharges)
              : null,

          originCharges:
            input.originCharges !== undefined
              ? new Prisma.Decimal(input.originCharges)
              : null,

          destinationCharges:
            input.destinationCharges !== undefined
              ? new Prisma.Decimal(input.destinationCharges)
              : null,

          transitTime: input.transitTime ?? null,

          quoteValidity: input.quoteValidity ?? null,
        },
      });

      /*
       * ---------------------------------------------------------
       * 8. Record bid event
       * ---------------------------------------------------------
       */

      await tx.auctionEvent.create({
        data: {
          rfqId: input.rfqId,
          bidId: bid.id,
          type: "BID_SUBMITTED",
          reason: `Bid submitted by ${input.supplierName}`,
        },
      });

      /*
       * ---------------------------------------------------------
       * 9. Check whether auction should extend
       * ---------------------------------------------------------
       */

      let newCloseTime = rfq.closeTime;
      let extended = false;
      let extensionReason: string | null = null;

      if (isInsideTriggerWindow) {
        switch (rfq.auctionConfig.extensionTrigger) {
          /*
           * Trigger 1:
           * Any bid received in the trigger window.
           */
          case "BID_RECEIVED":
            extended = true;
            extensionReason = "Bid received during trigger window";
            break;

          /*
           * Trigger 2:
           * Any supplier rank change.
           */
          case "ANY_RANK_CHANGE":
            if (rankChanged) {
              extended = true;
              extensionReason = "Supplier rank changed during trigger window";
            }
            break;

          /*
           * Trigger 3:
           * L1 supplier changed.
           */
          case "L1_RANK_CHANGE":
            if (l1Changed) {
              extended = true;
              extensionReason = "L1 supplier changed during trigger window";
            }
            break;

          default:
            throw new Error("Invalid extension trigger");
        }
      }

      /*
       * ---------------------------------------------------------
       * 10. Calculate new close time
       * ---------------------------------------------------------
       */

      if (extended) {
        const proposedCloseTime = new Date(
          rfq.closeTime.getTime() +
            rfq.auctionConfig.extensionMinutes * 60 * 1000
        );

        /*
         * CRITICAL RULE:
         *
         * Auction must NEVER extend beyond forcedCloseTime.
         */

        if (proposedCloseTime <= rfq.forcedCloseTime) {
          newCloseTime = proposedCloseTime;
        } else {
          newCloseTime = rfq.forcedCloseTime;
        }
      }

      /*
       * ---------------------------------------------------------
       * 11. Update auction if extension occurred
       * ---------------------------------------------------------
       */

      if (extended && newCloseTime > rfq.closeTime) {
        await tx.rFQ.update({
          where: {
            id: rfq.id,
          },
          data: {
            closeTime: newCloseTime,
          },
        });

        /*
         * Record extension in activity log.
         */
        await tx.auctionEvent.create({
          data: {
            rfqId: rfq.id,
            bidId: bid.id,
            type: "AUCTION_EXTENDED",
            reason: extensionReason,
            oldCloseTime: rfq.closeTime,
            newCloseTime,
          },
        });
      }

      /*
       * ---------------------------------------------------------
       * 12. Return result
       * ---------------------------------------------------------
       */

      return {
        bid,
        auction: {
          rfqId: rfq.id,
          previousCloseTime: rfq.closeTime,
          currentCloseTime: newCloseTime,
          forcedCloseTime: rfq.forcedCloseTime,
          extended:
            extended && newCloseTime > rfq.closeTime,
          extensionReason,
        },
      };
    },
    {
      /*
       * Serializable transaction helps protect the auction
       * state when multiple suppliers submit bids concurrently.
       */
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }
  );
};