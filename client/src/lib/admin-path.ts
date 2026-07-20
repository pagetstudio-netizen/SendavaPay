/**
 * Chemin secret du panneau d'administration.
 *
 * La valeur est injectée par le serveur Express dans window.__ADMIN_PATH__
 * juste avant </head> de index.html, au moment de chaque requête.
 * Elle n'est JAMAIS incluse dans le bundle JS compilé.
 *
 * En développement (sans ADMIN_SECRET_PATH), la valeur par défaut est "/admin".
 */
declare global {
  interface Window {
    __ADMIN_PATH__?: string;
  }
}

export const ADMIN_PATH: string =
  (typeof window !== "undefined" && window.__ADMIN_PATH__) ? window.__ADMIN_PATH__ : "/admin";
