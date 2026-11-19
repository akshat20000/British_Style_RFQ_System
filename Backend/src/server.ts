import "dotenv/config";
import express from "express";
import cors from "cors";

import rfqRoutes from "./routes/rfq.routes";
import bidRoutes from "./routes/bid.routes";

const app = express();

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "RFQ Auction API is running",
  });
});

app.use("/api/rfqs", rfqRoutes);
app.use("/api/bids", bidRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});