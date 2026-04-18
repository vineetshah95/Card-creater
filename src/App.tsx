import { DragEvent, FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { buildTemplates, parseHobbies, pickIndex } from "./birthdayMessages";
import { useConfettiBurst } from "./components/Confetti";
import { CONFETTI_PALETTES, RIBBON_CSS } from "./themes";
import { playCardSound } from "./sound";
import type { CardFont, Length, Relationship, RibbonColor, ThemeId, Tone } from "./types";

type CardEntry = {
  id: string;
  text: string;
  createdAt: number;
};

const PLACEHOLDER_HINT =
  "Your cards will stack here — newest on top. Drag to reorder, copy, or export.";

function validationCopy(forPet: boolean): string {
  return forPet
    ? "Add the pet’s name, age, and at least one pet like (comma-separated)."
    : "Add a name, a real age, and at least one hobby or pet like (comma-separated).";
}

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function App() {
  const { rootRef, burst } = useConfettiBurst(CONFETTI_PALETTES.party);
  const pastRef = useRef<CardEntry[][]>([]);

  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [hobby, setHobby] = useState("");
  const [relationship, setRelationship] = useState<Relationship>("friend");
  const [tone, setTone] = useState<Tone>("cheeky");
  const [length, setLength] = useState<Length>("one-liner");
  const [theme, setTheme] = useState<ThemeId>("party");
  const [cardFont, setCardFont] = useState<CardFont>("serif");
  const [ribbon, setRibbon] = useState<RibbonColor>("rose");
  const [envelope, setEnvelope] = useState(true);
  const [stickers, setStickers] = useState(true);
  const [soundOn, setSoundOn] = useState(false);
  const [petFriendly, setPetFriendly] = useState(false);

  const [cards, setCards] = useState<CardEntry[]>([]);
  const [validationBanner, setValidationBanner] = useState<string | null>(null);
  const [lastIndex, setLastIndex] = useState<number | undefined>(undefined);
  const [newestId, setNewestId] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [canUndo, setCanUndo] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("theme-minimalist", theme === "minimalist");
    return () => document.body.classList.remove("theme-minimalist");
  }, [theme]);

  useEffect(() => {
    if (relationship === "pet") setPetFriendly(true);
  }, [relationship]);

  const pushHistory = useCallback((snapshot: CardEntry[]) => {
    pastRef.current = [...pastRef.current, snapshot];
    if (pastRef.current.length > 48) pastRef.current.shift();
    setCanUndo(true);
  }, []);

  const runGenerate = useCallback(
    (sameSubmit: boolean, avoid?: number) => {
      const trimmedName = name.trim();
      const hobbies = parseHobbies(hobby);
      const ageNum = parseInt(age, 10);
      const forPet = relationship === "pet";

      if (!trimmedName || hobbies.length === 0 || !Number.isFinite(ageNum) || ageNum < 1) {
        setValidationBanner(validationCopy(forPet));
        return;
      }

      setValidationBanner(null);
      const pool = buildTemplates(trimmedName, ageNum, hobbies, {
        relationship,
        tone,
        length,
        petFriendly,
      });
      const idx = pickIndex(pool.length, avoid);
      const text = pool[idx];
      const id = newId();

      setLastIndex(idx);
      setCards((prev) => {
        pushHistory(prev);
        return [{ id, text, createdAt: Date.now() }, ...prev];
      });
      setNewestId(id);
      window.setTimeout(() => setNewestId(null), 700);

      if (!sameSubmit) {
        burst({
          colors: CONFETTI_PALETTES[theme],
          disabled: reduceMotion,
          count: reduceMotion ? 0 : theme === "minimalist" ? 18 : 32,
        });
        if (soundOn && !reduceMotion) playCardSound();
      }
    },
    [age, burst, hobby, length, name, petFriendly, pushHistory, reduceMotion, relationship, soundOn, theme, tone],
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    runGenerate(false);
  };

  const onAnother = () => {
    runGenerate(true, lastIndex);
  };

  const undo = () => {
    const snap = pastRef.current.pop();
    setCanUndo(pastRef.current.length > 0);
    if (snap) setCards(snap);
  };

  const clearStack = () => {
    setCards((prev) => {
      if (prev.length) pushHistory(prev);
      return [];
    });
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyToast(label);
      window.setTimeout(() => setCopyToast(null), 1600);
    } catch {
      setCopyToast("Copy blocked — try again");
      window.setTimeout(() => setCopyToast(null), 2000);
    }
  };

  const copyAll = () => {
    if (!cards.length) return;
    void copyText(cards.map((c) => c.text).join("\n\n---\n\n"), "All copied");
  };

  const onReorder = (from: number, to: number) => {
    setCards((prev) => {
      if (from === to || from < 0 || to < 0 || from >= prev.length || to >= prev.length) return prev;
      pushHistory(prev);
      const next = [...prev];
      const [row] = next.splice(from, 1);
      next.splice(to, 0, row);
      return next;
    });
  };

  const onCardDragStart = (index: number) => (e: DragEvent) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const onCardDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const onCardDrop = (index: number) => (e: DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData("text/plain");
    const from = Number.parseInt(raw, 10);
    if (!Number.isFinite(from)) return;
    onReorder(from, index);
    setDragIndex(null);
  };

  const onCardDragEnd = () => setDragIndex(null);

  const storyGradient =
    theme === "minimalist"
      ? { from: "#1c1c1c", to: "#6a6a6a" }
      : { from: "#2a1628", to: "#ff7b9c" };

  const ribbonStyle = RIBBON_CSS[ribbon];

  const fontMod =
    cardFont === "hand" ? "birthday-card--font-hand" : cardFont === "modern" ? "birthday-card--font-modern" : "birthday-card--font-serif";

  const exportRoot = (id: string) => document.getElementById(`card-export-${id}`);

  const handlePng = async (id: string) => {
    const el = exportRoot(id);
    if (!el) return;
    try {
      const { downloadPng } = await import("./exportCard");
      await downloadPng(el as HTMLElement, `birthday-card-${id.slice(0, 8)}.png`);
    } catch {
      window.alert("Could not create PNG. Try again or use a different browser.");
    }
  };

  const handlePdf = async (id: string) => {
    const el = exportRoot(id);
    if (!el) return;
    try {
      const { downloadPdf } = await import("./exportCard");
      await downloadPdf(el as HTMLElement, `birthday-card-${id.slice(0, 8)}.pdf`);
    } catch {
      window.alert("Could not create PDF.");
    }
  };

  const handleStory = async (id: string) => {
    const el = exportRoot(id);
    if (!el) return;
    try {
      const { downloadStoryImage } = await import("./exportCard");
      await downloadStoryImage(el as HTMLElement, `birthday-card-${id.slice(0, 8)}`, storyGradient);
    } catch {
      window.alert("Could not create story image.");
    }
  };

  const printCards = () => window.print();

  return (
    <>
      <div className="confetti no-print" ref={rootRef} aria-hidden="true" />
      <div
        className={`app app--theme-${theme}${reduceMotion ? " app--reduce-motion" : ""}`}
        data-sound={soundOn ? "on" : "off"}
      >
        <div className="app__glow app__glow--1 no-print" aria-hidden="true" />
        <div className="app__glow app__glow--2 no-print" aria-hidden="true" />
        <div className="app__glow app__glow--3 no-print" aria-hidden="true" />

        <div className="app__inner no-print-inner">
          <header className="page-title no-print">
            <p className="page-title__sparkle" aria-hidden="true">
              {["\u{1F388}", "\u2728", "\u{1F382}", "\u2728", "\u{1F388}"].join(" ")}
            </p>
            <h1 className="page-title__main">The Glitter &amp; Giggle Birthday Lab</h1>
            <p className="page-title__tagline">
              Relationship-aware jokes, tone control, stackable cards, exports — the whole party.
            </p>
          </header>

          <div className="workspace">
            <div className="workspace__left no-print">
              <div className="panel">
                <p className="panel__lede">
                  {relationship === "pet"
                    ? "Pet birthday mode: use their name, age, and pet likes. Lines speak to the birthday star with paws, fins, or feathers."
                    : "Tune tone and length, stack cards on the right, then copy, export, or print a clean page."}
                </p>
                {validationBanner ? (
                  <p className="panel__alert" role="alert">
                    {validationBanner}
                  </p>
                ) : null}
                {copyToast ? (
                  <p className="panel__toast" role="status">
                    {copyToast}
                  </p>
                ) : null}

                <form className="form" onSubmit={onSubmit} noValidate>
                  <div className="field field--row">
                    <div className="field field--grow">
                      <label htmlFor="relationship">Who it’s for</label>
                      <select
                        id="relationship"
                        value={relationship}
                        onChange={(e) => setRelationship(e.target.value as Relationship)}
                      >
                        <option value="friend">Friend</option>
                        <option value="partner">Partner</option>
                        <option value="coworker">Coworker</option>
                        <option value="kid">Kid</option>
                        <option value="parent">Parent</option>
                        <option value="pet">Pet (they’re the birthday star)</option>
                      </select>
                    </div>
                    <div className="field field--grow">
                      <label htmlFor="tone">Tone</label>
                      <select id="tone" value={tone} onChange={(e) => setTone(e.target.value as Tone)}>
                        <option value="wholesome">Wholesome</option>
                        <option value="cheeky">Cheeky</option>
                        <option value="roast">Gentle roast</option>
                      </select>
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="length">Length</label>
                    <select id="length" value={length} onChange={(e) => setLength(e.target.value as Length)}>
                      <option value="one-liner">One-liner</option>
                      <option value="paragraph">Short paragraph</option>
                    </select>
                  </div>

                  <div className="field">
                    <label htmlFor="name">{relationship === "pet" ? "Pet’s name" : "Their name"}</label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete={relationship === "pet" ? "off" : "name"}
                      placeholder={relationship === "pet" ? "e.g. Biscuit" : "e.g. Jordan"}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="age">
                      {relationship === "pet" ? "Age they’re turning (human years, dog years — you pick)" : "Age they’re turning"}
                    </label>
                    <input
                      id="age"
                      name="age"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={130}
                      placeholder={relationship === "pet" ? "e.g. 3" : "e.g. 32"}
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      required
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="hobby">
                      {relationship === "pet" ? "Pet likes (comma-separated)" : "Hobbies (comma-separated)"}
                    </label>
                    <input
                      id="hobby"
                      name="hobby"
                      type="text"
                      placeholder={
                        relationship === "pet"
                          ? "e.g. squeaky toys, cheese cubes, sunbeams, judging the vacuum"
                          : "e.g. sourdough, chess, long walks"
                      }
                      value={hobby}
                      onChange={(e) => setHobby(e.target.value)}
                      required
                    />
                  </div>

                  <fieldset className="fieldset">
                    <legend className="fieldset__legend">Card look</legend>
                    <div className="field field--row">
                      <div className="field field--grow">
                        <label htmlFor="theme">Theme</label>
                        <select id="theme" value={theme} onChange={(e) => setTheme(e.target.value as ThemeId)}>
                          <option value="party">Party</option>
                          <option value="minimalist">Minimalist</option>
                        </select>
                      </div>
                      <div className="field field--grow">
                        <label htmlFor="cardFont">Card font</label>
                        <select id="cardFont" value={cardFont} onChange={(e) => setCardFont(e.target.value as CardFont)}>
                          <option value="serif">Serif (Fraunces)</option>
                          <option value="hand">Handwritten (Caveat)</option>
                          <option value="modern">Modern (DM Sans)</option>
                        </select>
                      </div>
                    </div>
                    <div className="field">
                      <label htmlFor="ribbon">Ribbon color</label>
                      <select id="ribbon" value={ribbon} onChange={(e) => setRibbon(e.target.value as RibbonColor)}>
                        <option value="rose">Rose</option>
                        <option value="gold">Gold</option>
                        <option value="lilac">Lilac</option>
                        <option value="mint">Mint</option>
                      </select>
                    </div>
                    <label className="check">
                      <input type="checkbox" checked={envelope} onChange={(e) => setEnvelope(e.target.checked)} />
                      Envelope + stamp frame
                    </label>
                    <label className="check">
                      <input type="checkbox" checked={stickers} onChange={(e) => setStickers(e.target.checked)} />
                      Corner stickers
                    </label>
                  </fieldset>

                  <fieldset className="fieldset">
                    <legend className="fieldset__legend">Delight</legend>
                    <label className={`check${relationship === "pet" ? " check--disabled" : ""}`}>
                      <input
                        type="checkbox"
                        checked={petFriendly}
                        disabled={relationship === "pet"}
                        onChange={(e) => setPetFriendly(e.target.checked)}
                      />
                      <span>
                        Pet-friendly lines
                        {relationship === "pet" ? (
                          <span className="check__hint"> — always on for pet birthdays</span>
                        ) : (
                          <span className="check__hint"> — warmer animal jokes, no roast</span>
                        )}
                      </span>
                    </label>
                    <label className="check">
                      <input type="checkbox" checked={soundOn} onChange={(e) => setSoundOn(e.target.checked)} />
                      Tiny sound on new card
                    </label>
                  </fieldset>

                  <div className="actions">
                    <button type="submit" className="btn btn--primary">
                      Add a card to the pile
                    </button>
                    <button type="button" className="btn btn--ghost" onClick={onAnother}>
                      Another line
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <aside className="workspace__right" aria-label="Generated birthday cards">
              <div className="cards-rail">
                <div className="cards-rail__header no-print">
                  <h2 className="cards-rail__title">Inside the birthday card</h2>
                  <span className="cards-rail__badge">{cards.length} in the stack</span>
                </div>

                <div className="cards-toolbar no-print">
                  <button type="button" className="btn btn--small btn--ghost" onClick={copyAll} disabled={!cards.length}>
                    Copy all
                  </button>
                  <button type="button" className="btn btn--small btn--ghost" onClick={undo} disabled={!canUndo}>
                    Undo
                  </button>
                  <button type="button" className="btn btn--small btn--ghost" onClick={clearStack} disabled={!cards.length}>
                    Clear stack
                  </button>
                  <button type="button" className="btn btn--small btn--ghost" onClick={printCards} disabled={!cards.length}>
                    Print cards
                  </button>
                </div>

                {cards.length === 0 ? (
                  <div className="birthday-card birthday-card--empty">
                    <div
                      id="card-export-empty"
                      className={`card-export-root ${envelope ? "card-export-root--envelope" : ""}`}
                    >
                      {envelope ? (
                        <>
                          <div className="birthday-card__stamp" aria-hidden="true">
                            <span>HB</span>
                          </div>
                          <div className="birthday-card__envelope" aria-hidden="true" />
                        </>
                      ) : null}
                      <div className="birthday-card__book">
                        <div
                          className="birthday-card__cover"
                          style={{ background: ribbonStyle.cover }}
                        >
                          <span
                            className="birthday-card__cover-ribbon"
                            style={{ background: ribbonStyle.ribbon }}
                            aria-hidden="true"
                          />
                        </div>
                        <div className={`birthday-card__spread ${stickers ? "birthday-card__spread--stickers" : ""}`}>
                          <div className="birthday-card__page birthday-card__page--left" />
                          <div className="birthday-card__page birthday-card__page--right">
                            <p className="birthday-card__placeholder">{PLACEHOLDER_HINT}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <ul className="card-stack">
                    {cards.map((c, i) => (
                      <li
                        key={c.id}
                        className={`card-stack__item${dragIndex === i ? " card-stack__item--drag" : ""}`}
                        style={{ zIndex: cards.length - i }}
                        onDragOver={onCardDragOver}
                        onDrop={onCardDrop(i)}
                      >
                        <div className="card-chrome no-print">
                          <span
                            className="card-drag-handle"
                            draggable
                            onDragStart={onCardDragStart(i)}
                            onDragEnd={onCardDragEnd}
                            title="Drag to reorder"
                            aria-label="Drag to reorder card"
                          >
                            {"\u2261"}
                          </span>
                          <span className="card-chrome__hint">Drag handle · actions</span>
                          <div className="card-chrome__actions">
                            <button
                              type="button"
                              className="btn btn--tiny btn--ghost"
                              onClick={() => void copyText(c.text, "Copied")}
                            >
                              Copy
                            </button>
                            <button type="button" className="btn btn--tiny btn--ghost" onClick={() => void handlePng(c.id)}>
                              PNG
                            </button>
                            <button type="button" className="btn btn--tiny btn--ghost" onClick={() => void handlePdf(c.id)}>
                              PDF
                            </button>
                            <button type="button" className="btn btn--tiny btn--ghost" onClick={() => void handleStory(c.id)}>
                              Story
                            </button>
                          </div>
                        </div>
                        <article
                          className={`birthday-card ${fontMod}${c.id === newestId ? " birthday-card--enter" : ""}`}
                          aria-label={`Card ${i + 1}`}
                        >
                          <div
                            id={`card-export-${c.id}`}
                            className={`card-export-root ${envelope ? "card-export-root--envelope" : ""}`}
                          >
                            {envelope ? (
                              <>
                                <div className="birthday-card__stamp" aria-hidden="true">
                                  <span>HB</span>
                                </div>
                                <div className="birthday-card__envelope" aria-hidden="true" />
                              </>
                            ) : null}
                            <div className="birthday-card__book">
                              <div
                                className="birthday-card__cover"
                                style={{ background: ribbonStyle.cover }}
                              >
                                <span
                                  className="birthday-card__cover-ribbon"
                                  style={{ background: ribbonStyle.ribbon }}
                                  aria-hidden="true"
                                />
                              </div>
                              <div className={`birthday-card__spread ${stickers ? "birthday-card__spread--stickers" : ""}`}>
                                <div className="birthday-card__page birthday-card__page--left">
                                  <span className="birthday-card__watermark" aria-hidden="true">
                                    HB
                                  </span>
                                </div>
                                <div className="birthday-card__page birthday-card__page--right">
                                  <p className="birthday-card__script">Happy Birthday!</p>
                                  <p className="birthday-card__body">{c.text}</p>
                                  <p className="birthday-card__signoff">With love &amp; cake crumbs —</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </article>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
