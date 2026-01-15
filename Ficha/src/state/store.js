// src/state/store.js
const STORAGE_KEY = "ficha_rpg_draft_v1";

const initialState = {
  screen: "hub",
  params: {},
  draft: null
};

let state = { ...initialState };
const listeners = new Set();

export function getState() {
  return state;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setState(patch) {
  state = { ...state, ...patch };
  for (const fn of listeners) fn(state);
}

export function resetDraft() {
  const now = Date.now();
  const draft = {
    id: crypto.randomUUID(),
    name: "",
    level: 1,
    raceId: "",
    classId: "",
    backgroundId: "",

    abilityScores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
    pointBuySpent: 0,

    raceBonusAssignments: [],
    skillProficiencies: [],
    equipmentChoices: { packId: "" },

    createdAt: now,
    updatedAt: now
  };

  setState({ draft });
  persistDraft(draft);
  return draft;
}

export function updateDraft(patch) {
  if (!state.draft) throw new Error("No draft to update");
  const updated = {
    ...state.draft,
    ...patch,
    updatedAt: Date.now()
  };
  setState({ draft: updated });
  persistDraft(updated);
  return updated;
}

export function setDraft(draft) {
  setState({ draft });
  persistDraft(draft);
}

export function loadDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function hydrateDraftFromStorage() {
  const d = loadDraft();
  if (d) setState({ draft: d });
  return d;
}


export function clearDraft() {
  localStorage.removeItem(STORAGE_KEY);
  setState({ draft: null });
}

function persistDraft(draft) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}
