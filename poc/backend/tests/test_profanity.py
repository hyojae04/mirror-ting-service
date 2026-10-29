import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.api import simulation_chat as chat
from app.services.profanity import contains_profanity
from test_simulation_chat import BASE, PREPARE, DRAFT


@pytest.mark.parametrize('text', ['ㅈ까', 'ㅈ 까', 'ㅅㅂ', '씨발', '시.발', '병\u200b신', '개새끼', '꺼져', 'ＦＵＣＫ', 'f u c k'])
def test_local_profanity_detection(text):
    assert contains_profanity(text)


@pytest.mark.parametrize('text', ['팀장님 제가 몸이 아파서 먼저 가봐야 할 것 같아요', '네 알겠어요', '니가뭔데', '개발 일정과 시발점을 확인했어요', '시발역에서 출근합니다'])
def test_normal_speech_is_not_blocked(text):
    assert not contains_profanity(text)


@pytest.mark.parametrize('path,body', [
    ('prepare', {**PREPARE, 'prompt': 'ㅈ까'}),
    ('prepare', {**PREPARE, 'messages': [{'role': 'user', 'content': 'ㅅㅂ'}]}),
    ('prepare', {**PREPARE, 'draft': {**DRAFT, 'additional_notes': '꺼져'}}),
    ('reply', {**BASE, 'messages': [{'role': 'assistant', 'content': '어떻게 도와드릴까요?'}, {'role': 'user', 'content': '시.발'}]}),
])
def test_rejected_input_never_calls_ai(monkeypatch, path, body):
    def unexpected(*_):
        pytest.fail('Blocked input reached the AI provider')
    monkeypatch.setattr(chat, 'complete', unexpected)
    response = TestClient(app).post(f'/api/simulation-chat/{path}', json=body)
    assert response.status_code == 422
    assert response.json()['detail']['code'] == 'profanity'


def test_mirror_rejection_preserves_the_current_turn(monkeypatch, ready_ollama):
    from app.seed.run import seed
    from app.core.database import SessionLocal
    from app.models import Turn
    from app.services import context_scoring
    seed()
    client = TestClient(app)
    response = client.post('/api/sessions', json={'service_mode': 'workplace', 'scenario_slug': 'workplace-conversation',
        'exhibition': True, 'consent': {'agreed': True, 'storage_policy': 'none'}})
    assert response.status_code == 200, response.text
    session = response.json()
    turn_id = session['current_turn']['id']
    headers = {'X-Session-Token': session['access_token']}
    def unexpected(*_):
        pytest.fail('Blocked input reached dialogue or context scoring')
    monkeypatch.setattr(context_scoring, 'classify_turn', unexpected)
    monkeypatch.setattr('app.api.sessions._workplace_dialogue_first', unexpected)
    for endpoint in ['response', 'observation']:
        result = client.post(f"/api/sessions/{session['id']}/turns/{turn_id}/{endpoint}",
            headers=headers, json={'text': 'ㅈ까'})
        assert result.status_code == 422
        assert result.json()['detail']['code'] == 'profanity'
    with SessionLocal() as db:
        turn = db.get(Turn, turn_id)
        assert turn.answered_at is None
        assert not turn.response_text
