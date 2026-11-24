export const XRAY_KEY = "xray";
export const INTRO_KEY = "intro-seen";

/**
 * Runs in <head> before first paint so a reload in X-ray shows its panels without a flash.
 * `data-xray` only reveals X-ray-only blocks and darkens the Ask scrim; it never re-themes the page.
 * `?xray=1` turns X-ray on for the session (SPEC §5). Written as a string so it can be
 * inlined and unit-tested against fake globals.
 * It also sets `data-intro-seen` once the intro banner was dismissed (localStorage), so the server-rendered
 * banner and "NEW" pill (.intro-only) are hidden before first paint instead of popping in after hydration.
 */
export const THEME_INIT_SCRIPT = `try{var p=new URLSearchParams(location.search);if(p.get('${XRAY_KEY}')==='1')sessionStorage.setItem('${XRAY_KEY}','1');if(sessionStorage.getItem('${XRAY_KEY}')==='1')document.documentElement.setAttribute('data-xray','')}catch(e){}try{if(localStorage.getItem('${INTRO_KEY}')==='1')document.documentElement.setAttribute('data-intro-seen','')}catch(e){}`;

export function applyXray(on: boolean): void {
  const root = document.documentElement;
  if (on) root.setAttribute("data-xray", "");
  else root.removeAttribute("data-xray");
}
