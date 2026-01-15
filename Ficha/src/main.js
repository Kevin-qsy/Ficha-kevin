import { initRouter } from "./ui/router.js";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw/service-worker.js");
}

initRouter();
