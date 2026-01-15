// src/ui/screens/hub.js
import { getState, resetDraft, setDraft} from "../../state/store.js";
import { navigateTo } from "../router.js";
import {
  getAllCharacters,
  deleteCharacterById,
  duplicateCharacterById,
  getCharacterById
} from "../../db/db.js";

const CLASS_LABEL = {
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

export async function renderHub() {
  const app = document.getElementById("app");

  // garante que draft carregado (para botão continuar)
  
  const { draft } = getState();

  const list = await getAllCharacters();

  app.innerHTML = `
    <div style="padding:16px; max-width:1000px; margin:0 auto;">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;">
        <h1>Hub de Fichas</h1>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">
          <button id="new">Nova Ficha</button>
          ${draft ? `<button id="continue">Continuar Rascunho</button>` : ""}
        </div>
      </div>

      <h2 style="margin-top:18px;">Minhas fichas</h2>

      <div id="list" style="display:grid; grid-template-columns: 1fr; gap:10px; margin-top:10px;">
        ${list.length ? list.map(rowCard).join("") : `<div style="opacity:.8;">Nenhuma ficha salva ainda.</div>`}
      </div>
    </div>
  `;

  app.querySelector("#new").addEventListener("click", () => {
    resetDraft();
    navigateTo("/wizard/1");
  });

  const btnContinue = app.querySelector("#continue");
  if (btnContinue) btnContinue.addEventListener("click", () => navigateTo("/wizard/1"));

  // handlers por card
  for (const ch of list) {
    const openBtn = app.querySelector(`#open-${ch.id}`);
    const dupBtn = app.querySelector(`#dup-${ch.id}`);
    const delBtn = app.querySelector(`#del-${ch.id}`);

    openBtn?.addEventListener("click", async () => {
      const full = await getCharacterById(ch.id);
      if (!full) return;
      setDraft(full);
      navigateTo("/wizard/4"); // abre direto na ficha final
    });

    dupBtn?.addEventListener("click", async () => {
      await duplicateCharacterById(ch.id);
      renderHub();
    });

    delBtn?.addEventListener("click", async () => {
      await deleteCharacterById(ch.id);
      renderHub();
    });
  }
}

function rowCard(ch) {
  const title = escapeHtml(ch.name || "Sem nome");
  const cls = escapeHtml(CLASS_LABEL[ch.classId] || ch.classId || "—");
  const level = ch.level ?? "—";
  const updated = ch.updatedAt ? new Date(ch.updatedAt).toLocaleString("pt-BR") : "—";

  return `
    <div style="border:1px solid #333; padding:12px;">
      <div style="display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap;">
        <div>
          <div style="font-size:1.1rem;"><strong>${title}</strong></div>
          <div style="opacity:.85;">${cls} • nível ${level}</div>
          <div style="opacity:.7; font-size:.9rem;">Atualizado: ${escapeHtml(updated)}</div>
        </div>
        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
          <button id="open-${ch.id}">Abrir</button>
          <button id="dup-${ch.id}">Duplicar</button>
          <button id="del-${ch.id}">Excluir</button>
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
