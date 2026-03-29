import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Credits() {
  const { user, getCredits, getCreditHistory, redeemCredits } = useAuth();
  const [credits, setCredits] = useState(null);
  const [history, setHistory] = useState([]);
  const [busyReward, setBusyReward] = useState('');

  useEffect(() => {
    const load = async () => {
      const [creditData, historyData] = await Promise.all([getCredits(), getCreditHistory()]);
      if (creditData) setCredits(creditData);
      if (historyData) setHistory(historyData.history || []);
    };
    load();
  }, []);

  const onRedeem = async (id) => {
    setBusyReward(id);
    const result = await redeemCredits(id);
    if (result) {
      const [creditData, historyData] = await Promise.all([getCredits(), getCreditHistory()]);
      if (creditData) setCredits(creditData);
      if (historyData) setHistory(historyData.history || []);
    }
    setBusyReward('');
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px 24px 60px' }}>
      <h1 style={{ color: '#F5F0E8', marginBottom: '10px' }}>DINE Credits</h1>
      <p style={{ color: '#9A9490', marginTop: 0 }}>Earn rewards every time you dine with DINE.AI.</p>

      <div style={{
        background: 'linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.04))',
        border: '1px solid rgba(201,168,76,0.3)',
        borderRadius: '14px',
        padding: '24px',
        marginBottom: '20px',
      }}>
        <div style={{ color: '#9A9490', fontSize: '13px' }}>Current balance</div>
        <div style={{ color: '#F5F0E8', fontSize: '42px', marginTop: '4px' }}>🪙 {credits?.balance ?? user?.dine_credits ?? 0}</div>
        <div style={{ color: '#9A9490', fontSize: '13px', marginTop: '8px' }}>
          Membership: {credits?.membership_tier || user?.membership_tier || 'standard'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        <div style={{ background: '#18181C', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ marginTop: 0, color: '#C9A84C' }}>Earn Opportunities</h3>
          <ul style={{ margin: 0, paddingLeft: '18px', color: '#F5F0E8', lineHeight: 1.8 }}>
            <li>First booking: +50 credits</li>
            <li>Each booking: +10 credits</li>
            <li>Refer a friend: +100 credits</li>
            <li>Write a review: +20 credits</li>
            <li>Birthday month: +50 credits</li>
          </ul>
        </div>

        <div style={{ background: '#18181C', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ marginTop: 0, color: '#C9A84C' }}>Redeem Rewards</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(credits?.available_rewards || []).map((reward) => (
              <button
                key={reward.id}
                onClick={() => onRedeem(reward.id)}
                disabled={busyReward === reward.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#0A0A0B',
                  color: '#F5F0E8',
                  border: '1px solid rgba(201,168,76,0.25)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  cursor: 'pointer',
                }}
              >
                <span>{reward.title}</span>
                <span style={{ color: '#C9A84C' }}>{reward.cost} credits</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: '#18181C', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px' }}>
        <h3 style={{ marginTop: 0, color: '#C9A84C' }}>Credits History</h3>
        {history.length === 0 ? <p style={{ color: '#9A9490' }}>No transactions yet.</p> : null}
        {history.map((item) => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 0' }}>
            <div>
              <div style={{ color: '#F5F0E8' }}>{item.note}</div>
              <div style={{ color: '#9A9490', fontSize: '12px' }}>{new Date(item.created_at).toLocaleString()}</div>
            </div>
            <div style={{ color: item.amount >= 0 ? '#10B981' : '#EF4444', fontWeight: 600 }}>
              {item.amount >= 0 ? '+' : ''}{item.amount}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
