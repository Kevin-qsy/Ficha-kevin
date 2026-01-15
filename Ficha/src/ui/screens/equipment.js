// src/ui/screens/equipment.js
import { getState, updateDraft } from "../../state/store.js";
import { navigateTo } from "../router.js";

let weaponsCache = null;
let armorCache = null;
let packsCache = null;
let rulesCache = null;

async function loadJsonCached(path, cacheRef) {
  if (cacheRef.value) return cacheRef.value;
  const res = await fetch(path);
  cacheRef.value = await res.json();
  return cacheRef.value;
}

async function loadWeapons() {
  return loadJsonCached("./data/weapons.json", { get value() { return weaponsCache; }, set value(v) { weaponsCache = v; } });
}
async function loadArmor() {
  return loadJsonCached("./data/armor.json", { get value() { return armorCache; }, set value(v) { armorCache = v; } });
}
async function loadPacks() {
  return loadJsonCached("./data/packs.json", { get value() { return packsCache; }, set value(v) { packsCache = v; } });
}
async function loadRules() {
  return loadJsonCached("./data/equipment-rules.json", { get value() { return rulesCache; }, set value(v) { rulesCache = v; } });
}

export async function renderEquipment() {
  const app = document.getElementById("app");
  const { draft } = getState();

  if (!draft) return navigateTo("/hub");

  const [weapons, armor, packs, rules] = await Promise.all([
    loadWeapons(),
    loadArmor(),
    loadPacks(),
    loadRules()
  ]);

  const cfg = rules[draft.classId];

  if (!cfg) {
    app.innerHTML = `
      <div style="padding:16px; max-width:900px; margin:0 auto;">
        <h1>Equipamentos</h1>
        <div style="border:1px solid #333; padding:12px; margin-top:12px; opacity:.9;">
          Não há regras de equipamentos para a classe <strong>${escapeHtml(draft.classId || "—")}</strong>.
          <div style="margin-top:10px;">Edite: <code>src/data/equipment-rules.json</code></div>
        </div>
        <div style="margin-top:16px;"><button id="back">Voltar</button></div>
      </div>
    `;
    app.querySelector("#back").addEventListener("click", () => navigateTo("/wizard/4"));
    return;
  }

  // Estado salvo
  const state = normalizeEquipmentState(draft.equipmentChoices);

  // auto-seleciona opção única por grupo, se ainda não tiver
  let changed = false;
  for (const g of cfg.groups) {
    const curOpt = state.groups[g.id]?.optionId || "";
    if (!curOpt && g.options.length === 1) {
      state.groups[g.id] = { optionId: g.options[0].id, picks: {} };
      changed = true;
    }
  }
  if (changed) {
    updateDraft({ equipmentChoices: state });
    return renderEquipment();
  }

  const validation = validateAll(cfg, state);
  const summary = buildSummary(cfg, state, weapons, armor, packs);

  app.innerHTML = `
    <div style="padding:16px; max-width:900px; margin:0 auto;">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;">
        <h1>Equipamentos — ${escapeHtml(cfg.title)}</h1>
        <button id="backTop">Voltar</button>
      </div>

      ${cfg.fixed?.length ? `
        <div style="border:1px solid #333; padding:12px; margin-top:14px;">
          <strong>Você recebe automaticamente:</strong>
          <ul style="margin:10px 0 0; padding-left:18px;">
            ${cfg.fixed.map(x => `<li>${escapeHtml(resolveItemLabel(x, weapons, armor, packs))}</li>`).join("")}
          </ul>
        </div>
      ` : ""}

      <div style="display:grid; grid-template-columns: 1fr; gap:12px; margin-top:14px;">
        ${cfg.groups.map(g => renderGroup(g, state, weapons, armor, packs)).join("")}
      </div>

      <div style="border:1px solid #333; padding:12px; margin-top:16px;">
        <strong>Resumo</strong>
        ${summary.length ? `
          <ul style="margin:10px 0 0; padding-left:18px;">
            ${summary.map(s => `<li>${escapeHtml(s)}</li>`).join("")}
          </ul>
        ` : `<div style="opacity:.8; margin-top:8px;">Selecione as opções para ver o resumo.</div>`}
      </div>

      <div id="error" style="margin-top:12px; color:#ffb4b4;">
        ${validation.ok ? "" : escapeHtml(validation.message)}
      </div>

      <div style="display:flex; gap:12px; margin-top:18px; flex-wrap:wrap;">
        <button id="back">Voltar</button>
        <button id="done" ${validation.ok ? "" : "disabled"}>Concluir</button>
      </div>
    </div>
  `;

  app.querySelector("#backTop").addEventListener("click", () => navigateTo("/wizard/4"));
  app.querySelector("#back").addEventListener("click", () => navigateTo("/wizard/4"));

  // Handlers: escolha de opção (radio)
  for (const g of cfg.groups) {
    for (const opt of g.options) {
      const el = app.querySelector(`#opt-${cssSafe(g.id)}-${cssSafe(opt.id)}`);
      if (!el) continue;

      el.addEventListener("change", () => {
        const next = normalizeEquipmentState(getState().draft.equipmentChoices);
        next.groups[g.id] = next.groups[g.id] || { optionId: "", picks: {} };

        // troca opção -> reseta picks do grupo (evita ficar com picks de outra opção)
        next.groups[g.id].optionId = opt.id;
        next.groups[g.id].picks = {};

        updateDraft({ equipmentChoices: next });
        renderEquipment();
      });
    }
  }

  // Handlers: selects (picks)
  for (const g of cfg.groups) {
    const gState = state.groups[g.id];
    if (!gState?.optionId) continue;

    const selectedOpt = g.options.find(o => o.id === gState.optionId);
    const expandedPicks = expandPickers(selectedOpt?.picks || []);

    for (const picker of expandedPicks) {
      const selId = `pick-${cssSafe(g.id)}-${cssSafe(picker.id)}`;
      const el = app.querySelector(`#${selId}`);
      if (!el) continue;

      el.addEventListener("change", (e) => {
        const next = normalizeEquipmentState(getState().draft.equipmentChoices);
        next.groups[g.id] = next.groups[g.id] || { optionId: "", picks: {} };
        next.groups[g.id].picks[picker.id] = e.target.value;

        updateDraft({ equipmentChoices: next });
        renderEquipment();
      });
    }
  }

  app.querySelector("#done").addEventListener("click", () => {
    const cur = normalizeEquipmentState(getState().draft.equipmentChoices);
    const v = validateAll(cfg, cur);
    if (!v.ok) return;
    navigateTo("/wizard/4");
  });
}

/* ----------------- Render helpers ----------------- */

function renderGroup(group, state, weapons, armor, packs) {
  const gState = state.groups[group.id] || { optionId: "", picks: {} };
  const selectedOptId = gState.optionId || "";

  const optHtml = group.options.map(opt => {
    const checked = opt.id === selectedOptId ? "checked" : "";
    return `
      <label style="display:flex; gap:10px; align-items:flex-start; border:1px solid #444; padding:10px;">
        <input type="radio" name="group-${escapeHtml(group.id)}" id="opt-${cssSafe(group.id)}-${cssSafe(opt.id)}" ${checked} />
        <div>
          <div><strong>${escapeHtml(opt.label)}</strong></div>
          ${opt.fixed?.length ? `
            <div style="opacity:.85; margin-top:6px;">
              Fixo: ${escapeHtml(opt.fixed.map(x => resolveItemLabel(x, weapons, armor, packs)).join(", "))}
            </div>
          ` : ""}
        </div>
      </label>
    `;
  }).join("");

  const selectedOpt = group.options.find(o => o.id === selectedOptId);
  const picksUi = selectedOpt ? renderPickers(group.id, selectedOpt, gState.picks, weapons, armor, packs) : "";

  return `
    <div style="border:1px solid #333; padding:12px;">
      <div><strong>${escapeHtml(group.label)}</strong></div>
      <div style="display:grid; grid-template-columns: 1fr; gap:8px; margin-top:10px;">
        ${optHtml}
      </div>
      ${picksUi}
    </div>
  `;
}

function renderPickers(groupId, opt, picksState, weapons, armor, packs) {
  const pickers = expandPickers(opt.picks || []);
  if (!pickers.length) return "";

  const blocks = pickers.map(p => {
    const selId = `pick-${cssSafe(groupId)}-${cssSafe(p.id)}`;
    const current = picksState?.[p.id] || "";

    const list = getCatalogList(p, weapons, armor, packs);
    const options = list.map(it => `<option value="${escapeHtml(it.id)}" ${it.id === current ? "selected" : ""}>${escapeHtml(it.name)}</option>`).join("");

    const selectedObj = list.find(it => it.id === current) || null;

    return `
      <div style="margin-top:12px; border-top:1px dashed #444; padding-top:12px;">
        <div style="opacity:.9; margin-bottom:6px;"><strong>${escapeHtml(p.label || "Escolha")}</strong></div>
        <select id="${selId}" style="width:100%;">
          <option value="">Selecione...</option>
          ${options}
        </select>
        ${renderDetailsCard(p.kind, selectedObj)}
      </div>
    `;
  }).join("");

  return `<div>${blocks}</div>`;
}

function renderDetailsCard(kind, obj) {
  if (!obj) return `<div style="opacity:.75; margin-top:8px;">Selecione para ver detalhes.</div>`;

  if (kind === "weapon") return renderWeaponDetails(obj);
  if (kind === "armor") return renderArmorDetails(obj);
  if (kind === "pack") {
    return `
      <div style="border:1px solid #333; padding:10px; margin-top:8px;">
        <div><strong>${escapeHtml(obj.name)}</strong></div>
        <div style="opacity:.9; margin-top:6px;">Pacote de equipamentos.</div>
      </div>
    `;
  }

  return "";
}

function renderWeaponDetails(w) {
  return `
    <div style="border:1px solid #333; padding:10px; margin-top:8px;">
      <div><strong>${escapeHtml(w.name)}</strong></div>
      <div style="margin-top:6px; opacity:.9;">
        Dano: <strong>${escapeHtml(w.damage || "—")}</strong> (${escapeHtml(w.damageType || "—")})<br/>
        Mãos: <strong>${escapeHtml(String(w.hands ?? "—"))}</strong><br/>
        Propriedades: <strong>${escapeHtml((w.properties || []).join(", ") || "—")}</strong>
      </div>
    </div>
  `;
}

function renderArmorDetails(a) {
  if (typeof a.acBonus === "number") {
    return `
      <div style="border:1px solid #333; padding:10px; margin-top:8px;">
        <div><strong>${escapeHtml(a.name)}</strong></div>
        <div style="margin-top:6px; opacity:.9;">
          Bônus de CA: <strong>+${a.acBonus}</strong>
        </div>
      </div>
    `;
  }

  const dexLine =
    a.dexMax === null ? "DEX soma" :
    a.dexMax === 0 ? "DEX não soma" :
    `DEX soma (máx. +${a.dexMax})`;

  const strLine = a.strReq ? `Força mínima: ${a.strReq}` : "Força mínima: —";
  const stealthLine = a.stealthDisadvantage ? "Furtividade: desvantagem" : "Furtividade: normal";

  return `
    <div style="border:1px solid #333; padding:10px; margin-top:8px;">
      <div><strong>${escapeHtml(a.name)}</strong></div>
      <div style="margin-top:6px; opacity:.9;">
        CA: <strong>${a.ac ?? "—"}</strong> • ${escapeHtml(dexLine)}<br/>
        ${escapeHtml(strLine)}<br/>
        ${escapeHtml(stealthLine)}
      </div>
    </div>
  `;
}

/* ----------------- Data helpers ----------------- */

function normalizeEquipmentState(equipmentChoices) {
  // formato:
  // { groups: { [groupId]: { optionId, picks: { [pickerId]: itemId } } } }
  const base = equipmentChoices && typeof equipmentChoices === "object" ? equipmentChoices : {};
  const groups = (base.groups && typeof base.groups === "object") ? base.groups : {};
  return { ...base, groups: structuredCloneSafe(groups) };
}

function structuredCloneSafe(obj) {
  try { return structuredClone(obj); } catch { return JSON.parse(JSON.stringify(obj || {})); }
}

function validateAll(cfg, state) {
  for (const g of cfg.groups) {
    const gState = state.groups[g.id];
    if (!gState?.optionId) return { ok: false, message: "Selecione uma opção em cada grupo." };

    const opt = g.options.find(o => o.id === gState.optionId);
    if (!opt) return { ok: false, message: "Há uma opção inválida selecionada." };

    const pickers = expandPickers(opt.picks || []);
    for (const p of pickers) {
      const v = gState.picks?.[p.id] || "";
      if (!v) return { ok: false, message: "Complete todas as escolhas (listas) antes de concluir." };
    }
  }
  return { ok: true, message: "" };
}

function expandPickers(picks) {
  // se qty > 1, duplica ids: weapon_1 -> weapon_1__1, weapon_1__2 ...
  const out = [];
  for (const p of picks) {
    const qty = Math.max(1, Number(p.qty || 1));
    if (qty === 1) {
      out.push({ ...p });
    } else {
      for (let i = 1; i <= qty; i++) {
        out.push({ ...p, id: `${p.id}__${i}`, label: `${p.label || "Escolha"} (${i}/${qty})`, _baseId: p.id });
      }
    }
  }
  return out;
}

function getCatalogList(picker, weapons, armor, packs) {
  const kind = picker.kind;
  const f = picker.filter || {};

  if (kind === "weapon") {
    return weapons
      .filter(w => (f.category ? w.category === f.category : true))
      .filter(w => (f.type ? w.type === f.type : true))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }

  if (kind === "armor") {
    return armor
      .filter(a => (f.category ? a.category === f.category : true))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }

  if (kind === "pack") {
    // filtro por id específico (usado nos exemplos)
    if (f.id) return packs.filter(p => p.id === f.id);
    return packs.slice().sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  }

  return [];
}

function buildSummary(cfg, state, weapons, armor, packs) {
  const out = [];

  for (const x of (cfg.fixed || [])) out.push(resolveItemLabel(x, weapons, armor, packs));

  for (const g of cfg.groups) {
    const gState = state.groups[g.id];
    if (!gState?.optionId) continue;

    const opt = g.options.find(o => o.id === gState.optionId);
    if (!opt) continue;

    for (const x of (opt.fixed || [])) out.push(resolveItemLabel(x, weapons, armor, packs));

    const pickers = expandPickers(opt.picks || []);
    for (const p of pickers) {
      const id = gState.picks?.[p.id] || "";
      if (!id) continue;

      if (p.kind === "weapon") out.push(weapons.find(w => w.id === id)?.name || id);
      if (p.kind === "armor") out.push(armor.find(a => a.id === id)?.name || id);
      if (p.kind === "pack") out.push(packs.find(pk => pk.id === id)?.name || id);
    }
  }

  return out;
}

function resolveItemLabel(x, weapons, armor, packs) {
  if (!x || typeof x !== "object") return String(x);

  if (x.kind === "text") return x.text || "—";
  if (x.kind === "weapon") return weapons.find(w => w.id === x.id)?.name || x.id;
  if (x.kind === "armor") return armor.find(a => a.id === x.id)?.name || x.id;
  if (x.kind === "pack") return packs.find(p => p.id === x.id)?.name || x.id;

  return "—";
}

/* ----------------- Utils ----------------- */

function cssSafe(s) {
  return String(s).replaceAll(/[^a-zA-Z0-9_-]/g, "_");
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
