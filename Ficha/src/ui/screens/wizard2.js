// src/ui/screens/wizard2.js
import { getState, updateDraft } from "../../state/store.js";
import { navigateTo } from "../router.js";
import { calculatePointBuy, abilityModifier } from "../../rules/abilityScores.js";

const ABILITIES = [
  { key: "str", name: "Força" },
  { key: "dex", name: "Destreza" },
  { key: "con", name: "Constituição" },
  { key: "int", name: "Inteligência" },
  { key: "wis", name: "Sabedoria" },
  { key: "cha", name: "Carisma" }
];

const POINT_BUY_COST = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9
};

export function renderWizard2() {
  const app = document.getElementById("app");
  const { draft } = getState();

  if (!draft) {
    navigateTo("/hub");
    return;
  }

  const pb = calculatePointBuy(draft.abilityScores);
  const remaining = 27 - pb.spent;

  app.innerHTML = `
    <div style="padding:16px; max-width:900px; margin:0 auto;">
      <h1>Criação — Etapa 2/4</h1>

      <p>
        Pontos disponíveis: <strong>${remaining}</strong> / 27
        <span style="opacity:.8;">(8–15 antes dos bônus raciais)</span>
      </p>

      <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:12px; margin-top:12px;">
        ${ABILITIES
          .map(a => {
            const score = draft.abilityScores[a.key];
            const mod = abilityModifier(score);
            const cost = POINT_BUY_COST[score] ?? 0;

            const canMinus = score > 8;
            const canPlus = score < 15 && remaining > 0; // checado com precisão no clique

            return abilityRow(a, score, mod, cost, canMinus, canPlus);
          })
          .join("")}
      </div>

      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:12px; margin-top:16px;">
        ${modifierTableHtml()}
        ${pointBuyTableHtml()}
      </div>

      <div id="error" style="margin-top:12px; color:#ffb4b4;"></div>

      <div style="display:flex; gap:12px; margin-top:20px;">
        <button id="back">Voltar</button>
        <button id="next">Próximo</button>
      </div>
    </div>
  `;

  ABILITIES.forEach(a => {
    const minus = app.querySelector(`#minus-${a.key}`);
    const plus = app.querySelector(`#plus-${a.key}`);

    minus.addEventListener("click", () => changeScore(a.key, -1));
    plus.addEventListener("click", () => changeScore(a.key, 1));
  });

  app.querySelector("#back").addEventListener("click", () => {
    navigateTo("/wizard/1");
  });

  app.querySelector("#next").addEventListener("click", () => {
    if (pb.spent > 27) {
      app.querySelector("#error").textContent = "Você gastou mais de 27 pontos.";
      return;
    }
    app.querySelector("#error").textContent = "";
    navigateTo("/wizard/3");
  });

  function changeScore(key, delta) {
    const current = draft.abilityScores[key];
    const next = current + delta;

    if (next < 8 || next > 15) return;

    const test = {
      ...draft.abilityScores,
      [key]: next
    };

    const testPB = calculatePointBuy(test);
    if (testPB.spent > 27) return;

    updateDraft({
      abilityScores: test,
      pointBuySpent: testPB.spent
    });

    renderWizard2();
  }
}

function abilityRow(ability, score, mod, cost, canMinus, canPlus) {
  const modText = mod >= 0 ? `+${mod}` : `${mod}`;

  return `
    <div style="display:flex; justify-content:space-between; align-items:center; border:1px solid #333; padding:8px;">
      <div style="display:flex; flex-direction:column; gap:4px;">
        <strong>${ability.name}</strong>
        <span style="opacity:.85;">
          ${score} <span style="opacity:.75;">(custo ${cost})</span>
          • Mod: <strong>${modText}</strong>
        </span>
      </div>

      <div style="display:flex; align-items:center; gap:8px;">
        <button id="minus-${ability.key}" ${canMinus ? "" : "disabled"}>−</button>
        <span style="min-width: 2ch; text-align:center;">${score}</span>
        <button id="plus-${ability.key}" ${canPlus ? "" : "disabled"}>+</button>
      </div>
    </div>
  `;
}

function modifierTableHtml() {
  return `
    <div style="border:1px solid #333; padding:12px;">
      <h3 style="margin:0 0 10px;">Tabela de Modificador</h3>
      <table style="width:100%; border-collapse:collapse;">
        <thead>
          <tr>
            <th style="text-align:left; border-bottom:1px solid #333; padding:6px;">Atributo</th>
            <th style="text-align:left; border-bottom:1px solid #333; padding:6px;">Mod</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="padding:6px;">8</td><td style="padding:6px;">-1</td></tr>
          <tr><td style="padding:6px;">9</td><td style="padding:6px;">-1</td></tr>
          <tr><td style="padding:6px;">10</td><td style="padding:6px;">+0</td></tr>
          <tr><td style="padding:6px;">11</td><td style="padding:6px;">+0</td></tr>
          <tr><td style="padding:6px;">12</td><td style="padding:6px;">+1</td></tr>
          <tr><td style="padding:6px;">13</td><td style="padding:6px;">+1</td></tr>
          <tr><td style="padding:6px;">14</td><td style="padding:6px;">+2</td></tr>
          <tr><td style="padding:6px;">15</td><td style="padding:6px;">+2</td></tr>
          <tr><td style="padding:6px;">16</td><td style="padding:6px;">+3</td></tr>
          <tr><td style="padding:6px;">17</td><td style="padding:6px;">+3</td></tr>
          <tr><td style="padding:6px;">18</td><td style="padding:6px;">+4</td></tr>
          <tr><td style="padding:6px;">19</td><td style="padding:6px;">+4</td></tr>
          <tr><td style="padding:6px;">20</td><td style="padding:6px;">+5</td></tr>
        </tbody>
      </table>
    </div>
  `;
}

function pointBuyTableHtml() {
  return `
    <div style="border:1px solid #333; padding:12px;">
      <h3 style="margin:0 0 10px;">Tabela de Custo (Point Buy)</h3>
      <table style="width:100%; border-collapse:collapse;">
        <thead>
          <tr>
            <th style="text-align:left; border-bottom:1px solid #333; padding:6px;">Atributo</th>
            <th style="text-align:left; border-bottom:1px solid #333; padding:6px;">Custo</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="padding:6px;">8</td><td style="padding:6px;">0</td></tr>
          <tr><td style="padding:6px;">9</td><td style="padding:6px;">1</td></tr>
          <tr><td style="padding:6px;">10</td><td style="padding:6px;">2</td></tr>
          <tr><td style="padding:6px;">11</td><td style="padding:6px;">3</td></tr>
          <tr><td style="padding:6px;">12</td><td style="padding:6px;">4</td></tr>
          <tr><td style="padding:6px;">13</td><td style="padding:6px;">5</td></tr>
          <tr><td style="padding:6px;">14</td><td style="padding:6px;">7</td></tr>
          <tr><td style="padding:6px;">15</td><td style="padding:6px;">9</td></tr>
        </tbody>
      </table>
    </div>
  `;
}
