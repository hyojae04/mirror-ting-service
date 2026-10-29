import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { SimulationDeviceModal } from '../../components/practice/SimulationDeviceModal';
import { useSimulationDevices } from '../../lib/useSimulationDevices';

function Preview() {
  const [open, setOpen] = useState(true);
  const [checked, setChecked] = useState(false);
  const devices = useSimulationDevices();
  const close = () => { devices.release(); setOpen(false); };
  return <main style={{ minHeight: '100svh', boxSizing: 'border-box', display: 'grid', placeContent: 'center', gap: 20, padding: 32, background: '#f6f7f9', color: '#18181b', fontFamily: 'system-ui, sans-serif', '--mode-accent': '#0868ee' }}>
    <span style={{ color: '#71717a', fontSize: 13 }}>Mirror-Ting · 모달 미리보기</span>
    <h1 style={{ margin: 0, fontSize: 30 }}>Lovable 스타일 장치 확인</h1>
    <p style={{ maxWidth: 460, lineHeight: 1.8, color: '#71717a' }}>중앙 카드와 간결한 버튼 구성을 적용한 미러팅용 모달이에요. 허용 버튼을 누르기 전에는 장치를 사용하지 않아요.</p>
    {checked && <p role="status">장치 확인을 마쳤어요. 실제 서비스에서는 아바타 시뮬레이션으로 이어집니다.</p>}
    <button type="button" onClick={() => { setChecked(false); setOpen(true); }} style={{ minHeight: 44, padding: '10px 20px', border: 0, borderRadius: 10, background: '#18181b', color: 'white', cursor: 'pointer', font: 'inherit' }}>장치 확인 모달 열기</button>
    <a href="/?service=workplace" style={{ color: '#0868ee' }}>실제 서비스로 이동 →</a>
    <SimulationDeviceModal open={open} devices={devices} onCancel={close} onStart={() => { setChecked(true); close(); }} />
  </main>;
}

createRoot(document.getElementById('root')).render(<Preview />);
