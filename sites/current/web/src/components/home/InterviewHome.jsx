import { ServiceIntroduction } from "./ServiceIntroduction";
import { FooterCta } from "./HomeSections";

export function InterviewHome({ onNext, composer }) {
  return (
    <>
      <ServiceIntroduction mode="interview" onNext={onNext} />
      <FooterCta composer={composer} title="연습할 면접 상황을 골라보세요" text="설문에서 면접 상황을 정하고 AI가 만든 연습 장면과 가상의 면접관을 확인해요." button="면접 연습하기" onNext={onNext} />
    </>
  );
}
