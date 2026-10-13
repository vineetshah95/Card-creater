import { StrictMode } from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../App";

vi.mock("../exportCard", () => ({
  downloadPng: vi.fn().mockRejectedValue(new Error("boom")),
  downloadPdf: vi.fn().mockResolvedValue(undefined),
  downloadStoryImage: vi.fn().mockResolvedValue(undefined),
}));

const renderApp = () =>
  render(
    <StrictMode>
      <App />
    </StrictMode>,
  );

async function fill(user: ReturnType<typeof userEvent.setup>, name = "Jordan", age = "32", hobby = "chess, hiking") {
  await user.clear(screen.getByLabelText(/their name|pet’s name/i));
  await user.type(screen.getByLabelText(/their name|pet’s name/i), name);
  await user.clear(screen.getByLabelText(/age they/i));
  await user.type(screen.getByLabelText(/age they/i), age);
  await user.clear(screen.getByLabelText(/hobbies|pet likes/i));
  await user.type(screen.getByLabelText(/hobbies|pet likes/i), hobby);
}

const addCard = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: /add a card to the pile/i }));
const stackCount = () => screen.getByText(/in the stack/i).textContent;

beforeEach(() => {
  vi.spyOn(window, "matchMedia").mockImplementation(
    (q) =>
      ({ matches: true, media: q, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList,
  );
});
afterEach(() => vi.restoreAllMocks());

describe("App", () => {
  it("shows the Card Creater name as the page heading", () => {
    renderApp();
    expect(screen.getByRole("heading", { level: 1, name: "Card Creater" })).toBeInTheDocument();
  });

  it("starts with an empty stack and disabled toolbar", () => {
    renderApp();
    expect(stackCount()).toBe("0 in the stack");
    for (const name of [/copy all/i, /undo/i, /clear stack/i, /print cards/i]) {
      expect(screen.getByRole("button", { name })).toBeDisabled();
    }
  });

  it.each([
    ["", "32", "chess", "empty name"],
    ["Jordan", "", "chess", "empty age"],
    ["Jordan", "0", "chess", "age below 1"],
    ["Jordan", "131", "chess", "age above 130"],
    ["Jordan", "32", " , ", "no hobbies"],
  ])("rejects invalid input (%#: %s)", async (name, age, hobby) => {
    const user = userEvent.setup();
    renderApp();
    if (name) await user.type(screen.getByLabelText(/their name/i), name);
    if (age) await user.type(screen.getByLabelText(/age they/i), age);
    if (hobby) await user.type(screen.getByLabelText(/hobbies/i), hobby);
    await addCard(user);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(stackCount()).toBe("0 in the stack");
  });

  it("adds a card and clears the alert once input is valid", async () => {
    const user = userEvent.setup();
    renderApp();
    await addCard(user);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    await fill(user);
    await addCard(user);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(stackCount()).toBe("1 in the stack");
    expect(screen.getAllByRole("article")).toHaveLength(1);
  });

  it("renders user text as text, not HTML", async () => {
    const user = userEvent.setup();
    renderApp();
    await fill(user, "<img src=x onerror=alert(1)>", "32", "chess");
    await addCard(user);
    expect(document.querySelector("article img")).toBeNull();
  });

  it("'Another line' adds another card", async () => {
    const user = userEvent.setup();
    renderApp();
    await fill(user);
    await addCard(user);
    await user.click(screen.getByRole("button", { name: /another line/i }));
    expect(stackCount()).toBe("2 in the stack");
  });

  it("undo restores exactly one step even under StrictMode", async () => {
    const user = userEvent.setup();
    renderApp();
    await fill(user);
    await addCard(user);
    await addCard(user);
    await addCard(user);
    expect(stackCount()).toBe("3 in the stack");
    await user.click(screen.getByRole("button", { name: /undo/i }));
    expect(stackCount()).toBe("2 in the stack");
    await user.click(screen.getByRole("button", { name: /undo/i }));
    expect(stackCount()).toBe("1 in the stack");
    await user.click(screen.getByRole("button", { name: /undo/i }));
    expect(stackCount()).toBe("0 in the stack");
    expect(screen.getByRole("button", { name: /undo/i })).toBeDisabled();
  });

  it("clear stack can be undone", async () => {
    const user = userEvent.setup();
    renderApp();
    await fill(user);
    await addCard(user);
    await addCard(user);
    await user.click(screen.getByRole("button", { name: /clear stack/i }));
    expect(stackCount()).toBe("0 in the stack");
    await user.click(screen.getByRole("button", { name: /undo/i }));
    expect(stackCount()).toBe("2 in the stack");
  });

  it("reorders cards via drag and drop and can undo it", async () => {
    const user = userEvent.setup();
    renderApp();
    await fill(user, "First");
    await addCard(user);
    await fill(user, "Second");
    await addCard(user);
    const texts = () => screen.getAllByRole("article").map((a) => a.textContent ?? "");
    expect(texts()[0]).toContain("Second");

    const items = document.querySelectorAll<HTMLElement>(".card-stack__item");
    const store: Record<string, string> = {};
    const dataTransfer = {
      setData: (k: string, v: string) => (store[k] = v),
      getData: (k: string) => store[k] ?? "",
      effectAllowed: "",
      dropEffect: "",
    };
    fireEvent.dragStart(within(items[0]).getByLabelText(/drag to reorder/i), { dataTransfer });
    fireEvent.dragOver(items[1], { dataTransfer });
    fireEvent.drop(items[1], { dataTransfer });
    expect(texts()[0]).toContain("First");

    await user.click(screen.getByRole("button", { name: /undo/i }));
    expect(texts()[0]).toContain("Second");
  });

  it("reorders cards with the move up/down buttons", async () => {
    const user = userEvent.setup();
    renderApp();
    await fill(user, "First");
    await addCard(user);
    await fill(user, "Second");
    await addCard(user);
    const texts = () => screen.getAllByRole("article").map((a) => a.textContent ?? "");
    expect(screen.getByRole("button", { name: "Move card 1 up" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Move card 2 down" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Move card 1 down" }));
    expect(texts()[0]).toContain("First");
    await user.click(screen.getByRole("button", { name: "Move card 2 up" }));
    expect(texts()[0]).toContain("Second");
  });

  it("includes the signer name only when enabled", async () => {
    const user = userEvent.setup();
    renderApp();
    await fill(user);
    await addCard(user);
    expect(screen.getByRole("article")).not.toHaveTextContent("Alex");
    await user.click(screen.getByLabelText(/add my name/i));
    await user.type(screen.getByLabelText(/your name \(on the card\)/i), "Alex");
    await addCard(user);
    expect(screen.getAllByRole("article")[0]).toHaveTextContent("Alex");
  });

  it("pet mode forces pet-friendly lines on and locks the toggle", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.selectOptions(screen.getByLabelText(/who it’s for/i), "pet");
    const toggle = screen.getByLabelText(/pet-friendly lines/i);
    expect(toggle).toBeChecked();
    expect(toggle).toBeDisabled();
    expect(screen.getByLabelText(/pet’s name/i)).toBeInTheDocument();
  });

  it("copies a card and shows a toast; shows an error toast if blocked", async () => {
    const user = userEvent.setup();
    renderApp();
    await fill(user);
    await addCard(user);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    await user.click(screen.getByRole("button", { name: "Copy" }));
    expect(writeText).toHaveBeenCalledOnce();
    expect(await screen.findByRole("status")).toHaveTextContent("Copied");

    writeText.mockRejectedValueOnce(new Error("denied"));
    await user.click(screen.getByRole("button", { name: "Copy" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/blocked/i));
  });

  it("shows an inline toast (no blocking alert) when an export fails", async () => {
    const user = userEvent.setup();
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    renderApp();
    await fill(user);
    await addCard(user);
    await user.click(screen.getByRole("button", { name: "PNG" }));
    expect(await screen.findByRole("status")).toHaveTextContent(/could not create png/i);
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it("toggles the minimalist theme class on body and cleans up on unmount", async () => {
    const user = userEvent.setup();
    const { unmount } = renderApp();
    await user.selectOptions(screen.getByLabelText(/theme/i), "minimalist");
    expect(document.body).toHaveClass("theme-minimalist");
    unmount();
    expect(document.body).not.toHaveClass("theme-minimalist");
  });
});
