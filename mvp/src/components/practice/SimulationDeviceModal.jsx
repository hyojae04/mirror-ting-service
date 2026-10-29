import { useEffect, useRef, useState } from 'react';
import { Camera } from 'reicon-react/icons/Camera';
import { Microphone } from 'reicon-react/icons/Microphone';
import { X } from 'reicon-react/icons/X';
import '../../styles/simulation-device-modal.css';

export function SimulationDeviceModal({ open, devices, onCancel, onStart, busy = false, error = '' }) {
  const dialogRef = useRef(null);
  const videoRef = useRef(null);
  const cameraCheckRef = useRef(null);
  const [cameraChecked, setCameraChecked] = useState(false);
  const [micChecked, setMicChecked] = useState(false);
  const [level, setLevel] = useState(0);
  const [meterReady, setMeterReady] = useState(false);
  const canStart = devices.ready && cameraChecked && micChecked && !busy;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && !dialog.open) { dialog.showModal(); dialog.querySelector('.device-modal-primary')?.focus(); }
    if (!open && dialog.open) dialog.close();
  }, [open]);
  useEffect(() => { setCameraChecked(false); setMicChecked(false); }, [open, devices.stream]);
  useEffect(() => { if (open && devices.ready) cameraCheckRef.current?.focus(); }, [open, devices.ready]);
  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = open ? devices.stream : null;
  }, [open, devices.stream]);
  useEffect(() => {
    setLevel(0); setMeterReady(false);
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!open || !devices.stream || !AudioContext) return undefined;
    let context, source, timer, cancelled = false;
    try {
      context = new AudioContext();
      source = context.createMediaStreamSource(devices.stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      const samples = new Float32Array(analyser.fftSize);
      const sample = () => {
        if (cancelled) return;
        analyser.getFloatTimeDomainData(samples);
        const rms = Math.sqrt(samples.reduce((sum, value) => sum + value * value, 0) / samples.length);
        setLevel(Math.min(1, rms * 8));
        setMeterReady(context.state === 'running');
      };
      void context.resume().then(sample).catch(() => {});
      timer = window.setInterval(sample, 100);
    } catch { /* Device check remains available when Web Audio is unsupported. */ }
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      source?.disconnect();
      if (context && context.state !== 'closed') void context.close().catch(() => {});
    };
  }, [open, devices.stream]);

  return <dialog ref={dialogRef} className="simulation-device-modal" aria-labelledby="device-modal-title" aria-describedby="device-modal-description" onCancel={event => { event.preventDefault(); onCancel(); }}>
    <button className="device-modal-close" type="button" aria-label="장치 확인 닫기" onClick={onCancel}><X size={18} /></button>
    <div className="device-modal-icon" aria-hidden="true"><Camera size={24} /></div>
    <p className="device-modal-eyebrow">시나리오 설계 완료</p>
    <h2 id="device-modal-title">대화를 시작할 준비가 됐나요?</h2>
    <p id="device-modal-description">카메라와 마이크를 확인한 뒤<br />AI 상대와 시뮬레이션을 시작해요.</p>
    <ol className="device-modal-steps" aria-label="시뮬레이션 시작 순서"><li data-complete={devices.ready}>1 <span>권한 허용</span></li><li data-complete={cameraChecked && micChecked}>2 <span>장치 확인</span></li><li>3 <span>대화 시작</span></li></ol>
    <div className="device-check-preview">
      <video ref={videoRef} autoPlay muted playsInline hidden={!devices.ready} aria-label="장치 확인 카메라 미리보기" />
      {!devices.ready && <div className="device-preview-empty"><Camera size={32} aria-hidden="true" /><span>{devices.connecting ? '브라우저의 권한 요청을 확인해주세요' : '내 카메라가 여기에 표시돼요'}</span></div>}
      {devices.ready && <span className="device-preview-label">내 카메라 · 연결됨</span>}
    </div>
    <div className="device-mic-check"><Microphone size={18} aria-hidden="true" /><div><strong>{devices.ready ? '마이크가 연결됐어요' : '카메라와 마이크 권한이 필요해요'}</strong><p>{devices.ready ? meterReady ? '짧게 말하고 입력 막대가 움직이는지 확인해주세요.' : '마이크 연결과 브라우저의 입력 상태를 확인해주세요.' : '허용 버튼을 누르면 브라우저가 권한을 요청해요.'}</p></div></div>
    {devices.ready && <>
      <meter className="device-mic-meter" min="0" max="1" value={level} aria-label="마이크 입력 크기" />
      <div className="device-check-confirmations"><label><input ref={cameraCheckRef} type="checkbox" checked={cameraChecked} onChange={event => setCameraChecked(event.target.checked)} />내 모습이 잘 보여요</label><label><input type="checkbox" checked={micChecked} onChange={event => setMicChecked(event.target.checked)} />마이크 입력을 확인했어요</label></div>
    </>}
    {(devices.error || error) && <p className="device-modal-error" role="alert">{devices.error || error}</p>}
    <p className="device-modal-privacy">영상은 서버에 저장하지 않아요. 음성 입력은 텍스트로 변환한 뒤 AI에 전달해요.</p>
    <div className="device-modal-actions">
      <button type="button" className="device-modal-secondary" onClick={onCancel}>설정으로 돌아가기</button>
      {devices.ready ? <button type="button" className="device-modal-primary" disabled={!canStart} onClick={onStart}>{busy ? '시뮬레이션 준비 중…' : '시뮬레이션 시작'}</button> : <button type="button" autoFocus className="device-modal-primary" disabled={devices.connecting} onClick={devices.connect}>{devices.connecting ? '권한 확인 중…' : devices.error ? '다시 연결하기' : '카메라·마이크 허용하기'}</button>}
    </div>
  </dialog>;
}
