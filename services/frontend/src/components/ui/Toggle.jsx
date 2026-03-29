export default function Toggle({ on, onChange }) {
    return (
        <div onClick={onChange} style={{ width: 40, height: 22, borderRadius: 100, background: on ? '#48bb78' : 'rgba(255,255,255,0.08)', position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background .2s' }}>
            <div style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: 'white', transition: 'left .2s' }} />
        </div>
    );
}
