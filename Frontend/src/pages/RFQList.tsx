import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRFQs, type RFQ } from '../api/api';

export default function RFQList() {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRFQs = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getRFQs();
      setRfqs(Array.isArray(list) ? list : []);
    } catch (err: any) {
      setError(
        err?.response
          ? `HTTP ${err.response.status}: ${JSON.stringify(err.response.data)}`
          : err.message || 'Network/CORS Error'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRFQs();
  }, []);

  return (
    <div style={{ padding: '24px', maxWidth: '1100px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>British Auction RFQs</h1>
        <div>
          <button onClick={fetchRFQs} style={{ marginRight: '10px', padding: '8px 14px', cursor: 'pointer' }}>
            Refresh
          </button>
          <Link to="/create">
            <button style={{ padding: '8px 16px', background: '#0066cc', color: '#fff', border: 'none', cursor: 'pointer' }}>
              + Create RFQ
            </button>
          </Link>
        </div>
      </div>

      {loading && <p>Loading RFQs...</p>}

      {error && (
        <div style={{ padding: '12px', background: '#ffe6e6', border: '1px solid #cc0000', marginBottom: '16px' }}>
          <strong>API Error:</strong>
          <pre style={{ whiteSpace: 'pre-wrap', margin: '8px 0 0' }}>{error}</pre>
        </div>
      )}

      {!loading && !error && rfqs.length === 0 && (
        <p>No RFQs found. Click "+ Create RFQ" to create one.</p>
      )}

      {rfqs.length > 0 && (
        <table border={1} cellPadding={10} style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f4f4f4' }}>
              <th>RFQ Name / Ref ID</th>
              <th>Current Lowest Bid</th>
              <th>Current Close Time</th>
              <th>Forced Close Time</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rfqs.map((rfq) => (
              <tr key={rfq.id}>
                <td>
                  <strong>{rfq.name}</strong>
                  <br />
                  <small style={{ color: '#666' }}>{rfq.referenceId}</small>
                </td>
                <td>
                  {rfq.bids && rfq.bids.length > 0 ? rfq.bids[0].amount : 'No bids yet'}
                </td>
                <td>{new Date(rfq.closeTime).toLocaleString()}</td>
                <td>{new Date(rfq.forcedCloseTime).toLocaleString()}</td>
                <td>
                  <strong>{rfq.status}</strong>
                </td>
                <td>
                  <Link to={`/rfqs/${rfq.id}`}>
                    <button style={{ padding: '6px 12px', cursor: 'pointer' }}>View Auction</button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}