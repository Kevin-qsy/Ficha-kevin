// src/ui/screens/wizard4.js
import { getState } from "../../state/store.js";
import { navigateTo } from "../router.js";
import { abilityModifier } from "../../rules/abilityScores.js";
import { saveCharacter } from "../../db/db.js";

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

const CLASS_DATA = {
  barbarian: { name: "Bárbaro", hitDie: 12, saves: ["str", "con"] },
  bard: { name: "Bardo", hitDie: 8, saves: ["dex", "cha"] },
  cleric: { name: "Clérigo", hitDie: 8, saves: ["wis", "cha"] },
  druid: { name: "Druida", hitDie: 8, saves: ["wis", "dex"] },
  fighter: { name: "Guerreiro", hitDie: 10, saves: ["str", "con"] },
  monk: { name: "Monge", hitDie: 8, saves: ["str", "dex"] },
  paladin: { name: "Paladino", hitDie: 10, saves: ["wis", "cha"] },
  ranger: { name: "Patrulheiro", hitDie: 10, saves: ["dex", "wis"] },
  rogue: { name: "Ladino", hitDie: 8, saves: ["dex", "int"] },
  sorcerer: { name: "Feiticeiro", hitDie: 6, saves: ["con", "cha"] },
  warlock: { name: "Bruxo", hitDie: 8, saves: ["wis", "cha"] },
  wizard: { name: "Mago", hitDie: 6, saves: ["int", "wis"] }
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

function proficiencyBonus(level) {
  return 2 + Math.floor((level - 1) / 4);
}

function fmtSigned(n) {
  return n >= 0 ? `+${n}` : `${n}`;
}

// PV = (nível−1)dX + (CON×nível + X)
function hpFormula(hitDie, conMod, level) {
  if (level <= 1) return `(${fmtSigned(conMod)} × 1 + ${hitDie})`;
  return `${level - 1}d${hitDie} + (${fmtSigned(conMod)} × ${level} + ${hitDie})`;
}

export async function renderWizard4() {
  const app = document.getElementById("app");
  const { draft } = getState();
  if (!draft) return navigateTo("/hub");

  const races = await loadRaces();
  const race = races.find(r => r.id === draft.raceId);
  const cls = CLASS_DATA[draft.classId];

  // bônus raciais
  const racialBonus = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };

  if (race?.id === "human") {
    racialBonus.str = 1; racialBonus.dex = 1; racialBonus.con = 1;
    racialBonus.int = 1; racialBonus.wis = 1; racialBonus.cha = 1;
  } else {
    const bonusValues = race?.bonusValues || [];
    const assignments = draft.raceBonusAssignments || [];
    bonusValues.forEach((v, i) => {
      const k = assignments[i];
      if (k) racialBonus[k] += v;
    });
  }

  // atributos finais e mods
  const finalScores = {};
  const mods = {};
  ABILITIES.forEach(a => {
    finalScores[a.key] = (draft.abilityScores[a.key] || 0) + (racialBonus[a.key] || 0);
    mods[a.key] = abilityModifier(finalScores[a.key]);
  });

  const prof = proficiencyBonus(draft.level);
  const hpText = cls ? hpFormula(cls.hitDie, mods.con, draft.level) : "—";

  // CA simplificada (mantida)
  const ac = 10 + mods.dex;
  const initiative = mods.dex;

  // perícias finais (antecedente + classe)
  const bgSkills = BACKGROUND_SKILLS[draft.backgroundId] || [];
  const classSkills = draft.skillProficiencies || [];
  const proficient = new Set([...bgSkills, ...classSkills]);

  const skillsFinal = SKILLS.map(s => {
    const b = mods[s.ability] + (proficient.has(s.id) ? prof : 0);
    return { ...s, proficient: proficient.has(s.id), bonus: b };
  });

  app.innerHTML = `
    <div id="sheet" style="padding:16px; max-width:900px; margin:0 auto;">
      <h1>Ficha de Personagem</h1>

      <section>
        <strong>${escapeHtml(draft.name)}</strong> —
        ${escapeHtml(CLASS_DATA[draft.classId]?.name || "—")} nível ${draft.level}
        <div>${escapeHtml(race?.name || "")} • ${escapeHtml(draft.backgroundId || "")}</div>
      </section>

      <hr/>

      <section>
        <h2>Atributos</h2>
        <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:8px;">
          ${ABILITIES.map(a => `
            <div style="border:1px solid #333; padding:8px;">
              <strong>${a.name}</strong>
              <div>${finalScores[a.key]} (${fmtSigned(mods[a.key])})</div>
            </div>
          `).join("")}
        </div>
      </section>

      <section>
        <h2>Combate</h2>
        <div>PV (cálculo): <strong>${escapeHtml(hpText)}</strong></div>
        <div style="opacity:.8; font-size:.9rem;">(Dado cheio no 1º nível + CON por nível)</div>
        <div style="margin-top:6px;">CA: <strong>${ac}</strong></div>
        <div>Iniciativa: <strong>${fmtSigned(initiative)}</strong></div>
        <div>Proficiência: <strong>+${prof}</strong></div>
      </section>

      <section>
        <h2>Perícias</h2>
        <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:6px;">
          ${skillsFinal.map(s => `
            <div>
              ${s.proficient ? "●" : "○"}
              ${escapeHtml(s.name)} (${s.ability.toUpperCase()}):
              <strong>${fmtSigned(s.bonus)}</strong>
            </div>
          `).join("")}
        </div>
      </section>

      <section>
        <h2>Equipamentos</h2>
        <div style="opacity:.85;">(Escolha será adicionada depois)</div>
        <button id="choose-equipment" style="margin-top:10px;">Escolher equipamentos</button>
      </section>

      <div style="display:flex; gap:10px; margin-top:16px; flex-wrap:wrap;">
        <button id="edit">Editar</button>
        <button id="save">Salvar no Hub</button>
        <button id="print">Exportar PDF</button>
        <button id="png">Exportar PNG</button>
      </div>
    </div>
  `;

  app.querySelector("#edit").addEventListener("click", () => navigateTo("/wizard/3"));

  app.querySelector("#save").addEventListener("click", async () => {
    const { draft } = getState();
    await saveCharacter(draft);
    navigateTo("/hub");
  });

  app.querySelector("#print").addEventListener("click", () => window.print());
  app.querySelector("#png").addEventListener("click", exportPNG);

  app.querySelector("#choose-equipment").addEventListener("click", () => {
  navigateTo("/equipment");
});


}

async function exportPNG() {
  if (!window.html2canvas) {
    alert("Inclua html2canvas para exportar PNG.");
    return;
  }
  const el = document.getElementById("sheet");
  const canvas = await window.html2canvas(el);
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = "ficha.png";
  a.click();
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
