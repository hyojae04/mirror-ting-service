import { useEffect, useRef, useState } from 'react';
import { CounterpartVideo } from './CounterpartVideo';
import { Camera } from 'reicon-react/icons/Camera';
import { Microphone } from 'reicon-react/icons/Microphone';
import { Volume } from 'reicon-react/icons/Volume';
import { Refresh3 } from 'reicon-react/icons/Refresh3';
import { startTurnSpeech } from '../../lib/turnSpeechPlayback';
import { practiceSpeechOptions } from '../../lib/practiceSpeechOptions';

export function SimulationMediaStage({ name, message, messageId, active, busy, listening, canDictate, onDictate, devices, answered, turns }) {
  const { stream, connecting, error: mediaError, connect } = devices;
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [replay, setReplay] = useState(0);
  const [speechUnavailable, setSpeechUnavailable] = useState(false);
  const videoRef = useRef(null);
  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);
  useEffect(() => { setCameraOn(true); setMicOn(true); }, [stream]);
  useEffect(() => {
    stream?.getVideoTracks().forEach(track => { track.enabled = cameraOn; });
    stream?.getAudioTracks().forEach(track => { track.enabled = micOn; });
  }, [stream, cameraOn, micOn]);
  useEffect(() => {
    if (!message || !audioEnabled) return undefined;
    setSpeechUnavailable(false);
    return startTurnSpeech({
      text: message, ...practiceSpeechOptions(message), onSpeakingChange: setSpeaking,
      onFinish: () => {}, onNote: () => {},
      onProgress: progress => { if (progress.status === 'unavailable') setSpeechUnavailable(true); },
    });
  }, [messageId, message, audioEnabled, replay]);

  return <section className="simulation-media" aria-label="영상·음성 대화 연습">
    <div className="simulation-stage-heading"><span><i aria-hidden="true" /> AI와 대화 연습</span><span>{answered} / {turns}턴</span></div>
    <div className="simulation-avatar" data-speaking={speaking}>
      <CounterpartVideo characterId="kim_teamlead" name={name} state={speaking ? 'speaking' : 'listening'} />
      <div className="simulation-avatar-caption"><strong>{name}</strong><span role="status">{speaking ? '말하는 중' : busy ? '답변 준비 중' : active ? '내 답변을 기다리고 있어요' : '연습 완료'}</span></div>
      {message && <p className="simulation-avatar-line">{message}</p>}
      <div className="simulation-camera" aria-label="내 카메라 미리보기">
        <video ref={videoRef} autoPlay muted playsInline hidden={!stream || !cameraOn} aria-label="내 카메라 영상" />
        {(!stream || !cameraOn) && <span>{stream ? '카메라 꺼짐' : '내 카메라'}</span>}
      </div>
    </div>
    <div className="simulation-media-controls">
      {!stream && <button type="button" onClick={connect} disabled={connecting || !active}>{connecting ? '장치 연결 중…' : '카메라·마이크 켜기'}</button>}
      {stream && <>
        <button type="button" aria-label={`카메라 ${cameraOn ? '끄기' : '켜기'}`} aria-pressed={cameraOn} onClick={() => setCameraOn(value => !value)}><Camera size={18} aria-hidden="true" /><span>카메라 {cameraOn ? '끄기' : '켜기'}</span></button>
        <button type="button" aria-label={`마이크 ${micOn ? '끄기' : '켜기'}`} aria-pressed={micOn} onClick={() => { if (listening) onDictate(); setMicOn(value => !value); }}><Microphone size={18} aria-hidden="true" /><span>마이크 {micOn ? '끄기' : '켜기'}</span></button>
      </>}
      <button type="button" className="simulation-dictate-button" aria-label={listening ? '음성 입력 중지' : '음성으로 답변 입력'} aria-pressed={listening} onClick={onDictate} disabled={!active || busy || speaking || !canDictate || (stream && !micOn)}><Microphone size={18} aria-hidden="true" /><span>{listening ? '음성 입력 중지' : '음성으로 답변 입력'}</span></button>
      <button type="button" aria-label={`AI 음성 ${audioEnabled ? '끄기' : '켜기'}`} aria-pressed={audioEnabled} onClick={() => setAudioEnabled(value => !value)}><Volume size={18} aria-hidden="true" /><span>AI 음성 {audioEnabled ? '끄기' : '켜기'}</span></button>
      {message && !speaking && <button type="button" aria-label="상대 대사 다시 듣기" disabled={listening} onClick={() => { setAudioEnabled(true); setReplay(value => value + 1); }}><Refresh3 size={18} aria-hidden="true" /><span>다시 듣기</span></button>}
    </div>
    <p className="simulation-media-note" role="status">{listening ? '듣고 있어요. 인식된 답변을 확인한 뒤 전송해주세요.' : '카메라는 내 화면에서만 표시돼요. 음성 입력은 글자로 바뀌며, 확인 후 전송할 수 있어요.'}</p>
    {!canDictate && <p className="simulation-media-note">음성 인식은 Chrome 또는 Edge에서 사용할 수 있어요. 현재 브라우저에서는 직접 입력해주세요.</p>}
    {speechUnavailable && <p className="simulation-media-note" role="status">상대 음성을 재생하지 못했어요. 대사를 읽거나 다시 듣기를 눌러주세요.</p>}
    {mediaError && <p className="simulation-chat-error" role="alert">{mediaError}</p>}
  </section>;
}
