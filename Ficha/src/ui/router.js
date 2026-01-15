// src/ui/router.js
import { subscribe, setState, hydrateDraftFromStorage } from "../state/store.js";


import { renderHub } from "./screens/hub.js";
import { renderWizard1 } from "./screens/wizard1.js";
import { renderWizard2 } from "./screens/wizard2.js";
import { renderWizard3 } from "./screens/wizard3.js";
import { renderWizard4 } from "./screens/wizard4.js";
import { renderEquipment } from "./screens/equipment.js";





function parseHash() {
  const hash = (location.hash || "#/hub").slice(1);
  const parts = hash.split("/").filter(Boolean);

  if (parts.length === 0) return { screen: "hub", params: {} };

  const root = parts[0];
  const a = parts[1];

  if (root === "hub") return { screen: "hub", params: {} };
  if (root === "equipment") return { screen: "equipment", params: {} };

  if (root === "wizard") {
    const step = Number(a || "1");
    return { screen: `wizard${step}`, params: { step } };
  }

  return { screen: "hub", params: {} };
}



function renderByState(state) {
  const { screen } = state;

  switch (screen) {
    case "hub":
      return renderHub();
    case "wizard1":
      return renderWizard1();
    case "wizard2":
      return renderWizard2();
    case "wizard3":
      return renderWizard3();
    case "wizard4":
      return renderWizard4();
    case "equipment":
      return renderEquipment();
    default:
      return renderHub();
  }
}


    


export function navigateTo(hashPath) {
  if (!hashPath.startsWith("#")) {
    location.hash = `#${hashPath.startsWith("/") ? "" : "/"}${hashPath}`;
  } else {
    location.hash = hashPath;
  }
}



export function initRouter() {
  // carregar draft local (se existir)
  hydrateDraftFromStorage();


  // re-render quando estado muda
  subscribe(renderByState);

  // sincronizar rota -> estado
  function sync() {
    const { screen, params } = parseHash();
    setState({ screen, params });
  }

  window.addEventListener("hashchange", sync);
  sync();

  
}


