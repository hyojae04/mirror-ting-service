// One listening window per user turn. Stop after a pause, then submit final text.
export function startAutomaticAnswer({ Recognition, onText, onAnswer, onListening, onError, pauseMs = 1400 }) {
  let recognition, silence, retry, disposed = false, transcript = '';
  const start = () => {
    if (disposed) return;
    transcript = '';
    const speech = new Recognition();
    recognition = speech;
    speech.lang = 'ko-KR';
    speech.continuous = true;
    speech.interimResults = true;
    speech.onresult = event => {
      transcript = Array.from(event.results).map(result => result[0].transcript).join(' ').trim();
      onText(transcript);
      clearTimeout(silence);
      if (transcript) silence = setTimeout(() => speech.stop(), pauseMs);
    };
    speech.onerror = event => {
      if (disposed || event.error === 'aborted' || event.error === 'no-speech') return;
      disposed = true;
      clearTimeout(silence);
      onListening(false);
      onError('자동 음성 인식을 멈췄어요. 마이크 권한을 확인하고 다시 시작해주세요.');
    };
    speech.onend = () => {
      clearTimeout(silence);
      onListening(false);
      if (disposed) return;
      if (transcript) { disposed = true; onAnswer(transcript); }
      else retry = setTimeout(start, 500);
    };
    try { speech.start(); onListening(true); }
    catch { disposed = true; onError('자동 음성 인식을 시작하지 못했어요. 마이크 권한을 확인해주세요.'); }
  };
  start();
  return () => {
    disposed = true;
    clearTimeout(silence); clearTimeout(retry);
    if (recognition) {
      recognition.onresult = recognition.onend = recognition.onerror = null;
      recognition.abort();
    }
    onListening(false);
  };
}
