import { useState } from 'react';

const INITIAL_MENU = {
  starters: [
    { id: 1, name: 'Black Cod Miso', description: 'Miso-marinated black cod, broiled', price: '$38', available: true },
    { id: 2, name: 'Toro Tartare',   description: 'Bluefin tuna belly, caviar, crispy rice', price: '$52', available: true },
    { id: 3, name: 'Rock Shrimp',    description: 'Crispy shrimp, creamy spicy sauce', price: '$32', available: false },
  ],
  mains: [
    { id: 4, name: 'Wagyu Skewer',   description: 'A5 Japanese Wagyu, teriyaki glaze', price: '$85', available: true },
    { id: 5, name: 'Lobster Truffle',description: 'Maine lobster, black truffle butter', price: '$78', available: true },
  ],
  desserts: [
    { id: 6, name: 'Yuzu Cheesecake', description: 'Japanese yuzu curd, miso caramel', price: '$18', available: true },
    { id: 7, name: 'Mochi Trio',      description: 'Matcha, sesame, yuzu mochi',        price: '$16', available: true },
  ],
};

export default function DashboardMenu() {
  const [menu, setMenu] = useState(INITIAL_MENU);
  const [activeCategory, setActiveCategory] = useState('starters');
  const [editingItem, setEditingItem] = useState(null);
  const [saved, setSaved] = useState(false);

  const toggleAvailable = (category, id) => {
    setMenu(prev => ({
      ...prev,
      [category]: prev[category].map(item =>
        item.id === id ? { ...item, available: !item.available } : item
      )
    }));
  };

  const updateItem = (category, id, field, value) => {
    setMenu(prev => ({
      ...prev,
      [category]: prev[category].map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const addItem = (category) => {
    const newId = Date.now();
    setMenu(prev => ({
      ...prev,
      [category]: [...prev[category], { id: newId, name: 'New Item', description: 'Description', price: '$0', available: true }]
    }));
    setEditingItem(newId);
  };

  const deleteItem = (category, id) => {
    setMenu(prev => ({
      ...prev,
      [category]: prev[category].filter(item => item.id !== id)
    }));
  };

  const totalItems     = Object.values(menu).flat().length;
  const availableItems = Object.values(menu).flat().filter(i => i.available).length;

  return (
    <div style={{ padding: '32px', fontFamily: "'Outfit', sans-serif", color: '#E2E8F0', background: '#08090B', minHeight: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: 700, color: '#E2E8F0', marginBottom: '6px' }}>
            Menu Manager
          </h1>
          <p style={{ color: '#718096', fontSize: '13px' }}>
            {availableItems} of {totalItems} items currently available
          </p>
        </div>
        <button onClick={handleSave} style={{ background: saved ? 'rgba(72,187,120,0.2)' : 'linear-gradient(135deg, #D4A847, #F0C96A)', border: saved ? '1px solid rgba(72,187,120,0.4)' : 'none', borderRadius: '8px', padding: '12px 28px', color: saved ? '#48BB78' : '#070608', fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.3s', fontFamily: "'Outfit', sans-serif" }}>
          {saved ? '✓ Saved!' : 'Save Menu'}
        </button>
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {Object.keys(menu).map(cat => {
          const count = menu[cat].length;
          const available = menu[cat].filter(i => i.available).length;
          return (
            <button key={cat} onClick={() => setActiveCategory(cat)} style={{ background: activeCategory === cat ? 'rgba(99,179,237,0.12)' : '#161820', border: `1px solid ${activeCategory === cat ? 'rgba(99,179,237,0.3)' : 'rgba(255,255,255,0.07)'}`, color: activeCategory === cat ? '#63B3ED' : '#718096', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {cat}
              <span style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '100px', padding: '2px 8px', fontSize: '10px' }}>{available}/{count}</span>
            </button>
          );
        })}
      </div>

      {/* Menu items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
        {menu[activeCategory].map(item => (
          <div key={item.id} style={{ background: '#161820', border: `1px solid ${item.available ? 'rgba(99,179,237,0.08)' : 'rgba(255,255,255,0.04)'}`, borderRadius: '10px', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px', opacity: item.available ? 1 : 0.5, transition: 'all 0.2s' }}>

          {/* Available toggle */}
          <div onClick={() => toggleAvailable(activeCategory, item.id)} style={{ width: '40px', height: '22px', borderRadius: '100px', background: item.available ? '#48BB78' : 'rgba(255,255,255,0.1)', position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background 0.2s' }}>
            <div style={{ position: 'absolute', top: '3px', left: item.available ? '21px' : '3px', width: '16px', height: '16px', borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
          </div>

          {/* Content — editable on click */}
          {editingItem === item.id ? (
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 2fr auto', gap: '10px', alignItems: 'center' }}>
              <input value={item.name} onChange={e => updateItem(activeCategory, item.id, 'name', e.target.value)}
                style={{ background: '#0F1117', border: '1px solid rgba(99,179,237,0.3)', borderRadius: '6px', padding: '8px 12px', color: '#E2E8F0', fontSize: '14px', fontFamily: "'Outfit', sans-serif" }} />
              <input value={item.description} onChange={e => updateItem(activeCategory, item.id, 'description', e.target.value)}
                style={{ background: '#0F1117', border: '1px solid rgba(99,179,237,0.3)', borderRadius: '6px', padding: '8px 12px', color: '#E2E8F0', fontSize: '14px', fontFamily: "'Outfit', sans-serif" }} />
              <input value={item.price} onChange={e => updateItem(activeCategory, item.id, 'price', e.target.value)}
                style={{ background: '#0F1117', border: '1px solid rgba(99,179,237,0.3)', borderRadius: '6px', padding: '8px 12px', color: '#D4A847', fontSize: '14px', fontFamily: "'Fira Code', monospace", width: '80px' }} />
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: '15px', marginBottom: '3px' }}>{item.name}</div>
                <div style={{ color: '#718096', fontSize: '13px' }}>{item.description}</div>
              </div>
              <div style={{ color: '#D4A847', fontFamily: "'Fira Code', monospace", fontSize: '16px', marginRight: '8px' }}>{item.price}</div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            <button onClick={() => setEditingItem(editingItem === item.id ? null : item.id)} style={{ background: editingItem === item.id ? 'rgba(99,179,237,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${editingItem === item.id ? 'rgba(99,179,237,0.3)' : 'rgba(255,255,255,0.08)'}`, color: editingItem === item.id ? '#63B3ED' : '#718096', borderRadius: '6px', padding: '7px 14px', cursor: 'pointer', fontSize: '12px', fontFamily: "'Outfit', sans-serif" }}>
              {editingItem === item.id ? '✓ Done' : '✏️ Edit'}
            </button>
            <button onClick={() => deleteItem(activeCategory, item.id)} style={{ background: 'transparent', border: '1px solid rgba(252,129,129,0.15)', color: '#FC8181', borderRadius: '6px', padding: '7px 14px', cursor: 'pointer', fontSize: '12px', fontFamily: "'Outfit', sans-serif" }}>
              🗑
            </button>
          </div>
        </div>
        ))}
      </div>

      {/* Add item button */}
      <button onClick={() => addItem(activeCategory)} style={{ width: '100%', background: 'transparent', border: '1px dashed rgba(99,179,237,0.2)', borderRadius: '10px', padding: '14px', color: '#63B3ED', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontFamily: "'Outfit', sans-serif", transition: 'all 0.2s' }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,179,237,0.05)'; e.currentTarget.style.borderColor = 'rgba(99,179,237,0.4)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(99,179,237,0.2)'; }}>
        + Add {activeCategory.slice(0, -1)} item
      </button>
    </div>
  );
}
