import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createRFQ, type ExtensionTrigger } from '../api/api';

export default function CreateRFQ() {
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [referenceId, setReferenceId] = useState('');
    const [startTime, setStartTime] = useState('');
    const [closeTime, setCloseTime] = useState('');
    const [forcedCloseTime, setForcedCloseTime] = useState('');
    const [pickupServiceDate, setPickupServiceDate] = useState('');
    const [triggerWindowMinutes, setTriggerWindowMinutes] = useState<number>(10);
    const [extensionMinutes, setExtensionMinutes] = useState<number>(5);
    const [extensionTrigger, setExtensionTrigger] =
        useState<ExtensionTrigger>('BID_RECEIVED');

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (new Date(forcedCloseTime) <= new Date(closeTime)) {
            setError('Forced Bid Close Time must be later than Bid Close Time.');
            return;
        }

        setSubmitting(true);
        try {
            await createRFQ({
                name,
                referenceId,
                startTime: new Date(startTime).toISOString(),
                closeTime: new Date(closeTime).toISOString(),
                forcedCloseTime: new Date(forcedCloseTime).toISOString(),
                pickupServiceDate: pickupServiceDate
                    ? new Date(pickupServiceDate).toISOString()
                    : undefined,
                triggerWindowMinutes: Number(triggerWindowMinutes),
                extensionMinutes: Number(extensionMinutes),
                extensionTrigger,
            });
            navigate('/');
        } catch (err: any) {
            setError(
                err?.response
                    ? `HTTP ${err.response.status}: ${JSON.stringify(err.response.data)}`
                    : err.message || 'Failed to create RFQ'
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ padding: '24px', maxWidth: '720px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Create British Auction RFQ</h1>
                <Link to="/">← Back to RFQs</Link>
            </div>

            {error && (
                <div style={{ padding: '12px', background: '#ffe6e6', border: '1px solid #cc0000', marginBottom: '16px' }}>
                    <strong>Error:</strong>
                    <pre style={{ whiteSpace: 'pre-wrap', margin: '8px 0 0' }}>{error}</pre>
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px' }}>
                <label>
                    RFQ Name
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Mumbai to Delhi Freight Lane"
                        style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                    />
                </label>

                <label>
                    Reference ID
                    <input
                        type="text"
                        required
                        value={referenceId}
                        onChange={(e) => setReferenceId(e.target.value)}
                        placeholder="e.g. RFQ-2026-001"
                        style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                    />
                </label>

                <label>
                    Bid Start Date & Time
                    <input
                        type="datetime-local"
                        required
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                    />
                </label>

                <label>
                    Bid Close Date & Time
                    <input
                        type="datetime-local"
                        required
                        value={closeTime}
                        onChange={(e) => setCloseTime(e.target.value)}
                        style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                    />
                </label>

                <label>
                    Forced Bid Close Date & Time
                    <input
                        type="datetime-local"
                        required
                        value={forcedCloseTime}
                        onChange={(e) => setForcedCloseTime(e.target.value)}
                        style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                    />
                </label>

                <label>
                    Pickup / Service Date
                    <input
                        type="date"
                        value={pickupServiceDate}
                        onChange={(e) => setPickupServiceDate(e.target.value)}
                        style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                    />
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <label>
                        Trigger Window X (minutes)
                        <input
                            type="number"
                            min={1}
                            required
                            value={triggerWindowMinutes}
                            onChange={(e) => setTriggerWindowMinutes(Number(e.target.value))}
                            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                        />
                    </label>

                    <label>
                        Extension Duration Y (minutes)
                        <input
                            type="number"
                            min={1}
                            required
                            value={extensionMinutes}
                            onChange={(e) => setExtensionMinutes(Number(e.target.value))}
                            style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                        />
                    </label>
                </div>

                <label>
                    Extension Trigger Type
                    <select
                        value={extensionTrigger}
                        onChange={(e) => setExtensionTrigger(e.target.value as ExtensionTrigger)}
                        style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                    >
                        <option value="BID_RECEIVED">Bid Received in Last X Minutes</option>
                        <option value="ANY_RANK_CHANGE">Any Supplier Rank Change in Last X Minutes</option>
                        <option value="L1_RANK_CHANGE">Lowest Bidder (L1) Rank Change in Last X Minutes</option>
                    </select>
                </label>

                <button
                    type="submit"
                    disabled={submitting}
                    style={{ padding: '10px 18px', background: '#0066cc', color: '#fff', border: 'none', cursor: 'pointer', marginTop: '6px' }}
                >
                    {submitting ? 'Creating...' : 'Create RFQ'}
                </button>
            </form>
        </div>
    );
}