import { ArrowRight } from "reicon-react/icons/ArrowRight";
import { IconGlyph } from "../components/ui/IconGlyph";
import { Badge, Button, Card, CardContent } from "../components/ui/shadcn";
import { getEpisodeImage, getScenarioDescription } from "../data/setupCatalog";
import { resolveServiceMode } from "../lib/serviceModeContext";
import { workplaceCategories } from "../data/workplaceStories";
import { InterviewProgress } from "../components/setup/InterviewProgress";
import { InterviewPreflight } from "../components/setup/InterviewPreflight";
import { WorkplaceMirrorPreflight } from "../features/smart-mirror/components/WorkplaceMirrorPreflight";
import { isMirrorDeployment } from "../features/smart-mirror/lib/workplaceMirrorTimeline";
import { WorkplacePreflight } from "../components/setup/WorkplacePreflight";
import { PromptPreflight } from "../components/setup/PromptPreflight";

export function PreviewPage({ serviceMode, onNext, onPrev, onPrepare, previewKey, starting, scenario, selectedEpisode, counterpartProfile, difficulty, aiHealth, consented, onConsent, error, permissionState, mode = 5 }) {
  const resolvedServiceMode = resolveServiceMode(serviceMode?.id);
  const workplace = resolvedServiceMode.id === "workplace";
  const focused = resolvedServiceMode.id === "interview";
  const difficultyTitle = resolvedServiceMode.id === "interview" ? "일반면접" : difficulty?.title || "기본 모드";
  const episode = selectedEpisode || scenario?.episodes?.[0];
  const lead = scenario?.characters?.find((character) => character.id === episode?.character_id) || scenario?.characters?.[0];
  const permissionsGranted = permissionState.camera === "granted" && permissionState.microphone === "granted";
  const aiReady = Boolean(aiHealth?.dialogue_ready);
  const dialogueName = { openai: "OpenAI 대화 AI", gemini: "Gemini 대화 AI", browser: "브라우저 면접 엔진" }[aiHealth?.dialogue_provider] || "대화 AI";
  const canStart = consented && !starting;
  const objectives = workplace
    ? workplaceCategories.map((category) => category.label)
    : episode?.points?.length ? episode.points : focused ? ["질문에 대한 결론부터 말해요", "내 경험을 한 가지 덧붙여요", "추가 질문을 듣고 답변을 이어가요"] : ["대화의 핵심을 먼저 말해요", "상대가 다음에 할 일을 분명히 요청해요", "마무리 전에 합의 내용을 확인해요"];
  const facts = workplace
    ? [
      { label: "진행 방식", value: `${workplaceCategories.length}개 단계 이어하기`, subtext: "출근·업무·퇴근 상황의 대화를 이어가요", icon: "briefcase" },
      { label: "연습 상황", value: "출근부터 퇴근까지", subtext: getScenarioDescription(scenario?.description || "상황 안내를 본 뒤 바로 대화해요"), icon: "chat" },
      { label: "난이도", value: "기본 모드", subtext: "선택 없이 바로 이어집니다.", icon: "normal" },
    ]
    : [
    { label: "직무", value: counterpartProfile?.title || "선택한 직무", subtext: counterpartProfile?.text || "선택한 업무 상황을 바탕으로 연습해요", image: counterpartProfile?.image },
    { label: "연습 상황", value: episode?.title || scenario?.title || "상황을 불러오고 있어요", subtext: getScenarioDescription(episode?.situation || scenario?.description || "선택한 업무 상황을 바탕으로 연습해요"), image: getEpisodeImage(scenario?.slug, episode?.id), icon: "briefcase" },
    { label: "난이도", value: difficultyTitle, subtext: difficulty?.text || "편안한 질문 흐름으로 시작해요.", image: difficulty?.image, icon: "normal" },
  ];
  const readiness = [
    { icon: "chat", label: dialogueName, value: aiReady ? "준비됨" : "실행 필요" },
    { icon: "voice", label: "음성 인식", value: permissionState.microphone === "granted" ? "권한 허용됨" : "시작할 때 확인" },
    { icon: "eye", label: "카메라", value: permissionState.camera === "granted" ? "권한 허용됨" : "시작할 때 확인" },
  ];

  if (scenario?.world_setting?.source === "user_prompt_pending") return <PromptPreflight prompt={scenario.description} {...{ serviceMode: resolvedServiceMode, difficulty, consented, onConsent, starting, onNext, onPrev, error }} />;
  return <section className="page selection-page setup-flow-page"><div className="page-title"><h1>시나리오 설계를 마쳤어요</h1><p className="page-subtitle">이번 체험은 시뮬레이션 시작 전까지만 제공해요.</p></div><div className="choice-grid three">{facts.map(fact => <Card key={fact.label}><CardContent><Badge>{fact.label}</Badge><h2>{fact.value}</h2><p>{fact.subtext}</p></CardContent></Card>)}</div><div className="setup-flow-actions"><Button variant="outline" onClick={onPrev}>이전</Button><Button onClick={() => window.location.reload()}>체험 마치고 돌아가기</Button></div></section>;

}
