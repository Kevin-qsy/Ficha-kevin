// src/ui/screens/wizard3.js
import { getState, updateDraft } from "../../state/store.js";
import { navigateTo } from "../router.js";
import { abilityModifier } from "../../rules/abilityScores.js";

const ABILITIES = [
  { key: "str", name: "Força" },
  { key: "dex", name: "Destreza" },
  { key: "con", name: "Constituição" },
  { key: "int", name: "Inteligência" },
  { key: "wis", name: "Sabedoria" },
  { key: "cha", name: "Carisma" }
];

const SKILLS = [
  { id: "acrobatics", name: "Acrobacia", ability: "dex" },
  { id: "animal_handling", name: "Adestrar Animais", ability: "wis" },
  { id: "arcana", name: "Arcanismo", ability: "int" },
  { id: "athletics", name: "Atletismo", ability: "str" },
  { id: "deception", name: "Enganação", ability: "cha" },
  { id: "history", name: "História", ability: "int" },
  { id: "insight", name: "Intuição", ability: "wis" },
  { id: "intimidation", name: "Intimidação", ability: "cha" },
  { id: "investigation", name: "Investigação", ability: "int" },
  { id: "medicine", name: "Medicina", ability: "wis" },
  { id: "nature", name: "Natureza", ability: "int" },
  { id: "perception", name: "Percepção", ability: "wis" },
  { id: "performance", name: "Atuação", ability: "cha" },
  { id: "persuasion", name: "Persuasão", ability: "cha" },
  { id: "religion", name: "Religião", ability: "int" },
  { id: "sleight_of_hand", name: "Prestidigitação", ability: "dex" },
  { id: "stealth", name: "Furtividade", ability: "dex" },
  { id: "survival", name: "Sobrevivência", ability: "wis" }
];

const CLASS_SKILL_RULES = {
  barbarian: { choose: 2, from: ["animal_handling", "athletics", "intimidation", "nature", "perception", "survival"] },
  bard: { choose: 3, from: SKILLS.map(s => s.id) },
  cleric: { choose: 2, from: ["history", "insight", "medicine", "persuasion", "religion"] },
  druid: { choose: 2, from: ["arcana", "animal_handling", "insight", "medicine", "nature", "perception", "religion", "survival"] },
  fighter: { choose: 2, from: ["acrobatics", "animal_handling", "athletics", "history", "insight", "intimidation", "perception", "survival"] },
  monk: { choose: 2, from: ["acrobatics", "athletics", "history", "insight", "religion", "stealth"] },
  paladin: { choose: 2, from: ["athletics", "insight", "intimidation", "medicine", "persuasion", "religion"] },
  ranger: { choose: 3, from: ["animal_handling", "athletics", "insight", "investigation", "nature", "perception", "stealth", "survival"] },
  rogue: { choose: 4, from: ["acrobatics", "athletics", "deception", "insight", "intimidation", "investigation", "perception", "performance", "persuasion", "sleight_of_hand", "stealth"] },
  sorcerer: { choose: 2, from: ["arcana", "deception", "insight", "intimidation", "persuasion", "religion"] },
  warlock: { choose: 2, from: ["arcana", "deception", "history", "intimidation", "investigation", "nature", "religion"] },
  wizard: { choose: 2, from: ["arcana", "history", "insight", "investigation", "medicine", "religion"] }
};

const BACKGROUND_SKILLS = {
  acolyte: ["insight", "religion"],
  charlatan: ["deception", "sleight_of_hand"],
  criminal: ["deception", "stealth"],
  entertainer: ["acrobatics", "performance"],
  "folk-hero": ["animal_handling", "survival"],
  "guild-artisan": ["insight", "persuasion"],
  hermit: ["medicine", "religion"],
  noble: ["history", "persuasion"],
  outlander: ["athletics", "survival"],
  sage: ["arcana", "history"],
  sailor: ["athletics", "perception"],
  soldier: ["athletics", "intimidation"],
  urchin: ["sleight_of_hand", "stealth"]
};

let racesCache = null;

async function loadRaces() {
  if (racesCache) return racesCache;
  const res = await fetch("./data/phb-races.json");
  racesCache = await res.json();
  return racesCache;
}

export async function renderWizard3() {
  const app = document.getElementById("app");
  const { draft } = getState();

  if (!draft) {
    navigateTo("/hub");
    return;
  }

  const races = await loadRaces();

  // --- bônus raciais
  const race = races.find(r => r.id === draft.raceId);
  const bonusValues = race?.bonusValues || [];

  // HUMANO: automático (+1 em tudo), não precisa distribuir
  const isHumanAuto = race?.id === "human";

  // assignments só fazem sentido se não for humano automático
  const assignments = isHumanAuto
    ? []
    : normalizeAssignments(draft.raceBonusAssignments ?? [], bonusValues.length);

  // garante que humano não carregue assignments antigos
  if (isHumanAuto && (draft.raceBonusAssignments?.length || 0) > 0) {
    updateDraft({ raceBonusAssignments: [] });
  }

  const bonuses = isHumanAuto
    ? { str: 1, dex: 1, con: 1, int: 1, wis: 1, cha: 1 }
    : computeBonuses(bonusValues, assignments);

  // --- perícias
  const lockedSkills = BACKGROUND_SKILLS[draft.backgroundId] ?? [];
  const classRule = CLASS_SKILL_RULES[draft.classId] ?? { choose: 0, from: [] };
  const selectableFromClass = classRule.from.filter(id => !lockedSkills.includes(id));

  const chosenClassSkills = Array.isArray(draft.skillProficiencies) ? draft.skillProficiencies : [];
  const chosenValid = chosenClassSkills.filter(id => selectableFromClass.includes(id));
  if (chosenValid.length !== chosenClassSkills.length) updateDraft({ skillProficiencies: chosenValid });

  const chosenCount = chosenValid.length;
  const chooseMax = classRule.choose;

  app.innerHTML = `
    <div style="padding:16px; max-width:900px; margin:0 auto;">
      <h1>Criação — Etapa 3/4</h1>

      <!-- BÔNUS RACIAIS -->
      <h2 style="margin-top:16px;">Bônus de atributo da raça</h2>
      <p style="opacity:.9; margin-top:6px;">
        Raça: <strong>${escapeHtml(race?.name || draft.raceId || "(selecione na etapa 1)")}</strong>
        ${isHumanAuto ? `— <strong>+1 em todos os atributos</strong>` : (bonusValues.length ? `— Distribua: <strong>${bonusValues.map(v => `+${v}`).join(", ")}</strong>` : "")}
      </p>

      ${renderRacialBonusSection({ draft, bonusValues, assignments, isHumanAuto })}

      <h3 style="margin-top:16px;">Prévia (atributos finais)</h3>
      <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:10px; margin-top:10px;">
        ${ABILITIES.map(a => {
          const base = draft.abilityScores[a.key];
          const b = bonuses[a.key] || 0;
          const finalVal = base + b;
          const mod = abilityModifier(finalVal);
          const modText = mod >= 0 ? `+${mod}` : `${mod}`;
          const btxt = b ? `(+${b})` : "";
          return `
            <div style="border:1px solid #333; padding:10px; display:flex; justify-content:space-between; gap:10px;">
              <div>
                <strong>${a.name}</strong>
                <div style="opacity:.8; font-size:.9rem;">Mod: <strong>${modText}</strong></div>
              </div>
              <span>${finalVal} <span style="opacity:.75;">${btxt}</span></span>
            </div>
          `;
        }).join("")}
      </div>

      <hr style="margin: 22px 0; border: 0; border-top: 1px solid #333;" />

      <!-- PERÍCIAS -->
      <h2>Perícias</h2>
      <p style="opacity:.9; margin-top:6px;">
        Antecedente (pré-marcadas): <strong>${escapeHtml(backgroundLabel(draft.backgroundId))}</strong>
      </p>

      <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:8px;">
        ${lockedSkills.length ? lockedSkills.map(id => skillChip(id)).join("") : `<span style="opacity:.8;">Nenhuma perícia fixa do antecedente.</span>`}
      </div>

      <p style="margin-top:14px;">
        Classe: <strong>${escapeHtml(classLabel(draft.classId))}</strong> —
        escolha <strong>${chooseMax}</strong> perícias
        (<strong>${chosenCount}</strong> selecionadas)
      </p>

      <div id="skills-grid" style="display:grid; grid-template-columns: repeat(2, 1fr); gap:10px; margin-top:10px;">
        ${selectableFromClass
          .map(id => skillCheckbox(id, chosenValid.includes(id)))
          .join("") || `<div style="opacity:.8;">Nenhuma perícia disponível (verifique classe/antecedente).</div>`
        }
      </div>

      <div id="error" style="margin-top:12px; color:#ffb4b4;"></div>

      <div style="display:flex; gap:12px; margin-top:20px;">
        <button id="back">Voltar</button>
        <button id="next">Próximo</button>
      </div>
    </div>
  `;

  // handlers bônus raciais (somente se não for humano automático)
  if (!isHumanAuto) {
    bonusValues.forEach((_, i) => {
      const sel = app.querySelector(`#bonus-slot-${i}`);
      if (!sel) return;
      sel.addEventListener("change", (e) => {
        const nextAssignments = [...assignments];
        nextAssignments[i] = e.target.value;
        updateDraft({ raceBonusAssignments: nextAssignments });
        renderWizard3();
      });
    });
  }

  // handlers perícias
  for (const id of selectableFromClass) {
    const cb = app.querySelector(`#skill-${id}`);
    if (!cb) continue;

    cb.addEventListener("change", (e) => {
      const checked = e.target.checked;
      const current = new Set(getState().draft.skillProficiencies || []);

      if (checked) {
        if (current.size >= chooseMax) {
          e.target.checked = false;
          setError(`Você só pode escolher ${chooseMax} perícias da classe.`);
          return;
        }
        current.add(id);
      } else {
        current.delete(id);
      }

      updateDraft({ skillProficiencies: Array.from(current) });
      clearError();
      renderWizard3();
    });
  }

  app.querySelector("#back").addEventListener("click", () => navigateTo("/wizard/2"));

  app.querySelector("#next").addEventListener("click", () => {
    // valida bônus raciais (humano automático não precisa)
    if (!isHumanAuto && draft.raceId && bonusValues.length) {
      if (assignments.some(a => !a)) return setError("Distribua todos os bônus raciais antes de avançar.");
      if (new Set(assignments).size !== assignments.length) return setError("Não pode repetir o mesmo atributo em bônus diferentes.");
    }

    // valida perícias
    const finalChosen = (getState().draft.skillProficiencies || []).filter(id => selectableFromClass.includes(id));
    if (finalChosen.length !== chooseMax) return setError(`Selecione exatamente ${chooseMax} perícias da classe antes de avançar.`);

    clearError();
    navigateTo("/wizard/4");
  });

  function setError(msg) {
    const errEl = app.querySelector("#error");
    if (errEl) errEl.textContent = msg;
  }
  function clearError() {
    const errEl = app.querySelector("#error");
    if (errEl) errEl.textContent = "";
  }
}

function renderRacialBonusSection({ draft, bonusValues, assignments, isHumanAuto }) {
  if (!draft.raceId) {
    return `<p style="margin-top:12px;">Selecione uma raça na Etapa 1 para configurar os bônus.</p>`;
  }

  if (isHumanAuto) {
    return `
      <div style="margin-top:12px; border:1px solid #333; padding:10px; opacity:.95;">
        Esta raça aplica <strong>+1 automaticamente</strong> em todos os atributos.
      </div>
    `;
  }

  if (!bonusValues.length) {
    return `<p style="margin-top:12px;">Esta raça não tem bônus configurados.</p>`;
  }

  return `
    <div style="display:grid; grid-template-columns: 1fr; gap:12px; margin-top:12px;">
      ${bonusValues.map((v, i) => bonusRow(i, v, assignments[i])).join("")}
    </div>
  `;
}

function bonusRow(index, value, selected) {
  return `
    <div style="border:1px solid #333; padding:10px; display:flex; justify-content:space-between; align-items:center; gap:12px;">
      <div><strong>Bônus ${index + 1}:</strong> +${value}</div>
      <div style="min-width: 260px;">
        <select id="bonus-slot-${index}" style="width:100%;">
          ${abilityOptions(selected, "Selecione um atributo")}
        </select>
      </div>
    </div>
  `;
}

function abilityOptions(selected, placeholder) {
  const opts = ABILITIES
    .map(a => `<option value="${a.key}" ${a.key === selected ? "selected" : ""}>${a.name}</option>`)
    .join("");
  return `<option value="">${placeholder}</option>${opts}`;
}

function computeBonuses(bonusValues, assignments) {
  const b = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };
  for (let i = 0; i < bonusValues.length; i++) {
    const key = assignments[i];
    if (key) b[key] += bonusValues[i];
  }
  return b;
}

function normalizeAssignments(arr, length) {
  return Array.from({ length }, (_, i) => arr[i] || "");
}

function skillName(id) {
  return SKILLS.find(s => s.id === id)?.name || id;
}

function skillAbilityName(id) {
  const ab = SKILLS.find(s => s.id === id)?.ability || "";
  return ABILITIES.find(a => a.key === ab)?.name || ab;
}

function skillChip(id) {
  return `<span style="border:1px solid #444; padding:6px 10px; border-radius:999px; font-size:.95rem;">
    ${escapeHtml(skillName(id))}
  </span>`;
}

function skillCheckbox(id, checked) {
  return `
    <label style="border:1px solid #333; padding:10px; display:flex; gap:10px; align-items:flex-start;">
      <input type="checkbox" id="skill-${id}" ${checked ? "checked" : ""} />
      <div>
        <div><strong>${escapeHtml(skillName(id))}</strong></div>
        <div style="opacity:.8; font-size:.9rem;">Atributo: ${escapeHtml(skillAbilityName(id))}</div>
      </div>
    </label>
  `;
}

function classLabel(classId) {
  const map = {
    barbarian: "Bárbaro",
    bard: "Bardo",
    cleric: "Clérigo",
    druid: "Druida",
    fighter: "Guerreiro",
    monk: "Monge",
    paladin: "Paladino",
    ranger: "Patrulheiro",
    rogue: "Ladino",
    sorcerer: "Feiticeiro",
    warlock: "Bruxo",
    wizard: "Mago"
  };
  return map[classId] || classId || "(selecione na etapa 1)";
}

function backgroundLabel(bgId) {
  const map = {
    acolyte: "Acólito",
    charlatan: "Charlatão",
    criminal: "Criminoso",
    entertainer: "Artista",
    "folk-hero": "Herói do Povo",
    "guild-artisan": "Artesão da Guilda",
    hermit: "Eremita",
    noble: "Nobre",
    outlander: "Forasteiro",
    sage: "Sábio",
    sailor: "Marinheiro",
    soldier: "Soldado",
    urchin: "Órfão"
  };
  return map[bgId] || bgId || "(selecione na etapa 1)";
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
