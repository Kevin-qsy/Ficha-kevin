// src/ui/screens/wizard1.js
import { getState, updateDraft, resetDraft } from "../../state/store.js";
import { navigateTo } from "../router.js";

// ======= Dados de UI (PT-BR) =======

const CLASS_OPTIONS = [
  { id: "barbarian", name: "Bárbaro" },
  { id: "bard", name: "Bardo" },
  { id: "cleric", name: "Clérigo" },
  { id: "druid", name: "Druida" },
  { id: "fighter", name: "Guerreiro" },
  { id: "monk", name: "Monge" },
  { id: "paladin", name: "Paladino" },
  { id: "ranger", name: "Patrulheiro" },
  { id: "rogue", name: "Ladino" },
  { id: "sorcerer", name: "Feiticeiro" },
  { id: "warlock", name: "Bruxo" },
  { id: "wizard", name: "Mago" }
];

const BACKGROUND_OPTIONS = [
  { id: "acolyte", name: "Acólito" },
  { id: "charlatan", name: "Charlatão" },
  { id: "criminal", name: "Criminoso" },
  { id: "entertainer", name: "Artista" },
  { id: "folk-hero", name: "Herói do Povo" },
  { id: "guild-artisan", name: "Artesão da Guilda" },
  { id: "hermit", name: "Eremita" },
  { id: "noble", name: "Nobre" },
  { id: "outlander", name: "Forasteiro" },
  { id: "sage", name: "Sábio" },
  { id: "sailor", name: "Marinheiro" },
  { id: "soldier", name: "Soldado" },
  { id: "urchin", name: "Órfão" }
];

// Perícias fixas por antecedente (PHB) — funcional
const BACKGROUND_SKILLS = {
  acolyte: ["Intuição", "Religião"],
  charlatan: ["Enganação", "Prestidigitação"],
  criminal: ["Enganação", "Furtividade"],
  entertainer: ["Acrobacia", "Atuação"],
  "folk-hero": ["Adestrar Animais", "Sobrevivência"],
  "guild-artisan": ["Intuição", "Persuasão"],
  hermit: ["Medicina", "Religião"],
  noble: ["História", "Persuasão"],
  outlander: ["Atletismo", "Sobrevivência"],
  sage: ["Arcanismo", "História"],
  sailor: ["Atletismo", "Percepção"],
  soldier: ["Atletismo", "Intimidação"],
  urchin: ["Prestidigitação", "Furtividade"]
};

// “Ganhos” resumidos do antecedente (texto simples, funcional)
const BACKGROUND_GAINS = {
  acolyte: ["Símbolo sagrado", "Livro de orações", "Vestuário comum", "Bolsa com 15 po"],
  charlatan: ["Kit de disfarce", "Ferramentas de trapaça", "Vestuário fino", "Bolsa com 15 po"],
  criminal: ["Ferramentas de ladrão", "Pé-de-cabra", "Vestuário comum", "Bolsa com 15 po"],
  entertainer: ["Instrumento musical", "Vestuário de artista", "Bolsa com 15 po"],
  "folk-hero": ["Ferramentas de artesão (uma)", "Pá", "Vestuário comum", "Bolsa com 10 po"],
  "guild-artisan": ["Ferramentas de artesão (uma)", "Carta da guilda", "Vestuário de viajante", "Bolsa com 15 po"],
  hermit: ["Estojo de pergaminhos", "Cobertor", "Vestuário comum", "Bolsa com 5 po"],
  noble: ["Vestuário fino", "Anel de sinete", "Pergaminho de linhagem", "Bolsa com 25 po"],
  outlander: ["Cajado", "Armadilha de caça", "Troféu", "Vestuário de viajante", "Bolsa com 10 po"],
  sage: ["Tinteiro e pena", "Livro", "Estojo de pergaminhos", "Vestuário comum", "Bolsa com 10 po"],
  sailor: ["Corda (15m)", "Amuleto de sorte", "Vestuário comum", "Bolsa com 10 po"],
  soldier: ["Insígnia", "Troféu", "Conjunto de dados ou cartas", "Vestuário comum", "Bolsa com 10 po"],
  urchin: ["Pequena faca", "Mapa da cidade", "Rato de estimação", "Vestuário comum", "Bolsa com 10 po"]
};

// Descrições de classe (tema/papel)
const CLASS_INFO = {
  barbarian: {
    theme: "Um guerreiro movido pela fúria — você vira a tempestade na linha de frente.",
    role: "Função: tanque agressivo e dano corpo a corpo.",
    bullets: [
      "Ponto forte: aguenta pancada e não para de pé fácil.",
      "Ponto fraco: pouca versatilidade fora do combate.",
      "Estilo: entra no meio, segura a pressão e abre caminho."
    ]
  },
  bard: {
    theme: "Um artista lendário — palavras e música viram magia e influência.",
    role: "Função: suporte versátil (social, buffs, controle).",
    bullets: [
      "Ponto forte: resolve cenas sociais e apoia qualquer grupo.",
      "Ponto fraco: combate direto depende de escolhas e posição.",
      "Estilo: inspira aliados e decide a cena com criatividade."
    ]
  },
  cleric: {
    theme: "Um agente do divino — fé que cura, protege e castiga.",
    role: "Função: suporte, cura e controle; pode ser linha de frente.",
    bullets: [
      "Ponto forte: grande impacto com cura e utilidade.",
      "Ponto fraco: recursos precisam ser bem gerenciados.",
      "Estilo: mantém o grupo vivo e pune ameaças-chave."
    ]
  },
  druid: {
    theme: "Guardião da natureza — magia primal e transformação.",
    role: "Função: controle, utilidade e adaptação (combate/exploração).",
    bullets: [
      "Ponto forte: muito controle e ferramentas para qualquer situação.",
      "Ponto fraco: depende de preparação e escolhas corretas.",
      "Estilo: muda o terreno, invoca e se transforma quando precisa."
    ]
  },
  fighter: {
    theme: "O mestre das armas — técnica e disciplina acima de tudo.",
    role: "Função: dano consistente e presença forte na linha de frente.",
    bullets: [
      "Ponto forte: confiável em qualquer combate.",
      "Ponto fraco: menos “truques” fora de combate.",
      "Estilo: simples, eficiente e mortal com equipamento certo."
    ]
  },
  monk: {
    theme: "Um lutador ágil — corpo como arma, mente como escudo.",
    role: "Função: mobilidade, controle e pressão em alvos frágeis.",
    bullets: [
      "Ponto forte: rápido, difícil de prender, ótimo em alvo-chave.",
      "Ponto fraco: pode ser frágil se ficar exposto.",
      "Estilo: entra e sai, atordoa, persegue e quebra a linha inimiga."
    ]
  },
  paladin: {
    theme: "Um campeão juramentado — sua convicção vira poder.",
    role: "Função: linha de frente defensiva com dano explosivo.",
    bullets: [
      "Ponto forte: proteção + dano alto em momentos decisivos.",
      "Ponto fraco: escolhas morais/tema podem limitar estilos.",
      "Estilo: segura a linha e finaliza ameaças perigosas."
    ]
  },
  ranger: {
    theme: "Caçador e explorador — você vive onde outros se perdem.",
    role: "Função: dano (especialmente à distância) e utilidade de exploração.",
    bullets: [
      "Ponto forte: rastreio, sobrevivência e eficiência em terreno aberto.",
      "Ponto fraco: parte do brilho depende do tipo de campanha.",
      "Estilo: prepara emboscadas, controla distância e caça o alvo."
    ]
  },
  rogue: {
    theme: "Sombras e precisão — um golpe certo vale por dez.",
    role: "Função: dano pontual e especialista em perícias.",
    bullets: [
      "Ponto forte: infiltração, armadilhas, furtividade e “um grande ataque”.",
      "Ponto fraco: não gosta de troca de dano prolongada.",
      "Estilo: posicionamento perfeito, ataque certeiro, desaparece."
    ]
  },
  sorcerer: {
    theme: "Poder que nasce em você — magia bruta e instintiva.",
    role: "Função: explosão mágica e controle com alto impacto.",
    bullets: [
      "Ponto forte: dano/controle muito fortes com poucos recursos.",
      "Ponto fraco: menos variedade de magias do que um mago.",
      "Estilo: faz uma coisa muito bem — e muda a luta com isso."
    ]
  },
  warlock: {
    theme: "Um pacto perigoso — poder emprestado, preço real.",
    role: "Função: dano consistente e utilidade fora de combate.",
    bullets: [
      "Ponto forte: pressão constante e estilo único de magia.",
      "Ponto fraco: escolhas de pacto moldam (e limitam) o caminho.",
      "Estilo: rajadas constantes + truques especiais do pacto."
    ]
  },
  wizard: {
    theme: "O estudioso do arcano — conhecimento que vira controle absoluto.",
    role: "Função: controle, utilidade e respostas para qualquer problema.",
    bullets: [
      "Ponto forte: maior variedade e flexibilidade de magia.",
      "Ponto fraco: frágil e depende de preparo/posicionamento.",
      "Estilo: planeja, controla o campo e vence com inteligência."
    ]
  }
};


// ... termina o CLASS_INFO ...

const RACE_APPEARANCE = {
  human: "Pessoas comuns de estaturas e traços variados, sem características físicas extremas.",
  "human-variant": "Fisicamente idênticos aos humanos comuns, mas com postura e marcas de treinamento precoce.",

  "high-elf": "Altos, esguios, orelhas longas e olhar atento, com aparência refinada e elegante.",
  "wood-elf": "Ágeis e atléticos, com traços naturais e roupas que se misturam ao ambiente selvagem.",
  drow: "Pele escura, cabelos claros e olhos marcantes, com aparência austera e intimidadora.",

  "hill-dwarf": "Baixos e robustos, com barbas espessas e feições resistentes.",
  "mountain-dwarf": "Mais largos e musculosos, com armaduras pesadas e aparência imponente.",

  "forest-gnome": "Pequenos, expressivos, com olhos vivos e traços curiosos.",
  "rock-gnome": "Baixos e compactos, com óculos, ferramentas e aparência de inventor.",

  "lightfoot-halfling": "Muito baixos, pés grandes e sorriso fácil, com aparência amigável.",
  "stout-halfling": "Semelhantes aos pés-leves, porém mais parrudos e resistentes.",

  "half-elf": "Traços humanos misturados a orelhas élficas, com aparência exótica e elegante.",
  "half-orc": "Altos e musculosos, com presas salientes, pele esverdeada ou acinzentada.",

  dragonborn: "Humanoides cobertos por escamas, com cabeça dracônica e aparência imponente.",
  tiefling: "Humanoides com chifres, cauda e olhos incomuns, de aparência infernal."
};


let racesCache = null;

const RACE_GROUP_LABELS = {
  human: "Humanos",
  dwarf: "Anões",
  elf: "Elfos",
  halfling: "Halflings",
  gnome: "Gnomos",
  other: "Outras Raças"
};

async function loadRaces() {
  if (racesCache) return racesCache;
  const res = await fetch("./data/phb-races.json");
  racesCache = await res.json();
  return racesCache;
}

// ======= Render =======

export async function renderWizard1() {
  const app = document.getElementById("app");
  let { draft } = getState();

  if (!draft) draft = resetDraft();

  const races = await loadRaces();
  const raceSelectHtml = buildRaceSelectHtml(races, draft.raceId);

  // painéis (baseados na seleção atual)
  const classPanel = renderClassPanel(draft.classId);
  const racePanel = renderRacePanel(races, draft.raceId);
  const bgPanel = renderBackgroundPanel(draft.backgroundId);

  app.innerHTML = `
    <div style="padding:16px; max-width:1000px; margin:0 auto;">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap;">
        <h1>Criação — Etapa 1/4</h1>
        <button id="back">Voltar ao Hub</button>
      </div>

      <div style="margin-top: 12px; display:grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <label style="display:flex; flex-direction:column; gap:6px;">
          Nome do personagem
          <input id="name" type="text" value="${escapeHtml(draft.name)}" placeholder="Ex: Kael" />
          <small style="opacity:.75;">Dica: você pode ajustar depois.</small>
        </label>

        <label style="display:flex; flex-direction:column; gap:6px;">
          Nível
          <input id="level" type="number" min="1" max="20" value="${draft.level}" />
        </label>

        <label style="display:flex; flex-direction:column; gap:6px;">
          Classe
          <select id="classId">
            ${optionList(CLASS_OPTIONS, draft.classId, "Selecione a classe")}
          </select>
        </label>

        <label style="display:flex; flex-direction:column; gap:6px;">
          Raça
          <select id="raceId">
            ${raceSelectHtml}
          </select>
        </label>

        <label style="display:flex; flex-direction:column; gap:6px; grid-column: 1 / -1;">
          Antecedente
          <select id="backgroundId">
            ${optionList(BACKGROUND_OPTIONS, draft.backgroundId, "Selecione o antecedente")}
          </select>
        </label>
      </div>

      <div style="margin-top:16px; display:grid; grid-template-columns: 1fr 1fr 1fr; gap:12px;">
        ${classPanel}
        ${racePanel}
        ${bgPanel}
      </div>

      <div id="error" style="margin-top: 12px; color:#ffb4b4;"></div>

      <div style="display:flex; gap:12px; margin-top: 18px;">
        <button id="next">Próximo</button>
      </div>
    </div>
  `;

  // ====== eventos (sem salvar a cada tecla) ======
  app.querySelector("#back").addEventListener("click", () => navigateTo("/hub"));

  const nameEl = app.querySelector("#name");
  const levelEl = app.querySelector("#level");
  const classEl = app.querySelector("#classId");
  const raceEl = app.querySelector("#raceId");
  const bgEl = app.querySelector("#backgroundId");
  const errEl = app.querySelector("#error");

  // Corrige o bug do foco:
  // - NÃO chama updateDraft no "input" do nome (cada caractere)
  // - salva apenas no "blur" (quando sai do campo) e no "Próximo"
  nameEl.addEventListener("blur", () => {
    const name = nameEl.value.trim();
    updateDraft({ name });
  });

  levelEl.addEventListener("change", () => {
    const level = clampInt(levelEl.value, 1, 20);
    updateDraft({ level });
  });

  classEl.addEventListener("change", () => {
    const classId = classEl.value;
    // melhoria recomendada: ao trocar classe, limpar escolhas dependentes
    updateDraft({
      classId,
      skillProficiencies: [],
      equipmentChoices: { packId: "" }
    });
  });

  raceEl.addEventListener("change", () => {
    const raceId = raceEl.value;
    // ao trocar raça, limpar distribuição de bônus
    updateDraft({
      raceId,
      raceBonusAssignments: []
    });
  });

  bgEl.addEventListener("change", () => {
    const backgroundId = bgEl.value;
    // ao trocar antecedente, pode invalidar escolhas futuras de perícias
    updateDraft({
      backgroundId,
      skillProficiencies: []
    });
  });

  app.querySelector("#next").addEventListener("click", () => {
    // salvar tudo ao avançar (garante que nome digitado sem blur também salva)
    const name = nameEl.value.trim();
    const level = clampInt(levelEl.value, 1, 20);
    const classId = classEl.value;
    const raceId = raceEl.value;
    const backgroundId = bgEl.value;

    updateDraft({ name, level, classId, raceId, backgroundId });

    const missing = [];
    if (!name) missing.push("nome");
    if (!classId) missing.push("classe");
    if (!raceId) missing.push("raça");
    if (!backgroundId) missing.push("antecedente");

    if (missing.length) {
      errEl.textContent = `Preencha: ${missing.join(", ")}.`;
      return;
    }

    errEl.textContent = "";
    navigateTo("/wizard/2");
  });
}

// ======= Helpers =======

function optionList(options, selectedId, placeholder) {
  const opts = options
    .map(
      o => `<option value="${o.id}" ${o.id === selectedId ? "selected" : ""}>${escapeHtml(o.name)}</option>`
    )
    .join("");
  return `<option value="">${escapeHtml(placeholder)}</option>${opts}`;
}

function buildRaceSelectHtml(races, selectedId) {
  const groups = new Map();

  for (const r of races) {
    const g = r.group || "other";
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(r);
  }

  const groupOrder = ["human", "dwarf", "elf", "halfling", "gnome", "other"];
  const sortedGroups = groupOrder
    .filter(g => groups.has(g))
    .map(g => [g, groups.get(g)]);

  const placeholder = `<option value="">Selecione a raça</option>`;

  const optgroups = sortedGroups
    .map(([g, items]) => {
      items.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
      const label = RACE_GROUP_LABELS[g] || "Raças";
      const options = items
        .map(r => `<option value="${r.id}" ${r.id === selectedId ? "selected" : ""}>${escapeHtml(r.name)}</option>`)
        .join("");
      return `<optgroup label="${escapeHtml(label)}">${options}</optgroup>`;
    })
    .join("");

  return placeholder + optgroups;
}

function renderClassPanel(classId) {
  const info = CLASS_INFO[classId];
  if (!classId || !info) {
    return infoCard("Classe", "Selecione uma classe para ver tema e papel.", []);
  }
  return infoCard("Classe", info.theme, [
    info.role,
    ...(info.bullets || [])
  ]);
}


function renderRacePanel(races, raceId) {
  const race = races.find(r => r.id === raceId);
  if (!raceId || !race) {
    return infoCard("Raça", "Selecione uma raça para ver a aparência.", []);
  }

  const appearance = RACE_APPEARANCE[race.id] || "Humanoide com aparência distinta.";

  const bonusValues = Array.isArray(race.bonusValues) ? race.bonusValues : [];
  const bonusText = bonusValues.length
    ? `Bônus: ${bonusValues.map(v => `+${v}`).join(", ")} (você escolhe onde aplicar na Etapa 3)`
    : "Bônus: —";

  return infoCard("Raça", appearance, [bonusText]);
}


function renderBackgroundPanel(backgroundId) {
  if (!backgroundId) {
    return infoCard("Antecedente", "Selecione um antecedente para ver o que você ganha.", []);
  }
  const skills = BACKGROUND_SKILLS[backgroundId] || [];
  const gains = BACKGROUND_GAINS[backgroundId] || [];
  return infoCard("Antecedente", "Você recebe:", [
    skills.length ? `Perícias: ${skills.join(", ")}` : "Perícias: —",
    gains.length ? `Itens/Equipamentos: ${gains.join(", ")}` : "Itens/Equipamentos: —"
  ]);
}

function infoCard(title, subtitle, bullets) {
  return `
    <div style="border:1px solid #333; padding:12px; min-height: 140px;">
      <div style="display:flex; justify-content:space-between; gap:10px;">
        <strong>${escapeHtml(title)}</strong>
      </div>
      <div style="margin-top:8px; opacity:.9;">
        ${escapeHtml(subtitle)}
      </div>
      ${bullets.length ? `
        <ul style="margin:10px 0 0; padding-left:18px; opacity:.9;">
          ${bullets.map(b => `<li>${escapeHtml(b)}</li>`).join("")}
        </ul>
      ` : ``}
    </div>
  `;
}

function clampInt(value, min, max) {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

