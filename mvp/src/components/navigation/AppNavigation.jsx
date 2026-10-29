import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "reicon-react/icons/ArrowRight";
import { ChevronDown } from "reicon-react/icons/ChevronDown";
import { Menu4 } from "reicon-react/icons/Menu4";
import { X } from "reicon-react/icons/X";
import { IconGlyph } from "../ui/IconGlyph";
import { navMap, practiceNavMap } from "./navigationConfig";

const mobileIconByTarget = {
  usage: "coach",
  intro: "presentation",
  service: "roleplay",
  records: "report",
  result: "report",
};

export function TopNav({ active, scenarioTitle, menuOpen, onMenuOpen, onNavigate, scenarios = [], onScenarioSelect, practiceMode = false }) {
  const [scenarioOpen, setScenarioOpen] = useState(false);
  const [authNotice, setAuthNotice] = useState(null);
  const authNoticeId = useRef(0);
  const authTriggerRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const showAuthNotice = (label, event) => {
    authTriggerRef.current = event.currentTarget;
    setAuthNotice({ label, id: ++authNoticeId.current });
  };
  const closeAuthNotice = () => { setAuthNotice(null); authTriggerRef.current?.focus(); };

  useEffect(() => {
    if (!authNotice) return undefined;
    const timer = window.setTimeout(() => setAuthNotice(null), 4000);
    const escape = event => { if (event.key === "Escape") setAuthNotice(null); };
    window.addEventListener("keydown", escape);
    return () => { window.clearTimeout(timer); window.removeEventListener("keydown", escape); };
  }, [authNotice]);

  useEffect(() => {
    const handleOutsideClick = () => {
      setScenarioOpen(false);
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  const toggleScenario = (event) => {
    event.stopPropagation();
    setScenarioOpen(!scenarioOpen);
  };

  const currentNavMap = practiceMode ? practiceNavMap : navMap;

  return (
    <header className="top-nav glass-panel" onKeyDown={(event) => {
      if (event.key !== "Escape" || !scenarioOpen) return;
      event.preventDefault();
      setScenarioOpen(false);
      event.target.closest(".nav-dropdown-wrapper")?.querySelector("button")?.focus();
    }}>
      <button className="brand" type="button" aria-label="Mirror-Ting 모드 선택" onClick={() => onNavigate("service")}>
        <span className="brand-mark brand-mark--mirror" aria-hidden="true"><img src="/icons/mirror-ting-mark-slim.png" alt="" /></span><span>Mirror-Ting</span>
      </button>
      <nav aria-label="주요 화면">
        {Object.entries(currentNavMap).map(([label, target]) => <button key={label} className={active === target ? "active" : ""} aria-current={active === target ? "page" : undefined} type="button" onClick={() => onNavigate(target)}>{label}</button>)}
      </nav>
      <div className="nav-actions">
        {active === "practice" && (
          <div className="nav-dropdown-wrapper">
            <button className="scenario-select" type="button" aria-expanded={scenarioOpen} onClick={toggleScenario}>{scenarioTitle || "역할극"} <ChevronDown size={16} /></button>
            {scenarioOpen && scenarios.length > 0 && <div className="nav-dropdown scenario-dropdown glass-panel" onClick={(event) => event.stopPropagation()}><h3>시나리오 전환</h3><ul>{scenarios.map((scenario) => <li key={scenario.slug} className={scenario.title === scenarioTitle ? "active" : ""}><button type="button" onClick={() => { onScenarioSelect(scenario.slug); setScenarioOpen(false); }}>{scenario.title}</button></li>)}</ul></div>}
          </div>
        )}
        <button className="nav-auth-button nav-auth-login" type="button" onClick={event => showAuthNotice("로그인", event)}>로그인</button>
        <button className="nav-auth-button nav-auth-signup" type="button" onClick={event => showAuthNotice("회원가입", event)}>회원가입</button>
        <button className="mobile-menu-button" type="button" aria-label="메뉴 열기" aria-expanded={menuOpen} onClick={() => onMenuOpen(true)}><Menu4 size={22} /></button>
      </div>
      {createPortal(<AnimatePresence>{authNotice && <motion.aside className="auth-notice-banner" role="status" aria-live="polite" aria-atomic="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reducedMotion ? 0 : 0.2, ease: "easeOut" }}>
        <div className="auth-notice-content"><h2>{authNotice.label} 기능은 준비 중이에요</h2><p>아직 구현되지 않았어요. 로그인 없이도 대화 연습을 이용할 수 있어요.</p></div>
        <button className="auth-notice-action" type="button" onClick={closeAuthNotice}>확인</button>
        <button className="auth-notice-close" type="button" aria-label="안내 닫기" onClick={closeAuthNotice}><X size={20} aria-hidden="true" /></button>
      </motion.aside>}</AnimatePresence>, document.body)}
    </header>
  );
}

export function MobileMenuSheet({ open, active, onClose, onNavigate, practiceMode = false }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && !dialog.open) {
      dialog.showModal();
      dialog.querySelector(".sheet-head button").focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const handleKeyDown = (event) => {
    if (event.key !== "Tab") return;
    const buttons = dialogRef.current.querySelectorAll(".mobile-menu-sheet button");
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <dialog onKeyDown={handleKeyDown} ref={dialogRef} className={`mobile-menu-layer ${open ? "open" : ""}`} aria-label="모바일 메뉴" onCancel={(event) => { event.preventDefault(); onClose(); }}>
      <button className="mobile-menu-backdrop" type="button" tabIndex={-1} aria-label="메뉴 닫기" onClick={onClose} />
      <section className="mobile-menu-sheet">
        <div className="sheet-handle" />
        <div className="sheet-head"><strong>Mirror-Ting</strong><button type="button" autoFocus aria-label="메뉴 닫기" onClick={onClose}><X size={20} /></button></div>
        <nav aria-label="모바일 주요 화면">{Object.entries(practiceMode ? practiceNavMap : navMap).map(([label, target]) => <button key={label} className={active === target ? "active" : ""} aria-current={active === target ? "page" : undefined} type="button" onClick={() => onNavigate(target)}><IconGlyph icon={mobileIconByTarget[target] || "coach"} size={23} /><span>{label}</span><ArrowRight size={17} /></button>)}</nav>
      </section>
    </dialog>
  );
}
