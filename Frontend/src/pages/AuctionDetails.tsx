import { type FormEvent, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getRFQById, type RFQ, submitBid } from '../api/api';

export default function AuctionDetails() {
  const { id } = useParams<{ id: string }>();
  const [rfq, setRfq] = useState<RFQ | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<string>('');

  // Bid form state
  const [supplierId, setSupplierId] = useState('SUP-01');
  const [supplierName, setSupplierName] = useState('');
  const [amount, setAmount] = useState('');
  const [freightCharges, setFreightCharges] = useState('');
  const [originCharges, setOriginCharges] = useState('');
  const [destinationCharges, setDestinationCharges] = useState('');
  const [transitTime, setTransitTime] = useState('');
  const [quoteValidity, setQuoteValidity] = useState('');
  const [bidSubmitting, setBidSubmitting] = useState(false);
  const [bidMessage, setBidMessage] = useState<string | null>(null);

  const loadRFQ = async () => {
    if (!id) return;
    try {
      const data = await getRFQById(id);
      setRfq(data);
      setError(null);
    } catch (err: any) {
      setError(
        err?.response
          ? `HTTP ${err.response.status}: ${JSON.stringify(err.response.data)}`
          : err.message || 'Failed to load RFQ'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRFQ();
  }, [id]);

  // Live countdown timer
  useEffect(() => {
    if (!rfq) return;
    const timer = setInterval(() => {
      const diff = new Date(rfq.closeTime).getTime() - Date.now();
      if (diff <= 0) {
        setCountdown('00:00:00 (Ended)');
        return;
      }
      const hrs = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setCountdown(
        `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [rfq]);

  const handleBidSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setBidSubmitting(true);
    setBidMessage(null);

    try {
      await submitBid(id, {
        supplierId,
        supplierName,
        amount: Number(amount),
        freightCharges: freightCharges ? Number(freightCharges) : undefined,
        originCharges: originCharges ? Number(originCharges) : undefined,
        destinationCharges: destinationCharges ? Number(destinationCharges) : undefined,
        transitTime: transitTime ? Number(transitTime) : undefined,
        quoteValidity: quoteValidity ? new Date(quoteValidity).toISOString() : undefined,
      });
      setBidMessage('Bid submitted successfully!');
      setAmount('');
      await loadRFQ();
    } catch (err: any) {
      setBidMessage(
        err?.response
          ? `Error ${err.response.status}: ${JSON.stringify(err.response.data)}`
          : err.message || 'Bid failed'
      );
    } finally {
      setBidSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading auction...</div>;
  if (error) return <div style={{ padding: 24, color: 'red' }}>{error}</div>;
  if (!rfq) return <div style={{ padding: 24 }}>RFQ not found</div>;

  const lowestBid = rfq.bids && rfq.bids.length > 0 ? rfq.bids[0].amount : 'No bids yet';

  return (
    <div style={{ padding: '24px', maxWidth: '1050px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <Link to="/">← Back to RFQs</Link>
          <h1 style={{ margin: '8px 0 4px' }}>{rfq.name}</h1>
          <small style={{ color: '#666' }}>Ref: {rfq.referenceId} | Status: <strong>{rfq.status}</strong></small>
        </div>
        <button onClick={loadRFQ} style={{ padding: '8px 14px', cursor: 'pointer' }}>Refresh</button>
      </div>

      {/* Summary & Config */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px', padding: '16px', background: '#f7f9fc', border: '1px solid #ddd' }}>
        <div>
          <small>Current Lowest Bid (L1)</small>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{lowestBid}</div>
        </div>
        <div>
          <small>Time Remaining</small>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#0066cc' }}>{countdown}</div>
        </div>
        <div>
          <small>Current Close / Forced Close</small>
          <div><strong>Close:</strong> {new Date(rfq.closeTime).toLocaleString()}</div>
          <div><strong>Forced:</strong> {new Date(rfq.forcedCloseTime).toLocaleString()}</div>
        </div>
        <div>
          <small>British Auction Rules</small>
          <div>Window X: <strong>{rfq.auctionConfig?.triggerWindowMinutes} min</strong></div>
          <div>Extend Y: <strong>{rfq.auctionConfig?.extensionMinutes} min</strong></div>
          <div>Trigger: <strong>{rfq.auctionConfig?.extensionTrigger}</strong></div>
        </div>
      </div>

      {/* Submit Bid Form */}
      <div style={{ marginBottom: '28px', padding: '16px', border: '1px solid #ccc' }}>
        <h3 style={{ marginTop: 0 }}>Submit Supplier Quote</h3>
        {bidMessage && (
          <div style={{ padding: '10px', marginBottom: '12px', background: bidMessage.startsWith('Error') ? '#ffe6e6' : '#e6ffed', border: '1px solid #999' }}>
            {bidMessage}
          </div>
        )}
        <form onSubmit={handleBidSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          <input required placeholder="Supplier ID (e.g. SUP-01)" value={supplierId} onChange={(e) => setSupplierId(e.target.value)} style={{ padding: '8px' }} />
          <input required placeholder="Carrier / Supplier Name" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} style={{ padding: '8px' }} />
          <input required type="number" step="0.01" placeholder="Total Bid Amount *" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ padding: '8px' }} />
          <input type="number" step="0.01" placeholder="Freight Charges" value={freightCharges} onChange={(e) => setFreightCharges(e.target.value)} style={{ padding: '8px' }} />
          <input type="number" step="0.01" placeholder="Origin Charges" value={originCharges} onChange={(e) => setOriginCharges(e.target.value)} style={{ padding: '8px' }} />
          <input type="number" step="0.01" placeholder="Destination Charges" value={destinationCharges} onChange={(e) => setDestinationCharges(e.target.value)} style={{ padding: '8px' }} />
          <input type="number" placeholder="Transit Time (days)" value={transitTime} onChange={(e) => setTransitTime(e.target.value)} style={{ padding: '8px' }} />
          <input type="date" title="Quote Validity" value={quoteValidity} onChange={(e) => setQuoteValidity(e.target.value)} style={{ padding: '8px' }} />
          <button type="submit" disabled={bidSubmitting} style={{ gridColumn: 'span 4', padding: '10px', background: '#0066cc', color: '#fff', border: 'none', cursor: 'pointer' }}>
            {bidSubmitting ? 'Submitting Bid...' : 'Place Bid'}
          </button>
        </form>
      </div>

      {/* Ranked Supplier Bids */}
      <h3>Ranked Supplier Bids</h3>
      <table border={1} cellPadding={8} style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '28px', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: '#f4f4f4' }}>
            <th>Rank</th>
            <th>Supplier</th>
            <th>Total Amount</th>
            <th>Freight / Origin / Dest</th>
            <th>Transit (days)</th>
            <th>Quote Validity</th>
            <th>Submitted At</th>
          </tr>
        </thead>
        <tbody>
          {(!rfq.bids || rfq.bids.length === 0) ? (
            <tr><td colSpan={7}>No bids submitted yet.</td></tr>
          ) : (
            rfq.bids.map((b, idx) => (
              <tr key={b.id} style={{ background: idx === 0 ? '#f0fff4' : 'transparent' }}>
                <td><strong>L{idx + 1}</strong></td>
                <td>{b.supplierName} ({b.supplierId})</td>
                <td><strong>{b.amount}</strong></td>
                <td>{b.freightCharges ?? '-'} / {b.originCharges ?? '-'} / {b.destinationCharges ?? '-'}</td>
                <td>{b.transitTime ?? '-'}</td>
                <td>{b.quoteValidity ? new Date(b.quoteValidity).toLocaleDateString() : '-'}</td>
                <td>{new Date(b.createdAt).toLocaleTimeString()}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Activity Log */}
      <h3>Auction Activity Log</h3>
      <table border={1} cellPadding={8} style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ background: '#f4f4f4' }}>
            <th>Time</th>
            <th>Event</th>
            <th>Reason / Details</th>
            <th>Old Close → New Close</th>
          </tr>
        </thead>
        <tbody>
          {(!rfq.events || rfq.events.length === 0) ? (
            <tr><td colSpan={4}>No activity logged yet.</td></tr>
          ) : (
            rfq.events.map((ev) => (
              <tr key={ev.id}>
                <td>{new Date(ev.createdAt).toLocaleTimeString()}</td>
                <td><strong>{ev.type}</strong></td>
                <td>{ev.reason || '-'}</td>
                <td>
                  {ev.oldCloseTime && ev.newCloseTime
                    ? `${new Date(ev.oldCloseTime).toLocaleTimeString()} → ${new Date(ev.newCloseTime).toLocaleTimeString()}`
                    : '-'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}