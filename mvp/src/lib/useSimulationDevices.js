import { useCallback, useEffect, useRef, useState } from 'react';
import { requestCapture } from './mediaRequest';

export function useSimulationDevices() {
  const [stream, setStream] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const streamRef = useRef(null);
  const epoch = useRef(0);
  const pending = useRef(false);

  const release = useCallback(() => {
    epoch.current++;
    pending.current = false;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    setStream(null); setConnecting(false); setError('');
  }, []);
  useEffect(() => () => {
    epoch.current++;
    streamRef.current?.getTracks().forEach(track => track.stop());
  }, []);

  useEffect(() => {
    if (!stream) return undefined;
    const ended = () => {
      release();
      setError('장치 연결이 끊겼어요. 카메라와 마이크를 다시 연결해주세요.');
    };
    const tracks = stream.getTracks();
    tracks.forEach(track => track.addEventListener('ended', ended));
    return () => tracks.forEach(track => track.removeEventListener('ended', ended));
  }, [stream, release]);

  const connect = useCallback(async () => {
    if (pending.current) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('카메라·마이크를 지원하는 브라우저에서 접속해주세요.');
      return;
    }
    const requestEpoch = ++epoch.current;
    pending.current = true; setConnecting(true); setError('');
    try {
      const captured = await requestCapture(navigator.mediaDevices, {
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      if (requestEpoch !== epoch.current) { captured.getTracks().forEach(track => track.stop()); return; }
      if (![captured.getVideoTracks(), captured.getAudioTracks()].every(tracks => tracks.some(track => track.readyState === 'live'))) {
        captured.getTracks().forEach(track => track.stop());
        throw new DOMException('Missing camera or microphone', 'NotFoundError');
      }
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = captured; setStream(captured);
    } catch (failure) {
      if (requestEpoch !== epoch.current) return;
      setError(failure.name === 'NotAllowedError'
        ? '권한이 차단됐어요. 주소창의 사이트 설정에서 카메라와 마이크를 허용한 뒤 다시 시도해주세요.'
        : failure.name === 'NotFoundError'
          ? '카메라와 마이크가 모두 연결되어 있는지 확인해주세요.'
          : '장치를 연결하지 못했어요. 다른 앱에서 사용 중인지 확인한 뒤 다시 시도해주세요.');
    } finally {
      if (requestEpoch === epoch.current) { pending.current = false; setConnecting(false); }
    }
  }, []);

  return { stream, connecting, error, ready: Boolean(stream), connect, release };
}
