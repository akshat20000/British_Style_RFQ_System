import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export type ExtensionTrigger = 'BID_RECEIVED' | 'ANY_RANK_CHANGE' | 'L1_RANK_CHANGE';
export type AuctionStatus = 'ACTIVE' | 'CLOSED' | 'FORCE_CLOSED';

export interface AuctionConfig {
  id: string;
  rfqId: string;
  triggerWindowMinutes: number;
  extensionMinutes: number;
  extensionTrigger: ExtensionTrigger;
}

export interface Bid {
  id: string;
  rfqId: string;
  supplierId: string;
  supplierName: string;
  amount: string | number;
  freightCharges?: string | number | null;
  originCharges?: string | number | null;
  destinationCharges?: string | number | null;
  transitTime?: number | null;
  quoteValidity?: string | null;
  createdAt: string;
}

export interface AuctionEvent {
  id: string;
  rfqId: string;
  type: 'BID_SUBMITTED' | 'AUCTION_EXTENDED' | 'AUCTION_CLOSED' | string;
  reason?: string | null;
  bidId?: string | null;
  oldCloseTime?: string | null;
  newCloseTime?: string | null;
  createdAt: string;
}

export interface RFQ {
  id: string;
  name: string;
  referenceId: string;
  startTime: string;
  closeTime: string;
  forcedCloseTime: string;
  pickupServiceDate?: string | null;
  status: AuctionStatus;
  auctionConfig?: AuctionConfig | null;
  bids?: Bid[];
  events?: AuctionEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRFQPayload {
  name: string;
  referenceId: string;
  startTime: string;
  closeTime: string;
  forcedCloseTime: string;
  pickupServiceDate?: string;
  triggerWindowMinutes: number;
  extensionMinutes: number;
  extensionTrigger: ExtensionTrigger;
}

export interface SubmitBidPayload {
  supplierId: string;
  supplierName: string;
  amount: number;
  freightCharges?: number;
  originCharges?: number;
  destinationCharges?: number;
  transitTime?: number;
  quoteValidity?: string;
}

export const getRFQs = async (): Promise<RFQ[]> => {
  const res = await api.get('/rfqs');
  return res.data.data;
};

export const getRFQById = async (id: string): Promise<RFQ> => {
  const res = await api.get(`/rfqs/${id}`);
  return res.data.data;
};

export const createRFQ = async (payload: CreateRFQPayload): Promise<RFQ> => {
  const res = await api.post('/rfqs', payload);
  return res.data.data;
};

// Check your bid.routes.ts if the POST path is `/bids/:rfqId` vs `/rfqs/:rfqId/bids`
export const submitBid = async (rfqId: string, payload: SubmitBidPayload) => {
  const res = await api.post(`/bids/${rfqId}`, payload);
  return res.data;
};