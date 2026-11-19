# British Auction RFQ System

A full-stack Request for Quotation (RFQ) and British Auction web application built with React, TypeScript, Vite, Node.js, Express, and Prisma/PostgreSQL. Suppliers submit quotes while dynamic auto-extension rules extend the auction closing time—up to a hard `forcedCloseTime` cap—when qualifying triggers occur inside a configured time window.

## Tech Stack

* **Frontend:** React, TypeScript, Vite, React Router, Axios
* **Backend:** Node.js, Express, TypeScript (`tsx`), Prisma ORM (`@prisma/client` + `@prisma/adapter-pg`)
* **Database:** PostgreSQL

## Project Structure

```text
RFQ/
├── Backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── controller/
│   │   │   └── rfq.controller.ts
│   │   ├── db/
│   │   │   └── database.ts
│   │   ├── routes/
│   │   │   └── bid.routes.ts
│   │   ├── services/
│   │   │   └── auction.service.ts
│   │   └── server.ts
│   └── .env
└── Frontend/
    └── src/
        ├── api/
        │   └── api.ts
        ├── pages/
        │   ├── RFQList.tsx
        │   ├── CreateRFQ.tsx
        │   └── AuctionDetails.tsx
        └── App.tsx


## Core Features & Business Logic

* **RFQ Listing (`RFQList`):** Displays all RFQs with reference IDs, current lowest bid (L1), current close time, forced close time, and auction status (`ACTIVE`, `CLOSED`, `FORCE_CLOSED`).
* **Create RFQ (`CreateRFQ`):** Creates an RFQ along with its `AuctionConfig` (`triggerWindowMinutes`, `extensionMinutes`, `extensionTrigger`) and validates schedule ordering (`startTime < closeTime < forcedCloseTime`).
* **Live Auction & Bidding (`AuctionDetails`):** Shows a live countdown timer, bid submission form (with optional freight, origin, destination charges, transit time, and quote validity), ranked supplier bids (`L1`, `L2`, ...), and an `AuctionEvent` activity log.
* **British Auction Auto-Extension (`auction.service.ts`):** Runs inside a `Serializable` Prisma transaction per bid to:
  * Check auction start/close/forced-close boundaries and update status when closed or force-closed.
  * Evaluate whether the bid arrives within `triggerWindowMinutes` before `closeTime`.
  * Trigger extensions for `BID_RECEIVED`, `ANY_RANK_CHANGE`, or `L1_RANK_CHANGE`.
  * Extend `closeTime` by `extensionMinutes`, strictly clamped to `forcedCloseTime`, and log `AUCTION_EXTENDED` events with `oldCloseTime` and `newCloseTime`.

## Setup & Running Locally

### 1. Database & Backend

1. Ensure PostgreSQL is running and configure `DATABASE_URL` in `Backend/.env`.
2. Make sure `import "dotenv/config";` is at the top of `Backend/src/server.ts`.
3. Push the Prisma schema and start the API server:

```powershell
cd D:\RFQ\Backend
npx prisma db push
npx tsx src/server.ts


### 2. Frontend

In a second terminal, start the Vite dev server:

```powershell
cd D:\RFQ\Frontend
npm install
npm run dev

Open http://localhost:5173 in your browser.

## Database Overview

* **`RFQ`:** Core RFQ details (`id`, `name`, `referenceId`, `startTime`, `closeTime`, `forcedCloseTime`, `pickupServiceDate`, `status`).
* **`AuctionConfig` (1:1 with `RFQ`):** Extension settings (`triggerWindowMinutes`, `extensionMinutes`, `extensionTrigger`).
* **`Bid` (1:N with `RFQ`):** Supplier quotes (`supplierId`, `supplierName`, `amount`, cost components, `transitTime`, `quoteValidity`, `createdAt`), indexed on `(rfqId, amount)` and `(rfqId, createdAt)`.
* **`AuctionEvent` (1:N with `RFQ`, optional N:1 with `Bid`):** Audit trail (`type`, `reason`, `oldCloseTime`, `newCloseTime`, `createdAt`), indexed on `(rfqId, createdAt)`.

