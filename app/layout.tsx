// app/layout.tsx
import type { Metadata, Viewport } from "next";
import RouteTransitions from "@/components/RouteTransitions"
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnalyticsScripts from "@/lib/analytics";
import { inter, candara } from "@/lib/fonts";
import Script from "next/script";
import { listGlossaryIndex } from "@/lib/wp";

export const metadata: Metadata = {
  title: "SonShine Roofing — Sarasota, Manatee & Charlotte Counties",
  description:
    "Residential roof repair, replacement, inspections, and preventative maintenance. Since 1987 we’ve got you covered.",
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#0045d7" }],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let glossaryIndex: { slug: string; title: string }[] = [];
  try {
    const idx = await listGlossaryIndex(500);
    if (Array.isArray(idx)) {
      glossaryIndex = idx
        .filter(t => t && typeof t.slug === "string" && typeof t.title === "string")
        .map(t => ({ slug: t.slug, title: t.title }));
    }
  } catch { }
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${candara.variable}`}
    >
      <head>
        {/* Preconnects for faster YouTube thumbs & embeds */}
        <link rel="preconnect" href="https://i.ytimg.com" crossOrigin="" />
        <link rel="preconnect" href="https://www.youtube-nocookie.com" crossOrigin="" />

        {/* Facebook Share Button Attribution*/}
        <meta property="fb:app_id" content="1087269253041713" />

        {/* site-wide glossary index (filled server-side when available) */}
        <script id="glossary-index" type="application/json">
          {JSON.stringify(glossaryIndex)}
        </script>
      </head>
      <body
        className="
          min-h-svh flex flex-col
          bg-neutral-50 text-slate-900 antialiased
          selection:bg-[#0045d7] selection:text-white
        "
      >
        <AnalyticsScripts />
        <Header />
        <main className="flex-1">
          <RouteTransitions variant="zoom" duration={0.35}>
            {children}
          </RouteTransitions>
        </main>
        <Footer />
        {/* Tawk.to live chat (loads on every page) */}
        <Script id="tawk-init" strategy="afterInteractive">
          {`
            window.Tawk_API = window.Tawk_API || {};
            window.Tawk_LoadStart = new Date();
          `}
        </Script>
        <Script
          id="tawk-script"
          strategy="afterInteractive"
          src="https://embed.tawk.to/5a971646d7591465c708203c/default"
          crossOrigin="anonymous"
        />
        {/* Auto-link glossary terms across the site (runs after hydration) */}
        <Script id="glossary-autolink" strategy="afterInteractive">
          {`
            (function(){
              const FORBID = new Set(['A','CODE','PRE','SCRIPT','STYLE','NOSCRIPT','KBD','SAMP']);

              function parseIndex(){
                try {
                  const tag = document.getElementById('glossary-index');
                  if (!tag) return [];
                  const json = tag.textContent || '[]';
                  const arr = JSON.parse(json);
                  return Array.isArray(arr) ? arr.filter(x => x && x.slug && x.title) : [];
                } catch(e){ return []; }
              }

              function escapeRegExp(s){
                return s.replace(/[.*+?^{}$()|[\\]\\\\]/g, '\\\\$&');
              }

              function buildMatcher(items){
                if (!items.length) return null;
                const sorted = items.slice().sort((a,b)=>b.title.length - a.title.length);
                const byTitle = new Map(sorted.map(t => [t.title.toLowerCase(), t.slug]));
                const pattern = sorted.map(t => escapeRegExp(t.title)).join('|');
                if (!pattern) return null;
                const re = new RegExp('(?<![\\\\w-])(' + pattern + ')(?![\\\\w-])','gi');
                return { re, byTitle };
              }

              function isInForbidden(el){
                let n = el;
                while(n){
                  if (n.nodeType === 1) {
                    const tag = n.tagName;
                    if (FORBID.has(tag)) return true;
                    if (tag === 'A' && n.hasAttribute('data-glossary-link')) return true; // our own links
                  }
                  n = n.parentNode;
                }
                return false;
              }

              function linkifyNode(textNode, matcher, onceSet, budget){
                const text = textNode.nodeValue;
                if (!text) return 0;
                matcher.re.lastIndex = 0;
                let m, last = 0, made = 0;
                const frag = document.createDocumentFragment();
                while ((m = matcher.re.exec(text)) && budget.count > 0){
                  const match = m[1];
                  const slug = matcher.byTitle.get(match.toLowerCase());
                  if (!slug || onceSet.has(slug)) continue;
                  const before = text.slice(last, m.index);
                  if (before) frag.appendChild(document.createTextNode(before));
                  const a = document.createElement('a');
                  a.href = '/roofing-glossary/' + slug;
                  a.className = 'underline decoration-dotted hover:decoration-solid';
                  a.setAttribute('data-glossary-link','');
                  a.textContent = match;
                  frag.appendChild(a);
                  last = m.index + match.length;
                  onceSet.add(slug);
                  budget.count--;
                  made++;
                }
                if (made > 0){
                  const rest = text.slice(last);
                  if (rest) frag.appendChild(document.createTextNode(rest));
                  textNode.parentNode && textNode.parentNode.replaceChild(frag, textNode);
                }
                return made;
              }

              function scan(root, matcher){
                if (!root || !matcher) return;
                const onceSet = new Set();
                const budget = { count: 40 };
                const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
                  acceptNode(node){
                    if (!node.nodeValue || node.nodeValue.trim() === '') return NodeFilter.FILTER_REJECT;
                    if (isInForbidden(node.parentNode)) return NodeFilter.FILTER_REJECT;
                    return NodeFilter.FILTER_ACCEPT;
                  }
                });
                const nodes = [];
                let cur; while ((cur = walker.nextNode())) nodes.push(cur);
                for (const n of nodes){
                  if (budget.count <= 0) break;
                  linkifyNode(n, matcher, onceSet, budget);
                }
              }

              function currentSlug(){
                const p = location.pathname;
                const parts = p.split('/').filter(Boolean);
                if (parts[0] === 'roofing-glossary' && parts[1]) return parts[1];
                return null;
              }

              function init(){
                const index = parseIndex();
                if (!index.length) return; // no data, skip silently
                const cur = currentSlug();
                const items = cur ? index.filter(t => t.slug !== cur) : index;
                const matcher = buildMatcher(items);
                if (!matcher) return;
                const main = document.querySelector('main') || document.body;
                const run = () => scan(main, matcher);
                // Initial run
                run();
                // Re-run on content changes (SPA route transitions)
                const mo = new MutationObserver((muts)=>{
                  for (const m of muts){ if (m.type === 'childList') { run(); break; } }
                });
                mo.observe(main, { childList: true, subtree: true });
              }

              if (document.readyState === 'complete' || document.readyState === 'interactive') init();
              else document.addEventListener('DOMContentLoaded', init);
            })();
          `}
        </Script>
      </body>
    </html>
  );
}
