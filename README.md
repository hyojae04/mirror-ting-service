# Mirror-Ting Service

Mirror-Ting(미러팅)은 실제 면접이나 직장 대화를 앞두고 **AI 상대와 미리 연습하는 대화 시뮬레이션 서비스**입니다.

연습하고 싶은 상황을 입력하면 설계자 AI가 부족한 정보를 확인하고, 대화 상대·목표·난이도를 함께 정합니다. 이후 AI가 면접관이나 직장 동료 등의 역할을 맡아 선택한 5턴 또는 10턴 동안 대화를 진행합니다.

답변·음성·표정·자세를 살펴보는 **4-Fit 피드백**과 연습 기록 기능도 포함합니다. 분석 기능을 사용하려면 관련 모델과 장치를 별도로 준비해야 합니다.

이 저장소에는 서비스 프론트엔드와 백엔드 코드를 담고 있습니다.

## 구조

- `mvp/`: React·Vite 서비스 프론트엔드, 디자인시스템과 서비스 에셋
- `poc/backend/app/`: FastAPI API, 시뮬레이션 설계자·대화 AI 연동, 데이터 모델과 서비스 로직
- `poc/backend/tests/`: 백엔드 회귀 테스트

## 실행

Node.js와 Python 3.12를 준비합니다.

```sh
cd mvp
npm ci
npm run dev -- --port 5186
```

별도 터미널에서 백엔드를 실행합니다.

```sh
cd poc/backend
python3.12 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
cp .env.example .env
# .env에 본인의 서버용 API 키와 인증 비밀 값을 설정합니다.
.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

프론트엔드의 `/api` 요청은 로컬 백엔드 8001 포트로 연결됩니다. 설정 필드는 `poc/backend/app/core/config.py`에서 확인할 수 있습니다. 공통 설정 스키마와 연동 코드는 포함하지만, 개발 PC의 실제 설정 값은 포함하지 않습니다.

## 포함하지 않은 항목

기존 Git 이력, 실제 환경변수와 API 키, 로컬 AI 설정 파일·모델 가중치, 실행 DB·녹음·세션 데이터, QA 캡처, 빌드 결과와 의존성 설치 폴더는 포함하지 않았습니다. 모델을 쓰는 분석 기능은 모델을 별도로 준비해야 하며, 서버 상태는 `/api/health`에서 확인할 수 있습니다.

## 검증

```sh
cd mvp
npm run build
```

```sh
cd poc/backend
.venv/bin/python -m pytest tests/test_simulation_chat.py -q
```
