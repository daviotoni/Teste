import React, { useState, useMemo } from "react";
import {
  Home, CalendarDays, Compass, Vote, Sparkles, MapPin, Star,
  Check, X, HelpCircle, Clock, Users, ChevronRight, Share2,
  CalendarPlus, Trophy, Plus, Heart, Utensils, ArrowLeft,
  Ban, Megaphone, Camera, Scale, LogOut, Lock, Search, SlidersHorizontal,
} from "lucide-react";

/* ============================================================
   ENCONTRO DE CASAIS SUCESSO ABSOLUTO — protótipo navegável
   Paleta: areia / vinho / terracota / oliva / dourado
   Assinatura: "medidor de oito" — fileira de 8 que se preenche
   ============================================================ */

/* ------------------------------------------------------------
   EDITORIAL RIVIERA — direção de arte aplicada
   Revista de viagem de luxo → app. Fraunces + Archivo,
   papel marfim, ouro-foil, marinho-petróleo, vermelho-escândalo.
   As chaves antigas foram remapeadas para os tons editoriais
   (mesmos nomes → toda a UI herda a nova cara).
   ------------------------------------------------------------ */
const C = {
  sand: "#EFE9DC",      // papel
  sandDeep: "#E3DAC7",  // superfície / mesa da revista
  cream: "#F6F2E9",     // papel elevado (cards)
  wine: "#123B3A",      // marinho-petróleo — cor de marca (títulos, botões, nav)
  wineDeep: "#0C2523",  // marinho profundo
  wineSoft: "#2C5F5B",  // marinho claro
  terra: "#A9834A",     // ouro antigo — acentos, olho, stepper
  terraSoft: "#CBA867", // ouro claro
  olive: "#2C5F5B",     // estados positivos (podem / confirmado) → marinho claro
  gold: "#A9834A",      // ouro (estrelas, foil)
  ink: "#211B14",       // tinta espresso — texto
  mute: "#8C8474",      // tinta desbotada — legendas
  line: "#D9CFBB",      // fio de régua
  // acentos exclusivos do "Mural da Vergonha"
  scandal: "#C0301C",
  scandalDeep: "#7E1C10",
  goldDeep: "#7E5F31",
  marine: "#123B3A",
  foil: "linear-gradient(115deg,#7E5F31 0%,#CBA867 34%,#F0DFAE 50%,#B5904F 68%,#8A6B39 100%)",
};

/* sombras editoriais — profundas, viés tinta/papel */
const SH = {
  card: "0 2px 4px rgba(33,27,20,.03), 0 18px 40px -24px rgba(33,27,20,.28)",
  cardHover: "0 8px 14px rgba(33,27,20,.05), 0 30px 60px -26px rgba(33,27,20,.42)",
  screen: "38px 60px 90px -58px rgba(33,27,20,.5), 0 0 0 1px rgba(33,27,20,.06)",
  btn: "0 10px 22px -12px",
};

/* ---------- dados fictícios ---------- */

const PEOPLE = [
  { id: "davi",   name: "Davi",          couple: "A", color: "#7A2A3D" },
  { id: "isabel", name: "Isabel",        couple: "A", color: "#A83E56" },
  { id: "luca",   name: "Luca",          couple: "B", color: "#C56A49" },
  { id: "mayara", name: "Mayara",        couple: "B", color: "#D98A5E" },
  { id: "gabi",   name: "Maria Gabriela",couple: "C", color: "#4A5A3A" },
  { id: "vini",   name: "Vinicius",      couple: "C", color: "#6B7A4A" },
  { id: "vitor",  name: "Vitor",         couple: "D", color: "#C9A24B" },
  { id: "gab",    name: "Gabrielle",     couple: "D", color: "#D9B85E" },
];

const COUPLES = [
  { id: "A", label: "Davi & Isabel", members: ["davi", "isabel"] },
  { id: "B", label: "Luca & Mayara", members: ["luca", "mayara"] },
  { id: "C", label: "Maria Gabriela & Vinicius", members: ["gabi", "vini"] },
  { id: "D", label: "Vitor & Gabrielle", members: ["vitor", "gab"] },
];

let ME = "davi"; // definido na tela de login

const initials = (n) => n.split(" ").map((w) => w[0]).slice(0, 2).join("");
const person = (id) => PEOPLE.find((p) => p.id === id);

const PLACES = [
  { id: 1, name: "Aconchego Carioca", cat: "Restaurante", hood: "Praça da Bandeira", price: 3, rating: 4.7, img: "linear-gradient(135deg,#7A2A3D,#C56A49)", desc: "Boteco premiado, bolinho de feijoada lendário.", tags: ["Boteco", "Área externa", "Reserva"], dist: "8 km" },
  { id: 2, name: "Ferro e Farinha", cat: "Restaurante", hood: "Catete", price: 2, rating: 4.6, img: "linear-gradient(135deg,#4A5A3A,#6B7A4A)", desc: "Pizza napolitana em forno a lenha, fila que vale.", tags: ["Pizza", "Vegetariano", "Música"], dist: "22 km" },
  { id: 3, name: "Rooftop Yalla", cat: "Rooftop", hood: "Leblon", price: 4, rating: 4.5, img: "linear-gradient(135deg,#C56A49,#C9A24B)", desc: "Mezze árabe com vista pro mar e pôr do sol.", tags: ["Vista", "Drinks", "Área externa"], dist: "18 km" },
  { id: 4, name: "Oteque", cat: "Restaurante", hood: "Botafogo", price: 5, rating: 4.9, img: "linear-gradient(135deg,#5C1A2B,#2A211E)", desc: "Duas estrelas, menu degustação para ocasiões.", tags: ["Fine dining", "Reserva", "Especial"], dist: "20 km" },
  { id: 5, name: "Bar do Momo", cat: "Bar", hood: "Tijuca", price: 2, rating: 4.4, img: "linear-gradient(135deg,#7A2A3D,#A83E56)", desc: "Chope gelado e porções generosas, clima de bairro.", tags: ["Boteco", "Grupo", "Barato"], dist: "12 km" },
  { id: 6, name: "Comuna", cat: "Bar", hood: "Botafogo", price: 3, rating: 4.5, img: "linear-gradient(135deg,#C56A49,#D98A5E)", desc: "Hambúrguer, cerveja artesanal e zine na parede.", tags: ["Burger", "Música", "Descolado"], dist: "20 km" },
  { id: 7, name: "Café Lamas", cat: "Restaurante", hood: "Flamengo", price: 2, rating: 4.3, img: "linear-gradient(135deg,#4A5A3A,#C9A24B)", desc: "Clássico desde 1874, filé à Osvaldo Aranha.", tags: ["Tradicional", "Tarde", "Reserva"], dist: "21 km" },
  { id: 8, name: "Sushi Leblon", cat: "Restaurante", hood: "Leblon", price: 4, rating: 4.6, img: "linear-gradient(135deg,#5C1A2B,#7A2A3D)", desc: "Japonês contemporâneo, balcão para conversar.", tags: ["Japonês", "Reserva", "Chique"], dist: "18 km" },
  { id: 9, name: "Braseiro da Gávea", cat: "Restaurante", hood: "Gávea", price: 3, rating: 4.4, img: "linear-gradient(135deg,#C9A24B,#D98A5E)", desc: "Picanha na praça, mesa na calçada, sábado cheio.", tags: ["Carne", "Área externa", "Grupo"], dist: "17 km" },
  { id: 10, name: "Espírito Santa", cat: "Restaurante", hood: "Santa Teresa", price: 3, rating: 4.7, img: "linear-gradient(135deg,#7A2A3D,#4A5A3A)", desc: "Amazônico com varanda e vista da cidade.", tags: ["Vista", "Diferente", "Área externa"], dist: "16 km" },
];

const OUTINGS = [
  { id: 11, name: "Trilha Pedra Bonita", cat: "Ao ar livre", hood: "São Conrado", price: 0, rating: 4.8, img: "linear-gradient(135deg,#4A5A3A,#6B7A4A)", desc: "Nascer do sol e rampa de voo livre.", tags: ["Grátis", "Manhã", "Natureza"], dist: "19 km" },
  { id: 12, name: "Jardim Botânico", cat: "Ao ar livre", hood: "Jardim Botânico", price: 1, rating: 4.7, img: "linear-gradient(135deg,#6B7A4A,#C9A24B)", desc: "Caminhada tranquila entre orquídeas e macacos.", tags: ["Natureza", "Tarde", "Barato"], dist: "17 km" },
  { id: 13, name: "Passeio de barco Baía", cat: "Experiência", hood: "Urca", price: 3, rating: 4.6, img: "linear-gradient(135deg,#C56A49,#5C1A2B)", desc: "Fim de tarde na baía com o Pão de Açúcar de fundo.", tags: ["Vista", "Diferente", "Fim de tarde"], dist: "21 km" },
  { id: 14, name: "Feira da Glória", cat: "Programa", hood: "Glória", price: 1, rating: 4.3, img: "linear-gradient(135deg,#C9A24B,#C56A49)", desc: "Domingo de rua, pastel e caldo de cana.", tags: ["Grátis", "Domingo", "Rua"], dist: "21 km" },
  { id: 15, name: "AquaRio", cat: "Passeio", hood: "Gamboa", price: 3, rating: 4.4, img: "linear-gradient(135deg,#4A5A3A,#5C1A2B)", desc: "Maior aquário da América do Sul, bom pra chuva.", tags: ["Chuva", "Diferente", "Coberto"], dist: "23 km" },
];

const EVENTS = [
  { id: 16, name: "Show na Fundição", cat: "Show", hood: "Centro", price: 3, rating: 4.5, img: "linear-gradient(135deg,#5C1A2B,#C56A49)", desc: "Samba de raiz, sexta, ingresso na porta.", tags: ["Música", "Noite", "Sexta"], dist: "24 km" },
  { id: 17, name: "Peça no Teatro Poeira", cat: "Teatro", hood: "Botafogo", price: 3, rating: 4.7, img: "linear-gradient(135deg,#7A2A3D,#C9A24B)", desc: "Comédia elogiada, sessão às 20h.", tags: ["Teatro", "Noite", "Reserva"], dist: "20 km" },
  { id: 18, name: "Expo no MAR", cat: "Exposição", hood: "Praça Mauá", price: 1, rating: 4.4, img: "linear-gradient(135deg,#4A5A3A,#C56A49)", desc: "Arte carioca, entrada barata e ar-condicionado.", tags: ["Cultura", "Chuva", "Barato"], dist: "23 km" },
  { id: 19, name: "Cinema na Lagoa", cat: "Cinema", hood: "Lagoa", price: 2, rating: 4.6, img: "linear-gradient(135deg,#6B7A4A,#5C1A2B)", desc: "Sessão ao ar livre na beira da Lagoa.", tags: ["Ar livre", "Noite", "Diferente"], dist: "18 km" },
  { id: 20, name: "Stand-up no Comedians", cat: "Show", hood: "Barra", price: 3, rating: 4.5, img: "linear-gradient(135deg,#C56A49,#C9A24B)", desc: "Line-up de humoristas, mesas para grupo.", tags: ["Comédia", "Noite", "Grupo"], dist: "3 km" },
];

const ALL_PLACES = [...PLACES, ...OUTINGS, ...EVENTS];
const priceLabel = (p) => (p === 0 ? "Grátis" : "$".repeat(p));

/* ---------- zonas do Rio (região de cada bairro) ---------- */
const ZONE_OF = {
  "Leblon": "Zona Sul", "Botafogo": "Zona Sul", "Flamengo": "Zona Sul", "Gávea": "Zona Sul",
  "Jardim Botânico": "Zona Sul", "Urca": "Zona Sul", "Lagoa": "Zona Sul", "Catete": "Zona Sul",
  "Glória": "Zona Sul", "São Conrado": "Zona Sul",
  "Praça da Bandeira": "Zona Norte", "Tijuca": "Zona Norte",
  "Santa Teresa": "Centro", "Centro": "Centro", "Praça Mauá": "Centro", "Gamboa": "Centro",
  "Barra": "Zona Oeste",
};
const REGIONS = ["Todas", "Zona Sul", "Zona Norte", "Centro", "Zona Oeste"];
const zoneOf = (hood) => ZONE_OF[hood] || (REGIONS.includes(hood) ? hood : "Outras");
/* normaliza p/ busca (minúsculas, sem acento) */
const norm = (s) => (s || "").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

/* ---------- persistencia local (sem backend; pronto p/ trocar por API) ----------
   Toda a "verdade" que o usuario cria vive aqui e sobrevive ao refresh.
   Se o localStorage estiver bloqueado (iframe restrito), cai para memoria. */
const LS_KEY = "sa:v1";
const store = {
  read() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; }
    catch { return {}; }
  },
  write(obj) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(obj)); } catch { /* ignora */ }
  },
  clear() { try { localStorage.removeItem(LS_KEY); } catch { /* ignora */ } },
};

/* copiar/compartilhar robusto (Web Share -> Clipboard -> fallback manual).
   Retorna o metodo usado, para um feedback honesto ao usuario. */
async function shareOrCopy(text) {
  try {
    if (navigator.share) { await navigator.share({ text }); return "share"; }
  } catch { /* cancelado/indisponivel -> tenta copiar */ }
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text); return "copy";
    }
  } catch { /* segue p/ fallback */ }
  try {
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.focus(); ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    if (ok) return "copy";
  } catch { /* nada funcionou */ }
  return "manual";
}

/* votação de datas — votos individuais (8 pessoas) */
/* votação de datas — cada opção tem data, horário e 4 níveis:
   prefer (posso e prefiro) · can (posso) · maybe (talvez) · no (não posso).
   "podem" = prefer + can. Preferência serve de desempate. */
const DATE_OPTIONS = [
  { id: "d1", date: "8 ago", weekday: "Sex", slot: "Jantar", time: "20h30",
    prefer: ["davi", "isabel", "luca"], can: ["mayara", "gabi", "vini", "vitor"], maybe: ["gab"], no: [] },
  { id: "d2", date: "9 ago", weekday: "Sáb", slot: "Noite", time: "21h00",
    prefer: ["mayara", "gabi"], can: ["davi", "isabel", "luca", "vini", "vitor"], maybe: [], no: ["gab"] },
  { id: "d3", date: "16 ago", weekday: "Sáb", slot: "Almoço", time: "13h00",
    prefer: ["gab"], can: ["davi", "luca", "mayara"], maybe: ["isabel", "vitor"], no: ["gabi", "vini"] },
  { id: "d4", date: "23 ago", weekday: "Sáb", slot: "Jantar", time: "20h00",
    prefer: ["vitor", "gab"], can: ["gabi", "vini"], maybe: ["luca"], no: ["davi", "isabel", "mayara"] },
];
/* meses p/ formatar datas escolhidas no seletor nativo */
const MONTHS_ABBR = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const WEEKDAYS_ABBR = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
/* "2026-07-25" -> { date:"25 jul", weekday:"Sáb" } (parse local, sem shift de fuso) */
function fmtISODate(iso) {
  const [y, m, d] = (iso || "").split("-").map(Number);
  if (!y || !m || !d) return { date: iso || "", weekday: "" };
  const dt = new Date(y, m - 1, d);
  return { date: `${d} ${MONTHS_ABBR[m - 1]}`, weekday: WEEKDAYS_ABBR[dt.getDay()] };
}
/* "19:30" -> "19h30" */
const fmtTime = (t) => (t ? t.replace(":", "h") : "");
/* prazo da votação (demo; no app real viria do encontro) */
const VOTE_DEADLINE = "qua, 6 ago, 20h";

/* votação de lugares — pontuação 3/2/1 */
const PLACE_BALLOTS = {
  davi:   [1, 3, 5], isabel: [1, 3, 9], luca: [3, 1, 6],
  mayara: [1, 8, 3], gabi:   [10, 1, 3], vini: [1, 5, 9],
  // vitor e gab ainda não votaram
};
const PLACE_OPTIONS = [1, 3, 5, 8, 9, 10];
const VETOED_BY_OTHERS = [8]; // Sushi Leblon — vetado em sigilo por alguém do grupo

const CONFIRMED = {
  name: "Jantar de agosto",
  date: "Sexta, 8 de agosto",
  time: "20h30",
  place: PLACES[0],
  address: "R. Barão de Iguatemi, 379 — Praça da Bandeira",
  avg: "R$ 120",
  reservedBy: "Maria Gabriela",
  code: "Reserva em nome de Gabriela, 8 pessoas",
  going: ["davi", "isabel", "luca", "mayara", "gabi", "vini", "vitor"],
};

const MEMORIES = [
  { id: "m1", name: "Aniversário da Mayara", place: "Espírito Santa", hood: "Santa Teresa", date: "Jun 2025", avg: "R$ 135", rating: 4.8, img: "linear-gradient(135deg,#7A2A3D,#4A5A3A)", again: true },
  { id: "m2", name: "Rooftop de outono", place: "Rooftop Yalla", hood: "Leblon", date: "Mai 2025", avg: "R$ 160", rating: 4.5, img: "linear-gradient(135deg,#C56A49,#C9A24B)", again: true },
  { id: "m3", name: "Domingo de pizza", place: "Ferro e Farinha", hood: "Catete", date: "Abr 2025", avg: "R$ 80", rating: 4.6, img: "linear-gradient(135deg,#4A5A3A,#6B7A4A)", again: true },
  { id: "m4", name: "Estreia do ano", place: "Aconchego Carioca", hood: "Praça da Bandeira", date: "Fev 2025", avg: "R$ 110", rating: 4.9, img: "linear-gradient(135deg,#5C1A2B,#C56A49)", again: true },
];

/* Mural da Vergonha — o lado B do histórico */
const PHOTO_MAMMA_JAMMA = "data:image/jpeg;base64,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";
const INFRACTIONS = [
  {
    id: "i1",
    caught: ["vitor", "gab", "luca", "mayara"],
    place: "Mamma Jamma", date: "14 mar",
    severity: "CONLUIO A QUATRO",
    photo: PHOTO_MAMMA_JAMMA,
    proof: "A própria selfie — sorrindo, sem remorso",
    excuse: "Foi de última hora, juro.",
    detail: "Quatro pratos, azeite na mesa e cardápio aberto. A perícia identificou o local pela garrafa de olio d'oliva. Premeditação evidente.",
    verdict: "condenados",
    votes: { rejeita: 4, aceita: 0 },
    pena: "Sobremesa de todos no próximo encontro — e repetir a Mamma Jamma a oito.",
  },
];

/* ---------- primitivos de UI ---------- */

function Avatar({ id, size = 32, ring = false }) {
  const p = person(id);
  if (!p) return null;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", background: p.color,
      color: "#fff", display: "grid", placeItems: "center",
      fontSize: size * 0.36, fontWeight: 600, flexShrink: 0,
      fontFamily: "Archivo, sans-serif",
      boxShadow: ring ? `0 0 0 2px ${C.sand}, 0 0 0 4px ${p.color}` : "none",
    }}>
      {initials(p.name)}
    </div>
  );
}

function AvatarStack({ ids, size = 28, max = 8 }) {
  const shown = ids.slice(0, max);
  return (
    <div style={{ display: "flex" }}>
      {shown.map((id, i) => (
        <div key={id} style={{ marginLeft: i === 0 ? 0 : -size * 0.32 }}>
          <Avatar id={id} size={size} ring />
        </div>
      ))}
    </div>
  );
}

/* medidor de oito — a assinatura do app */
/* medidor de oito — reinterpretado como traços de contagem em ouro (viés editorial) */
function EightMeter({ filled, size = 12, gap = 6, color = C.gold, label }) {
  const H = Math.round(size * 1.9);
  return (
    <div>
      <div style={{
        display: "inline-flex", alignItems: "flex-end", gap: Math.max(4, gap - 1),
        padding: "0 2px 6px", borderBottom: `1px solid ${C.line}`,
      }}>
        {Array.from({ length: 8 }).map((_, i) => {
          const on = i < filled;
          return (
            <div key={i} style={{
              width: 2.5, height: on ? H : Math.round(H * 0.62), borderRadius: 2,
              background: on ? color : "transparent",
              border: on ? "none" : `1.5px solid ${C.line}`,
              transition: "height .3s ease, background .3s ease",
            }} />
          );
        })}
      </div>
      {label && <div style={{ fontSize: 12, color: C.mute, marginTop: 6, fontFamily: "Archivo, sans-serif" }}>{label}</div>}
    </div>
  );
}

function Pill({ children, bg = C.sandDeep, fg = C.ink }) {
  return (
    <span style={{
      background: bg, color: fg, fontSize: 11, fontWeight: 600,
      padding: "3px 9px", borderRadius: 999, whiteSpace: "nowrap",
      fontFamily: "Archivo, sans-serif",
    }}>{children}</span>
  );
}

function Card({ children, style, className = "" }) {
  return (
    <div className={`sa-card ${className}`} style={{
      background: C.cream, borderRadius: 20, border: `1px solid ${C.line}`,
      boxShadow: SH.card, overflow: "hidden", ...style,
    }}>{children}</div>
  );
}

function Btn({ children, onClick, variant = "solid", full, small, disabled, type = "button", ...rest }) {
  const base = {
    border: "none", borderRadius: 14, cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 600, fontFamily: "Archivo, sans-serif",
    padding: small ? "8px 14px" : "13px 18px", fontSize: small ? 13 : 15,
    width: full ? "100%" : "auto", display: "inline-flex", alignItems: "center",
    justifyContent: "center", gap: 8,
    opacity: disabled ? 0.45 : 1,
  };
  const styles = {
    solid: { ...base, background: C.wine, color: "#fff", boxShadow: disabled ? "none" : `${SH.btn} rgba(62,16,25,.6)` },
    terra: { ...base, background: C.terra, color: "#fff", boxShadow: disabled ? "none" : `${SH.btn} rgba(197,106,73,.6)` },
    ghost: { ...base, background: C.cream, color: C.wine, border: `1.5px solid ${C.line}` },
    olive: { ...base, background: C.olive, color: "#fff", boxShadow: disabled ? "none" : `${SH.btn} rgba(74,90,58,.6)` },
  };
  return (
    <button type={type} onClick={disabled ? undefined : onClick} disabled={disabled}
      className={`sa-btn ${disabled ? "is-disabled" : ""}`} style={styles[variant]} {...rest}
    >{children}</button>
  );
}

function Stars({ n, size = 14 }) {
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} fill={i <= Math.round(n) ? C.gold : "none"}
          color={i <= Math.round(n) ? C.gold : C.line} strokeWidth={1.5} />
      ))}
    </span>
  );
}

function SectionTitle({ eyebrow, title, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
      <div>
        {eyebrow && <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: C.terra, fontWeight: 700, marginBottom: 4 }}>{eyebrow}</div>}
        <h2 style={{ fontFamily: "Fraunces, serif", fontSize: 22, color: C.wine, margin: 0, fontWeight: 600 }}>{title}</h2>
      </div>
      {action}
    </div>
  );
}

function Header({ title, sub }) {
  return (
    <div style={{ padding: "26px 20px 14px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 14, color: C.goldDeep }}>
        <span style={{ height: 1, flex: 1, maxWidth: 40, background: C.line }} />
        <span style={{ fontSize: 9.5, letterSpacing: "0.3em", textTransform: "uppercase", fontWeight: 600, fontFamily: "Archivo, sans-serif", textAlign: "center" }}>Encontro de Casais · Sucesso Absoluto</span>
        <span style={{ height: 1, flex: 1, maxWidth: 40, background: C.line }} />
      </div>
      <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 40, color: C.ink, margin: 0, fontWeight: 560, letterSpacing: -0.8, lineHeight: 0.98, textWrap: "balance" }}>{title}</h1>
      {sub && <p style={{ color: C.mute, margin: "12px 0 0", fontSize: 14, lineHeight: 1.6, maxWidth: 380 }}>{sub}</p>}
      <div style={{ height: 2, width: 120, marginTop: 16, borderRadius: 2, background: C.foil }} />
    </div>
  );
}

/* ---------- TELAS ---------- */

/* INÍCIO */
function HomeScreen({ go, encontros = [], dateVotes = {}, customDates = [] }) {
  const options = [...DATE_OPTIONS, ...customDates];
  const voters = new Set();
  options.forEach((d) => [...(d.prefer || []), ...d.can, ...d.maybe, ...d.no].forEach((p) => voters.add(p)));
  // considera meu voto registrado (persistido) mesmo que eu ainda não estivesse nas listas
  Object.entries(dateVotes).forEach(([, v]) => { if (v) voters.add(ME); });
  const meVoted = voters.has(ME) || Object.values(dateVotes).some(Boolean);
  const missing = Math.max(0, 8 - voters.size);
  const myVoteOf = (d) => Object.prototype.hasOwnProperty.call(dateVotes, d.id) ? dateVotes[d.id]
    : ((d.prefer || []).includes(ME) ? "prefer" : d.can.includes(ME) ? "can" : d.maybe.includes(ME) ? "maybe" : d.no.includes(ME) ? "no" : null);
  const podemCount = (d) => [...(d.prefer || []), ...d.can].filter((p) => p !== ME).length + (["prefer", "can"].includes(myVoteOf(d)) ? 1 : 0);
  const best = [...options].sort((a, b) => podemCount(b) - podemCount(a))[0];

  const steps = ["Escolher datas", "Escolher lugares", "Confirmar", "Reservar", "Encontro"];
  const currentStep = 1;

  return (
    <div>
      <Header title="Bora marcar o próximo?" sub="Jantar de agosto está em votação de datas." />

      <div style={{ padding: "8px 20px 20px" }}>
        <Card style={{ marginBottom: 18 }}>
          <div style={{ height: 130, background: "linear-gradient(140deg,#1C4A47,#0C2523 72%)", position: "relative", display: "flex", alignItems: "flex-end", padding: 16 }}>
            <div style={{ position: "absolute", top: 14, right: 14 }}>
              <Pill bg="rgba(255,255,255,.9)" fg={C.wine}>Votação aberta</Pill>
            </div>
            <div style={{ color: "#fff" }}>
              <div style={{ fontSize: 12, opacity: .85 }}>Próximo encontro</div>
              <div style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 600 }}>Jantar de agosto</div>
            </div>
          </div>
          <div style={{ padding: 16 }}>
            <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
              {steps.map((s, i) => (
                <div key={s} style={{ flex: 1 }}>
                  <div style={{ height: 4, borderRadius: 2, background: i < currentStep ? C.terra : i === currentStep ? C.wine : C.line }} />
                  <div style={{ fontSize: 9.5, color: i <= currentStep ? C.ink : C.mute, marginTop: 5, textAlign: "center", fontWeight: i === currentStep ? 700 : 500 }}>{s}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 13, color: C.mute }}>Já votaram</div>
                <div style={{ fontFamily: "Fraunces, serif", fontSize: 26, color: C.wine, fontWeight: 600 }}>{voters.size} <span style={{ fontSize: 16, color: C.mute }}>de 8</span></div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, color: C.mute, marginBottom: 6 }}>Prazo: {VOTE_DEADLINE}</div>
                <EightMeter filled={voters.size} />
              </div>
            </div>

            {/* a Home lidera com a próxima ação */}
            {!meVoted ? (
              <div style={{ background: C.sandDeep, borderRadius: 12, padding: "10px 12px", marginBottom: 12, fontSize: 13, color: C.wine, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                <HelpCircle size={16} /> Falta você votar — some-se aos {voters.size} para fechar a data.
              </div>
            ) : missing > 0 ? (
              <div style={{ background: C.sandDeep, borderRadius: 12, padding: "10px 12px", marginBottom: 12, fontSize: 13, color: C.wine, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                <Clock size={16} /> Faltam {missing} {missing === 1 ? "voto" : "votos"} pra fechar a data. Líder: <b>&nbsp;{best.weekday}, {best.date}{best.time ? ` · ${best.time}` : ""}</b>.
              </div>
            ) : (
              <div style={{ background: "#EAF0E4", borderRadius: 12, padding: "10px 12px", marginBottom: 12, fontSize: 13, color: C.olive, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                <Check size={16} /> Todos votaram! Melhor data: <b>&nbsp;{best.weekday}, {best.date}{best.time ? ` · ${best.time}` : ""}</b>.
              </div>
            )}

            <Btn full onClick={() => go("calendar")}>
              <Vote size={18} /> {meVoted ? "Rever meu voto nas datas" : "Votar agora nas datas"}
            </Btn>
          </div>
        </Card>

        {/* criar novo encontro */}
        <Card style={{ marginBottom: 18, padding: 16, cursor: "pointer" }}>
          <div onClick={() => go("create")} style={{ display: "flex", alignItems: "center", gap: 14, width: "100%" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: C.terra, display: "grid", placeItems: "center", color: "#fff" }}>
              <Plus size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: C.wine, fontFamily: "Fraunces, serif", fontSize: 17 }}>Criar um encontro</div>
              <div style={{ fontSize: 12, color: C.mute }}>Qualquer um dos oito pode começar.</div>
            </div>
            <ChevronRight size={20} color={C.mute} />
          </div>
        </Card>

        {encontros.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <SectionTitle eyebrow="Criados por você" title={`${encontros.length} ${encontros.length === 1 ? "encontro" : "encontros"}`} />
            {encontros.map((e) => (
              <Card key={e.id} style={{ padding: 14, marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: C.foil, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: C.wine, fontFamily: "Fraunces, serif", fontSize: 16 }}>{e.name}</div>
                    <div style={{ fontSize: 12, color: C.mute }}>{[e.type, e.price, e.period].filter(Boolean).join(" · ")}</div>
                  </div>
                  <Pill bg="#EAF0E4" fg={C.olive}>Votação aberta</Pill>
                </div>
              </Card>
            ))}
          </div>
        )}

        <SectionTitle eyebrow="Enquanto isso" title="Última memória" action={<button type="button" onClick={() => go("memories")} style={{ background: "none", border: "none", color: C.terra, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Ver todas</button>} />
        <Card>
          <div style={{ display: "flex", gap: 14, padding: 14 }}>
            <div style={{ width: 64, height: 64, borderRadius: 14, background: MEMORIES[0].img, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: C.ink }}>{MEMORIES[0].name}</div>
              <div style={{ fontSize: 13, color: C.mute, marginBottom: 6 }}>{MEMORIES[0].place} · {MEMORIES[0].date}</div>
              <Stars n={MEMORIES[0].rating} />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* CALENDÁRIO / VOTAÇÃO DE DATAS */
function CalendarScreen({ dateVotes = {}, onVote, customDates = [], onAddDate }) {
  const options = [...DATE_OPTIONS, ...customDates];
  const [adding, setAdding] = useState(false);
  const [nd, setNd] = useState({ iso: "", time: "", slot: "Jantar" });

  // meu voto efetivo: o que registrei (persistido) ou minha posição pré-existente na lista
  const myVote = (d) => {
    if (Object.prototype.hasOwnProperty.call(dateVotes, d.id)) return dateVotes[d.id];
    if ((d.prefer || []).includes(ME)) return "prefer";
    if (d.can.includes(ME)) return "can";
    if (d.maybe.includes(ME)) return "maybe";
    if (d.no.includes(ME)) return "no";
    return null;
  };
  const countBase = (d, key) => (d[key] || []).filter((p) => p !== ME).length;
  const tally = (d) => {
    const v = myVote(d);
    const prefer = countBase(d, "prefer") + (v === "prefer" ? 1 : 0);
    const can = countBase(d, "can") + (v === "can" ? 1 : 0);
    const maybe = countBase(d, "maybe") + (v === "maybe" ? 1 : 0);
    const no = countBase(d, "no") + (v === "no" ? 1 : 0);
    return { prefer, can, maybe, no, podem: prefer + can };
  };
  const respFor = (d) => {
    const base = [...(d.prefer || []), ...d.can, ...d.maybe, ...d.no].filter((p) => p !== ME);
    if (myVote(d)) base.push(ME);
    return base;
  };
  // melhor data: mais gente pode; empate → mais gente prefere
  const ranked = [...options].sort((a, b) => {
    const ta = tally(a), tb = tally(b);
    return (tb.podem - ta.podem) || (tb.prefer - ta.prefer);
  });
  const best = ranked[0];
  const myVoteCount = options.filter((d) => myVote(d)).length;

  const LEVELS = [
    { val: "prefer", icon: <Heart size={15} />, label: "Prefiro", col: C.terra },
    { val: "can", icon: <Check size={15} />, label: "Posso", col: C.olive },
    { val: "maybe", icon: <HelpCircle size={15} />, label: "Talvez", col: C.gold },
    { val: "no", icon: <X size={15} />, label: "Não", col: C.wineSoft },
  ];
  const opt = (d, lv) => {
    const active = myVote(d) === lv.val;
    return (
      <button type="button" key={lv.val} onClick={() => onVote(d.id, lv.val)} aria-pressed={active}
        aria-label={`${lv.label} em ${d.date}`}
        style={{
          flex: 1, minWidth: 0, border: `1.5px solid ${active ? lv.col : C.line}`,
          background: active ? lv.col : "#fff", color: active ? "#fff" : C.mute,
          borderRadius: 11, padding: "8px 2px", cursor: "pointer",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
          fontFamily: "Archivo, sans-serif", fontWeight: 600, fontSize: 11.5,
        }}>
        {lv.icon} {lv.label}
      </button>
    );
  };

  const submitDate = () => {
    if (!nd.iso) return;
    const f = fmtISODate(nd.iso);
    onAddDate({ date: f.date, weekday: f.weekday, slot: nd.slot, time: fmtTime(nd.time) });
    setNd({ iso: "", time: "", slot: "Jantar" });
    setAdding(false);
  };
  const fieldStyle = { border: `1.5px solid ${C.line}`, borderRadius: 12, padding: "11px 12px", fontSize: 15, fontFamily: "Archivo, sans-serif", background: "#fff", color: C.ink, outline: "none", width: "100%", marginTop: 4 };

  return (
    <div>
      <Header title="Quando conseguimos?" sub="Marque data e horário. Voto individual — contam os 8." />

      <div style={{ padding: "8px 20px 20px" }}>
        {/* melhor data */}
        <Card style={{ marginBottom: 14, padding: 16, background: "linear-gradient(135deg,#fff,#F7EFE6)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Sparkles size={16} color={C.terra} />
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: C.terra }}>Melhor data até agora</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: "Fraunces, serif", fontSize: 24, color: C.wine, fontWeight: 600 }}>{best.weekday}, {best.date}{best.time ? ` · ${best.time}` : ""}</div>
              <div style={{ fontSize: 13, color: C.mute }}>{best.slot} · {tally(best).podem} de 8 podem · {tally(best).prefer} preferem</div>
            </div>
            <EightMeter filled={tally(best).podem} color={C.terra} />
          </div>
        </Card>

        {/* regras da votação */}
        <div style={{ background: C.sandDeep, borderRadius: 12, padding: "10px 12px", marginBottom: 14, fontSize: 12, color: C.ink, lineHeight: 1.5 }}>
          <b style={{ color: C.wine }}>Como funciona:</b> voto individual (os 8), marque quantas datas quiser, mude quando quiser. Prazo: <b>{VOTE_DEADLINE}</b>. Empate no topo → decidem no grupo.
        </div>

        <div style={{ fontSize: 12.5, color: C.mute, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
          <Check size={14} color={C.olive} /> Você marcou {myVoteCount} de {options.length} {options.length === 1 ? "data" : "datas"}.
        </div>

        {options.map((d) => {
          const t = tally(d);
          const isBest = d.id === best.id;
          return (
            <Card key={d.id} style={{ marginBottom: 14, padding: 16, border: isBest ? `1.5px solid ${C.terra}` : `1px solid ${C.line}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "Fraunces, serif", fontSize: 20, color: C.wine, fontWeight: 600 }}>{d.date}</span>
                    <Pill>{d.weekday}</Pill>
                    {d.time && <Pill bg={C.wine} fg="#fff">{d.time}</Pill>}
                    <Pill bg={C.sandDeep}>{d.slot}</Pill>
                    {d.custom && <Pill bg={C.gold} fg="#fff">Sua sugestão</Pill>}
                  </div>
                  <div style={{ marginTop: 8 }}><AvatarStack ids={respFor(d)} size={26} /></div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, color: C.olive, fontWeight: 700 }}>{t.podem}<span style={{ fontSize: 13, color: C.mute }}>/8</span></div>
                  <div style={{ fontSize: 11, color: C.mute }}>podem</div>
                  {t.prefer > 0 && <div style={{ fontSize: 11, color: C.terra, fontWeight: 600 }}>{t.prefer} preferem</div>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {LEVELS.map((lv) => opt(d, lv))}
              </div>
            </Card>
          );
        })}

        {!adding ? (
          <Btn full variant="ghost" onClick={() => setAdding(true)}><Plus size={16} /> Sugerir outra data</Btn>
        ) : (
          <Card style={{ padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.wine, marginBottom: 10 }}>Sugerir uma data nova</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: C.mute, fontWeight: 600, flex: 1.2 }}>Data
                <input type="date" value={nd.iso} onChange={(e) => setNd((s) => ({ ...s, iso: e.target.value }))} style={fieldStyle} />
              </label>
              <label style={{ fontSize: 12, color: C.mute, fontWeight: 600, flex: 1 }}>Horário
                <input type="time" value={nd.time} onChange={(e) => setNd((s) => ({ ...s, time: e.target.value }))} style={fieldStyle} />
              </label>
            </div>
            <label style={{ fontSize: 12, color: C.mute, fontWeight: 600, display: "block", marginBottom: 12 }}>Momento
              <select value={nd.slot} onChange={(e) => setNd((s) => ({ ...s, slot: e.target.value }))} style={fieldStyle}>
                {["Manhã", "Almoço", "Tarde", "Jantar", "Noite"].map((sl) => <option key={sl}>{sl}</option>)}
              </select>
            </label>
            {nd.iso && (
              <div style={{ fontSize: 12.5, color: C.olive, marginBottom: 12 }}>
                Vai entrar como: <b>{fmtISODate(nd.iso).weekday}, {fmtISODate(nd.iso).date}{nd.time ? ` · ${fmtTime(nd.time)}` : ""}</b>
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <Btn small full disabled={!nd.iso} onClick={submitDate}><Plus size={15} /> Adicionar data</Btn>
              <Btn small variant="ghost" onClick={() => setAdding(false)}>Cancelar</Btn>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

/* EXPLORAR */
function ExploreScreen({ go, onSuggest, suggested, onAddCustom, livePlaces }) {
  const cats = ["Todos", "Restaurante", "Bar", "Rooftop", "Show", "Teatro", "Ao ar livre", "Passeio", "Exposição"];
  const [cat, setCat] = useState("Todos");
  const [region, setRegion] = useState("Todas");
  const [query, setQuery] = useState("");
  const [newRegion, setNewRegion] = useState("Zona Sul");
  const [addOpen, setAddOpen] = useState(false);
  const [sort, setSort] = useState("rel");
  const [amenities, setAmenities] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const AMENITIES = ["Área externa", "Reserva", "Música", "Vista", "Vegetariano", "Grupo"];
  const SORTS = [
    { id: "rel", label: "Relevância" }, { id: "rating", label: "Melhor nota" },
    { id: "price", label: "Mais barato" }, { id: "dist", label: "Mais perto" },
  ];
  const toggleAmenity = (a) => setAmenities((s) => (s.includes(a) ? s.filter((x) => x !== a) : [...s, a]));
  const distKm = (p) => parseFloat((p.dist || "").replace(/[^\d.]/g, "")) || 999;

  const q = norm(query.trim());
  const list = useMemo(() => {
    const filtered = livePlaces.filter((p) => {
      if (cat !== "Todos" && p.cat !== cat) return false;
      if (region !== "Todas" && zoneOf(p.hood) !== region) return false;
      if (amenities.length && !amenities.every((a) => (p.tags || []).includes(a))) return false;
      if (q) {
        const hay = norm([p.name, p.hood, zoneOf(p.hood), p.cat, p.desc, ...(p.tags || [])].join(" "));
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const sorted = [...filtered];
    if (sort === "rating") sorted.sort((a, b) => b.rating - a.rating);
    else if (sort === "price") sorted.sort((a, b) => a.price - b.price);
    else if (sort === "dist") sorted.sort((a, b) => distKm(a) - distKm(b));
    return sorted;
  }, [cat, region, q, amenities, sort, livePlaces]);

  const clearFilters = () => { setCat("Todos"); setRegion("Todas"); setQuery(""); setAmenities([]); setSort("rel"); };
  const activeFilters = (cat !== "Todos" ? 1 : 0) + (region !== "Todas" ? 1 : 0) + (q ? 1 : 0) + amenities.length + (sort !== "rel" ? 1 : 0);

  const createCustom = () => {
    const nm = query.trim();
    if (!nm) return;
    onAddCustom({ name: nm, region: newRegion });
    setAddOpen(false);
    setQuery("");
    go("placevote");
  };

  const chip = (label, active, onClick, key) => (
    <button type="button" key={key || label} onClick={onClick} aria-pressed={active} style={{
      background: active ? C.wine : "#fff", color: active ? "#fff" : C.ink,
      border: `1px solid ${active ? C.wine : C.line}`, borderRadius: 999,
      padding: "7px 15px", fontSize: 13, whiteSpace: "nowrap", cursor: "pointer", fontWeight: 500,
      fontFamily: "Archivo, sans-serif", flexShrink: 0,
    }}>{label}</button>
  );

  return (
    <div>
      <Header title="Explorar o Rio" sub="Busque por nome, bairro ou região. Sugira pro grupo." />

      <div style={{ padding: "8px 20px 20px" }}>
        {/* busca */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10, background: "#fff",
          border: `1.5px solid ${C.line}`, borderRadius: 14, padding: "12px 14px", marginBottom: 12,
        }}>
          <Search size={18} color={C.mute} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar lugar por nome, bairro ou região"
            placeholder="Restaurante, bar, bairro… ex.: Leblon, pizza, rooftop"
            style={{
              flex: 1, border: "none", outline: "none", background: "transparent",
              fontSize: 15, color: C.ink, fontFamily: "Archivo, sans-serif", minWidth: 0,
            }}
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Limpar" style={{ border: "none", background: "none", cursor: "pointer", color: C.mute, display: "grid", placeItems: "center", padding: 0 }}>
              <X size={17} />
            </button>
          )}
        </div>

        {/* região */}
        <div style={{ display: "flex", gap: 8, marginBottom: 10, overflowX: "auto", paddingBottom: 4 }}>
          {REGIONS.map((r) => chip(r, region === r, () => setRegion(r), "r-" + r))}
        </div>
        {/* categoria */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14, overflowX: "auto", paddingBottom: 4 }}>
          {cats.map((c) => chip(c, cat === c, () => setCat(c), "c-" + c))}
        </div>

        {/* contador + filtros + limpar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 12.5, color: C.mute }}>
            {list.length} {list.length === 1 ? "lugar" : "lugares"}
            {activeFilters > 0 && <span> · {activeFilters} {activeFilters === 1 ? "filtro" : "filtros"}</span>}
          </div>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <button type="button" onClick={() => setShowFilters((o) => !o)} aria-expanded={showFilters}
              style={{ border: "none", background: "none", color: showFilters ? C.wine : C.terra, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <SlidersHorizontal size={14} /> Filtros
            </button>
            {activeFilters > 0 && (
              <button type="button" onClick={clearFilters} style={{ border: "none", background: "none", color: C.mute, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Limpar</button>
            )}
          </div>
        </div>

        {showFilters && (
          <Card style={{ padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.goldDeep, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Ordenar por</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              {SORTS.map((s) => chip(s.label, sort === s.id, () => setSort(s.id), "s-" + s.id))}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.goldDeep, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Comodidades</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {AMENITIES.map((a) => chip(a, amenities.includes(a), () => toggleAmenity(a), "a-" + a))}
            </div>
          </Card>
        )}

        {/* estado vazio + criar lugar novo */}
        {list.length === 0 && (
          <Card style={{ padding: 20, marginBottom: 14, textAlign: "center" }}>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 18, color: C.wine, fontWeight: 600, marginBottom: 4 }}>Nada por aqui ainda</div>
            <p style={{ fontSize: 13.5, color: C.mute, margin: "0 0 14px", lineHeight: 1.5 }}>
              {query ? <>O Rio é grande — talvez "<b style={{ color: C.ink }}>{query}</b>" não esteja na lista. Adicione você mesmo.</> : "Nenhum lugar bate com esses filtros."}
            </p>
            {query ? (
              !addOpen ? (
                <Btn small variant="terra" onClick={() => setAddOpen(true)}><Plus size={15} /> Adicionar "{query.trim()}"</Btn>
              ) : (
                <div style={{ textAlign: "left", background: C.sand, border: `1px solid ${C.line}`, borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.mute, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Em que região fica?</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                    {REGIONS.filter((r) => r !== "Todas").map((r) => chip(r, newRegion === r, () => setNewRegion(r), "nr-" + r))}
                  </div>
                  <Btn small full variant="solid" onClick={createCustom}><Plus size={15} /> Criar e sugerir "{query.trim()}"</Btn>
                </div>
              )
            ) : (
              <Btn small variant="ghost" onClick={clearFilters}>Limpar filtros</Btn>
            )}
          </Card>
        )}

        {list.map((p) => {
          const isSug = suggested.includes(p.id);
          return (
          <Card key={p.id} style={{ marginBottom: 14 }}>
            <div style={{ height: 120, background: p.img, position: "relative" }}>
              <div style={{ position: "absolute", top: 12, left: 12 }}><Pill bg="rgba(255,255,255,.92)" fg={C.wine}>{p.cat}</Pill></div>
              <div style={{ position: "absolute", top: 12, right: 12 }}><Pill bg="rgba(42,33,30,.6)" fg="#fff">{priceLabel(p.price)}</Pill></div>
              {p.custom && <div style={{ position: "absolute", bottom: 12, left: 12 }}><Pill bg={C.gold} fg="#fff">Adicionado por você</Pill></div>}
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ fontFamily: "Fraunces, serif", fontSize: 19, color: C.wine, fontWeight: 600 }}>{p.name}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: C.ink, fontWeight: 600 }}>
                  <Star size={13} fill={C.gold} color={C.gold} /> {p.rating}
                </div>
              </div>
              <div style={{ fontSize: 13, color: C.mute, margin: "2px 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
                <MapPin size={13} /> {p.hood}{zoneOf(p.hood) !== p.hood ? ` · ${zoneOf(p.hood)}` : ""}{p.dist ? ` · ${p.dist}` : ""}
              </div>
              <p style={{ fontSize: 13.5, color: C.ink, margin: "0 0 12px", lineHeight: 1.4 }}>{p.desc}</p>
              <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
                {p.tags.map((t) => <Pill key={t}>{t}</Pill>)}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn small variant={isSug ? "olive" : "terra"} onClick={() => { if (!isSug) onSuggest(p); }} disabled={isSug}>
                  {isSug ? <><Check size={15} /> No ranking</> : <><Plus size={15} /> Sugerir pro grupo</>}
                </Btn>
                {isSug && <Btn small variant="ghost" onClick={() => go("placevote")}><Vote size={15} /> Ver votação</Btn>}
              </div>
            </div>
          </Card>
          );
        })}
      </div>
    </div>
  );
}

/* VOTAÇÃO DE LUGARES — com veto secreto e cutucada */
function PlaceVoteScreen({ suggested = [], livePlaces = ALL_PLACES, myBallot = null, onConfirmVote, onResetVote, showToast }) {
  const [myPicks, setMyPicks] = useState([]);
  const [myVeto, setMyVeto] = useState(null);
  const [nudgeOpen, setNudgeOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  /* opções = catálogo base da votação + o que o grupo sugeriu */
  const options = [...new Set([...PLACE_OPTIONS, ...suggested])];
  const scores = {};
  options.forEach((id) => (scores[id] = { pts: 0, voters: [] }));
  Object.entries(PLACE_BALLOTS).forEach(([voter, ballot]) => {
    ballot.forEach((placeId, idx) => {
      if (scores[placeId]) {
        scores[placeId].pts += 3 - idx;
        scores[placeId].voters.push(voter);
      }
    });
  });
  /* meu voto já confirmado entra na conta */
  if (myBallot) {
    myBallot.picks.forEach((placeId, idx) => {
      if (scores[placeId]) { scores[placeId].pts += 3 - idx; scores[placeId].voters.push(ME); }
    });
  }
  const ranked = options
    .map((id) => ({ place: livePlaces.find((p) => p.id === id), isNew: !PLACE_OPTIONS.includes(id), ...scores[id] }))
    .filter((r) => r.place)
    .sort((a, b) => b.pts - a.pts);

  const votedBase = Object.keys(PLACE_BALLOTS);
  const voted = myBallot && !votedBase.includes(ME) ? [...votedBase, ME] : votedBase;
  const notVoted = PEOPLE.filter((p) => !voted.includes(p.id)).map((p) => p.id);
  const meAlreadyVoted = voted.includes(ME);

  const effVeto = myBallot ? myBallot.veto : myVeto;
  const vetoedIds = effVeto ? [...VETOED_BY_OTHERS, effVeto] : VETOED_BY_OTHERS;
  const active = ranked.filter((r) => !vetoedIds.includes(r.place.id));
  const vetoedList = ranked.filter((r) => vetoedIds.includes(r.place.id));
  const leader = active[0];
  const tie = active[1] && active[0].pts === active[1].pts;

  const togglePick = (id) => {
    if (vetoedIds.includes(id)) return;
    setMyPicks((s) => {
      if (s.includes(id)) return s.filter((x) => x !== id);
      if (s.length >= 3) return s;
      return [...s, id];
    });
  };

  const toggleVeto = (id) => {
    setMyVeto((v) => (v === id ? null : id));
    setMyPicks((s) => s.filter((x) => x !== id));
  };

  const nudgeNames = notVoted.map((id) => person(id).name).join(" e ");
  const nudgeMsg = `🗳️ ${nudgeNames}, só faltam vocês no "Jantar de agosto"! Bora votar no lugar — o prazo acaba em 2 dias.`;

  return (
    <div>
      <Header title="Onde vamos?" sub="Até 3 escolhas (3, 2 e 1 ponto) e 1 veto secreto por pessoa." />

      <div style={{ padding: "8px 20px 20px" }}>
        {/* status da votação + cutucada */}
        <Card style={{ marginBottom: 18, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: C.mute }}>Votação de lugares · aberta</div>
              <div style={{ fontFamily: "Fraunces, serif", fontSize: 18, color: C.wine, fontWeight: 600 }}>{voted.length} de 8 votaram</div>
            </div>
            <EightMeter filled={voted.length} />
          </div>
          {notVoted.length > 0 && (
            <>
              <div style={{ fontSize: 13, color: C.mute, display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Clock size={14} /> Faltam: {notVoted.map((id) => person(id).name).join(", ")}
              </div>
              <Btn small variant="terra" onClick={() => { setNudgeOpen((o) => !o); setCopied(false); }}>
                <Megaphone size={15} /> Cutucar no WhatsApp
              </Btn>
              {nudgeOpen && (
                <div style={{ marginTop: 12, background: C.sand, border: `1px solid ${C.line}`, borderRadius: 12, padding: 12 }}>
                  <p style={{ fontSize: 13.5, color: C.ink, margin: "0 0 10px", lineHeight: 1.5, fontStyle: "italic" }}>{nudgeMsg}</p>
                  <Btn small variant="ghost" onClick={async () => {
                    const m = await shareOrCopy(nudgeMsg);
                    setCopied(true);
                    if (showToast) showToast(m === "share" ? "Compartilhado!" : m === "copy" ? "Mensagem copiada — cola no grupo." : "Selecione o texto acima e copie.");
                  }}>
                    {copied ? <><Check size={14} /> Copiado — cola no grupo</> : <><Share2 size={14} /> Copiar / compartilhar</>}
                  </Btn>
                </div>
              )}
            </>
          )}
          {tie && (
            <div style={{ marginTop: 12, background: "#FBF0E8", border: `1px solid ${C.terraSoft}`, borderRadius: 12, padding: "10px 12px", fontSize: 13, color: C.terra, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
              <HelpCircle size={16} /> Empate no topo — decidam juntos no grupo.
            </div>
          )}
        </Card>

        {/* resultado parcial */}
        <SectionTitle eyebrow="Resultado parcial" title="Ranking" />
        {active.map((r, i) => {
          const pct = leader.pts ? (r.pts / leader.pts) * 100 : 0;
          const mine = myPicks.indexOf(r.place.id);
          return (
            <Card key={r.place.id} style={{ marginBottom: 12, padding: 14 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: r.place.img, flexShrink: 0, position: "relative" }}>
                  {i === 0 && <div style={{ position: "absolute", top: -8, right: -8, background: C.gold, borderRadius: "50%", width: 22, height: 22, display: "grid", placeItems: "center" }}><Trophy size={12} color="#fff" /></div>}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontWeight: 700, color: C.ink, fontSize: 15 }}>{r.place.name}</span>
                    <span style={{ fontFamily: "Fraunces, serif", fontSize: 18, color: C.wine, fontWeight: 700 }}>{r.pts} <span style={{ fontSize: 11, color: C.mute }}>pts</span></span>
                  </div>
                  <div style={{ fontSize: 12, color: C.mute, marginBottom: 6, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span>{r.place.hood}{zoneOf(r.place.hood) !== r.place.hood ? ` · ${zoneOf(r.place.hood)}` : ""} · {priceLabel(r.place.price)}</span>
                    {r.isNew && <span style={{ color: C.terra, fontWeight: 700 }}>· Novo, sugerido por você</span>}
                  </div>
                  <div style={{ height: 6, background: C.sandDeep, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: i === 0 ? C.terra : C.wineSoft, borderRadius: 3, transition: "width .4s" }} />
                  </div>
                  <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <AvatarStack ids={r.voters} size={22} />
                    {!meAlreadyVoted && (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => toggleVeto(r.place.id)} title="Vetar em sigilo" aria-label={`Vetar ${r.place.name} em sigilo`} aria-pressed={r.place.id === myVeto} style={{
                          border: `1.5px solid ${C.line}`, background: "#fff", color: C.mute,
                          borderRadius: 10, padding: "5px 8px", cursor: "pointer", display: "grid", placeItems: "center",
                        }}>
                          <Ban size={14} />
                        </button>
                        <button onClick={() => togglePick(r.place.id)} style={{
                          border: `1.5px solid ${mine >= 0 ? C.wine : C.line}`, background: mine >= 0 ? C.wine : "#fff",
                          color: mine >= 0 ? "#fff" : C.mute, borderRadius: 10, padding: "5px 12px",
                          fontSize: 12, fontWeight: 700, cursor: "pointer",
                        }}>
                          {mine >= 0 ? `${mine + 1}ª escolha` : "Escolher"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}

        {/* vetados */}
        {vetoedList.length > 0 && (
          <>
            <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: C.mute, fontWeight: 700, margin: "18px 0 10px", display: "flex", alignItems: "center", gap: 6 }}>
              <Ban size={13} /> Fora da disputa
            </div>
            {vetoedList.map((r) => (
              <Card key={r.place.id} style={{ marginBottom: 12, padding: 14, opacity: .6, background: C.sandDeep }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: r.place.img, flexShrink: 0, filter: "grayscale(.6)" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: C.ink, fontSize: 14, textDecoration: "line-through" }}>{r.place.name}</div>
                    <div style={{ fontSize: 12, color: C.mute }}>Vetado em sigilo — ninguém sabe por quem.</div>
                  </div>
                  {r.place.id === myVeto && (
                    <button onClick={() => toggleVeto(r.place.id)} style={{ border: "none", background: "none", color: C.terra, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Desfazer</button>
                  )}
                </div>
              </Card>
            ))}
            <p style={{ fontSize: 12, color: C.mute, margin: "4px 0 16px" }}>Um veto de qualquer pessoa tira o lugar da disputa. Ninguém precisa se explicar.</p>
          </>
        )}

        {!meAlreadyVoted && (
          <div style={{ position: "sticky", bottom: 78, marginTop: 8 }}>
            <Btn full disabled={myPicks.length === 0} onClick={() => onConfirmVote && onConfirmVote({ picks: myPicks, veto: myVeto })}>
              <Vote size={18} /> {myPicks.length === 0 ? "Escolha ao menos 1 lugar" : `Confirmar meu voto (${myPicks.length})`}
            </Btn>
          </div>
        )}
        {myBallot && (
          <div style={{ marginTop: 8, background: "#EAF0E4", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <span style={{ fontSize: 13.5, color: C.olive, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
              <Check size={16} /> Seu voto entrou — os pontos já contam.
            </span>
            <button type="button" onClick={() => onResetVote && onResetVote()} style={{ border: "none", background: "none", color: C.terra, fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>Refazer</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ENCONTRO CONFIRMADO */
function ConfirmedScreen({ presence = null, onSetGoing, showToast }) {
  const p = CONFIRMED.place;
  const baseGoing = CONFIRMED.going;
  const going = presence === null ? baseGoing.includes(ME) : presence;
  const goingIds = presence === false ? baseGoing.filter((id) => id !== ME)
    : presence === true ? [...new Set([...baseGoing, ME])] : baseGoing;

  const waMsg = `Encontro de Casais Sucesso Absoluto CONFIRMADO! 🥂 Dia ${CONFIRMED.date}, às ${CONFIRMED.time}, no ${p.name}. Endereço: ${CONFIRMED.address}.`;

  const shareWhats = async () => {
    const m = await shareOrCopy(waMsg);
    if (showToast) showToast(m === "share" ? "Compartilhado!" : m === "copy" ? "Mensagem copiada — cola no grupo." : "Copie o texto do card abaixo.");
  };
  const openMap = async () => {
    const url = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(CONFIRMED.address);
    let w = null;
    try { w = window.open(url, "_blank", "noopener"); } catch { /* bloqueado */ }
    if (!w) { const m = await shareOrCopy(CONFIRMED.address); if (showToast) showToast(m === "copy" ? "Endereço copiado." : CONFIRMED.address); }
  };
  const lateNotice = async () => {
    const msg = `Galera, vou me atrasar uns 15 min pro ${CONFIRMED.name} no ${p.name}. Podem ir pedindo, já tô a caminho! 🙏`;
    const m = await shareOrCopy(msg);
    if (showToast) showToast(m === "share" ? "Aviso enviado!" : m === "copy" ? "Aviso de atraso copiado — cola no grupo." : "Copie o aviso e mande no grupo.");
  };
  const addToCalendar = () => {
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Sucesso Absoluto//PT-BR", "BEGIN:VEVENT",
      "UID:" + Date.now() + "@sucesso-absoluto", "DTSTART:20250808T203000", "DTEND:20250808T230000",
      "SUMMARY:" + CONFIRMED.name, "LOCATION:" + CONFIRMED.address.replace(/,/g, "\\,"),
      "DESCRIPTION:" + ("Encontro no " + p.name).replace(/,/g, "\\,"), "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    try {
      const blob = new Blob([ics], { type: "text/calendar" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "encontro.ics";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      if (showToast) showToast("Arquivo .ics gerado — abra pra adicionar ao calendário.");
    } catch {
      shareOrCopy(`${CONFIRMED.name} · ${CONFIRMED.date} ${CONFIRMED.time}`);
      if (showToast) showToast("Não deu pra baixar; detalhes copiados.");
    }
  };

  return (
    <div>
      <div style={{ padding: "22px 20px 0" }}>
        <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: C.olive, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
          <Check size={14} /> Encontro confirmado
        </div>
      </div>

      <div style={{ padding: "10px 20px 20px" }}>
        <Card style={{ marginBottom: 18 }}>
          <div style={{ height: 160, background: p.img, position: "relative", display: "flex", alignItems: "flex-end", padding: 18 }}>
            <div style={{ color: "#fff" }}>
              <div style={{ fontFamily: "Fraunces, serif", fontSize: 26, fontWeight: 600 }}>{CONFIRMED.name}</div>
              <div style={{ fontSize: 14, opacity: .9 }}>{p.name}</div>
            </div>
          </div>
          <div style={{ padding: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
              <Info icon={<CalendarDays size={16} />} label="Data" value={CONFIRMED.date} />
              <Info icon={<Clock size={16} />} label="Horário" value={CONFIRMED.time} />
              <Info icon={<MapPin size={16} />} label="Local" value={p.name} />
              <Info icon={<Utensils size={16} />} label="Média p/ pessoa" value={CONFIRMED.avg} />
            </div>
            <div style={{ background: C.sand, borderRadius: 12, padding: 12, marginBottom: 16, fontSize: 13, color: C.ink, display: "flex", gap: 8 }}>
              <MapPin size={16} color={C.terra} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{CONFIRMED.address}</span>
            </div>

            <div style={{ border: `1px solid ${C.line}`, borderRadius: 12, padding: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.olive, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Reserva confirmada</div>
              <div style={{ fontSize: 13, color: C.ink }}>Por <b>{CONFIRMED.reservedBy}</b> · {CONFIRMED.code}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: C.mute, marginBottom: 8 }}>
                {goingIds.length} de 8 confirmados
              </div>
              <AvatarStack ids={goingIds} size={30} />
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <Btn full variant={going ? "olive" : "ghost"} onClick={() => { onSetGoing(true); showToast && showToast("Presença confirmada!"); }}>
                <Check size={16} /> {going ? "Você vai!" : "Confirmar presença"}
              </Btn>
              <Btn variant="ghost" onClick={() => { onSetGoing(false); showToast && showToast("Presença cancelada."); }} aria-label="Não vou"><X size={16} /></Btn>
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <Btn small full variant="ghost" onClick={addToCalendar}><CalendarPlus size={15} /> Calendário</Btn>
              <Btn small full variant="ghost" onClick={openMap}><MapPin size={15} /> Mapa</Btn>
              <Btn small full variant="terra" onClick={shareWhats}><Share2 size={15} /> WhatsApp</Btn>
            </div>
            <Btn small full variant="ghost" onClick={lateNotice}><Clock size={15} /> Informar atraso</Btn>
          </div>
        </Card>

        <Card style={{ padding: 14, background: "#EAF0E4" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.olive, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Mensagem pronta pro WhatsApp</div>
          <p style={{ fontSize: 13.5, color: C.ink, margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>
            "Encontro de Casais Sucesso Absoluto CONFIRMADO! 🥂 Dia {CONFIRMED.date}, às {CONFIRMED.time}, no {p.name}. Endereço: {CONFIRMED.address}."
          </p>
        </Card>
      </div>
    </div>
  );
}

function Info({ icon, label, value }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: C.terra, marginBottom: 3 }}>
        {icon}<span style={{ fontSize: 12, color: C.mute, fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 15, color: C.ink, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

/* FOTO QUEIMANDO — canvas com linha de brasa orgânica e faíscas (inspirado na "Carta para queimar") */
function BurningPhoto({ src, alt }) {
  const canvasRef = React.useRef(null);
  const wrapRef = React.useRef(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.src = src;

    let raf = null, t0 = null, W = 0, H = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // jitter fixo por coluna (borda nunca é lisa)
    const jit = Array.from({ length: 128 }, () => Math.random() * 2 - 1);
    const jitAt = (x) => jit[Math.min(127, Math.max(0, Math.floor((x / Math.max(W, 1)) * 127)))];

    // linha de queima: soma de ondas de frequências diferentes + jitter → orgânica
    const noise = (x, t) =>
      Math.sin(x * 0.006 + t * 0.35) * H * 0.055 +   // meandro largo (a "diagonal" viva)
      Math.sin(x * 0.02 + t * 0.9) * 9 +
      Math.sin(x * 0.047 - t * 1.6) * 5 +
      Math.sin(x * 0.11 + t * 2.4) * 2.5 +
      jitAt(x) * 4;

    let sparks = [];
    const DUR = 9000, HOLD = 1400; // queima completa + pausa no escuro antes de recomeçar

    function size() {
      const rect = wrap.getBoundingClientRect();
      if (!rect.width || !img.width) return;
      W = rect.width;
      H = rect.width * (img.height / img.width);
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(ts) {
      if (t0 === null) t0 = ts;
      const elapsed = (ts - t0) % (DUR + HOLD);
      const prog = Math.min(elapsed / DUR, 1);
      const t = ts / 1000;
      const baseY = H * 1.12 - prog * H * 1.4; // linha começa abaixo da foto e sai por cima

      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(img, 0, 0, W, H);

      // leve tom sépia sobre a foto (clima de documento)
      ctx.fillStyle = "rgba(80,50,20,.12)";
      ctx.fillRect(0, 0, W, H);

      // ÁREA QUEIMADA: preenchimento escuro abaixo da linha
      ctx.beginPath();
      ctx.moveTo(-4, H + 4);
      ctx.lineTo(-4, baseY + noise(0, t));
      for (let x = 0; x <= W + 4; x += 4) ctx.lineTo(x, baseY + noise(x, t));
      ctx.lineTo(W + 4, H + 4);
      ctx.closePath();
      const g = ctx.createLinearGradient(0, Math.max(baseY - 30, 0), 0, H);
      g.addColorStop(0, "#3a2410");
      g.addColorStop(0.12, "#1e130a");
      g.addColorStop(1, "#0c0805");
      ctx.fillStyle = g;
      ctx.fill();

      if (prog < 1) {
        // LINHA DE BRASA: dois traços (laranja difuso + fio quente claro) com glow
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.beginPath();
        ctx.moveTo(-5, baseY + noise(-5, t));
        for (let x = 0; x <= W + 5; x += 3) ctx.lineTo(x, baseY + noise(x, t));
        ctx.strokeStyle = "rgba(255,130,25,.8)";
        ctx.lineWidth = 2.4;
        ctx.shadowColor = "rgba(255,100,10,.95)";
        ctx.shadowBlur = 16;
        ctx.stroke();
        ctx.strokeStyle = "rgba(255,235,170,.9)";
        ctx.lineWidth = 1;
        ctx.shadowBlur = 7;
        ctx.stroke();
        ctx.restore();

        // BRASAS: pontos cintilando individualmente ao longo da linha
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const n = 52;
        for (let i = 0; i < n; i++) {
          const x = (i / n) * W + Math.sin(t * 3 + i * 7.3) * 4;
          const y = baseY + noise(x, t) + Math.sin(t * 5 + i * 3.1) * 2.5;
          const fl = 0.5 + 0.5 * Math.sin(t * 8 + i * 12.7); // cintilação própria
          const r = (0.8 + 2 * Math.abs(Math.sin(i * 5.7 + t * 1.7))) * (0.6 + 0.6 * fl);
          const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
          if (fl > 0.72) grad.addColorStop(0, "rgba(255,246,205," + (0.55 + 0.45 * fl) + ")");
          else grad.addColorStop(0, "rgba(255,165,55," + (0.3 + 0.5 * fl) + ")");
          grad.addColorStop(1, "rgba(255,70,0,0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(x, y, r * 3, 0, 7);
          ctx.fill();
        }
        ctx.restore();

        // FAGULHAS voando: nascem na linha, sobem com deriva e apagam
        if (Math.random() < 0.35) {
          const x = Math.random() * W;
          sparks.push({ x, y: baseY + noise(x, t), vx: (Math.random() - 0.5) * 0.6, vy: -(0.5 + Math.random() * 1.2), life: 1 });
        }
      }

      // brasas residuais piscando na área já queimada (perto da linha)
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 10; i++) {
        const x = ((i * 97) % 100) / 100 * W;
        const y = baseY + noise(x, t) + 12 + ((i * 53) % 26);
        if (y > 0 && y < H) {
          const fl = Math.max(0, Math.sin(t * 2.2 + i * 9.4));
          if (fl > 0.5) {
            const grad = ctx.createRadialGradient(x, y, 0, x, y, 4);
            grad.addColorStop(0, "rgba(255,110,20," + 0.35 * fl + ")");
            grad.addColorStop(1, "rgba(255,60,0,0)");
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 7);
            ctx.fill();
          }
        }
      }
      // desenhar/atualizar fagulhas (atualiza ANTES de filtrar; raio nunca negativo)
      for (const s of sparks) { s.x += s.vx; s.y += s.vy; s.vy -= 0.006; s.life -= 0.013; }
      sparks = sparks.filter((s) => s.life > 0);
      for (const s of sparks) {
        const r = Math.max(0.01, 1.5 * s.life);
        const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 3);
        grad.addColorStop(0, "rgba(255,225,150," + Math.max(0, 0.85 * s.life).toFixed(3) + ")");
        grad.addColorStop(1, "rgba(255,80,0,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(s.x, s.y, r * 3, 0, 7);
        ctx.fill();
      }
      ctx.restore();

      raf = requestAnimationFrame(safeDraw);
    }

    function safeDraw(ts) {
      try { draw(ts); } catch (e) { raf = requestAnimationFrame(safeDraw); }
    }

    img.onload = () => {
      size();
      if (reduced) { ctx.drawImage(img, 0, 0, W, H); return; } // acessibilidade: estática
      raf = requestAnimationFrame(safeDraw);
    };
    const onResize = () => { if (img.complete && img.width) { size(); } };
    window.addEventListener("resize", onResize);
    return () => { if (raf) cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, [src]);

  return (
    <div ref={wrapRef} style={{ position: "relative", background: "#0c0805" }}>
      <canvas ref={canvasRef} style={{ width: "100%", display: "block" }} role="img" aria-label={alt} />
    </div>
  );
}

/* MEMÓRIAS + MURAL DA VERGONHA */
function MemoriesScreen({ infractions = [], onDenounce, onRemoveInfraction }) {
  const stats = [
    { label: "Encontros", value: "12" },
    { label: "Gasto médio", value: "R$ 121" },
    { label: "Bairro top", value: "Botafogo" },
    { label: "Nota média", value: "4.7" },
  ];
  const [reportOpen, setReportOpen] = useState(false);
  const [rep, setRep] = useState({ place: "", culprits: "", detail: "" });
  const [confirmDel, setConfirmDel] = useState(null); // id aguardando confirmação de exclusão
  const inputStyle = { width: "100%", border: `1.5px solid ${C.line}`, borderRadius: 12, padding: "11px 12px", fontSize: 14, fontFamily: "Archivo, sans-serif", background: "#fff", color: C.ink, outline: "none" };
  const submitReport = () => {
    if (!rep.place.trim()) return;
    onDenounce(rep);
    setRep({ place: "", culprits: "", detail: "" });
    setReportOpen(false);
  };

  return (
    <div>
      <Header title="Nossas memórias" sub="Mais uma memória para o grupo." />

      <div style={{ padding: "8px 20px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          {stats.map((s) => (
            <Card key={s.label} style={{ padding: 16, textAlign: "center" }}>
              <div style={{ fontFamily: "Fraunces, serif", fontSize: 26, color: C.wine, fontWeight: 700 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: C.mute }}>{s.label}</div>
            </Card>
          ))}
        </div>

        <SectionTitle eyebrow="Linha do tempo" title="Encontros realizados" />
        {MEMORIES.map((m) => (
          <Card key={m.id} style={{ marginBottom: 14 }}>
            <div style={{ height: 130, background: m.img, position: "relative", display: "flex", alignItems: "flex-end", padding: 14 }}>
              <div style={{ color: "#fff" }}>
                <div style={{ fontFamily: "Fraunces, serif", fontSize: 20, fontWeight: 600 }}>{m.name}</div>
                <div style={{ fontSize: 12, opacity: .9 }}>{m.place} · {m.hood}</div>
              </div>
              {m.again && <div style={{ position: "absolute", top: 12, right: 12 }}><Pill bg="rgba(74,90,58,.9)" fg="#fff">Voltaríamos ✓</Pill></div>}
            </div>
            <div style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <Stars n={m.rating} />
                <div style={{ fontSize: 12, color: C.mute, marginTop: 4 }}>{m.date} · {m.avg} por pessoa</div>
              </div>
              <ChevronRight size={20} color={C.mute} />
            </div>
          </Card>
        ))}

        {/* MURAL DA VERGONHA — lado B */}
        <div style={{ marginTop: 28 }}>
          <SectionTitle
            eyebrow="Lado B do histórico"
            title="Mural da Vergonha"
            action={<Btn small variant="ghost" onClick={() => setReportOpen((o) => !o)}><Camera size={14} /> Denunciar</Btn>}
          />
          <p style={{ fontSize: 13, color: C.mute, margin: "-6px 0 14px", lineHeight: 1.4 }}>
            Tudo que aconteceu com menos de oito é, por definição, uma infração. Os traídos julgam.
          </p>

          {reportOpen && (
            <Card style={{ padding: 16, marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.wine, marginBottom: 10 }}>Registrar uma infração</div>
              <label style={{ fontSize: 12, color: C.mute, fontWeight: 600 }}>Onde rolou? *
                <input value={rep.place} onChange={(e) => setRep((s) => ({ ...s, place: e.target.value }))} placeholder="Ex.: Pizzaria da esquina" style={{ ...inputStyle, marginTop: 4, marginBottom: 10 }} />
              </label>
              <label style={{ fontSize: 12, color: C.mute, fontWeight: 600 }}>Quem estava?
                <input value={rep.culprits} onChange={(e) => setRep((s) => ({ ...s, culprits: e.target.value }))} placeholder="Ex.: Luca e Mayara" style={{ ...inputStyle, marginTop: 4, marginBottom: 10 }} />
              </label>
              <label style={{ fontSize: 12, color: C.mute, fontWeight: 600 }}>O que aconteceu?
                <input value={rep.detail} onChange={(e) => setRep((s) => ({ ...s, detail: e.target.value }))} placeholder="Conte a cena do crime" style={{ ...inputStyle, marginTop: 4, marginBottom: 12 }} />
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn small full disabled={!rep.place.trim()} onClick={submitReport}><Megaphone size={15} /> Publicar no Mural</Btn>
                <Btn small variant="ghost" onClick={() => setReportOpen(false)}>Cancelar</Btn>
              </div>
            </Card>
          )}

          {infractions.map((inf) => (
            <Card key={inf.id} style={{ marginBottom: 14, padding: 16, border: `1px solid ${C.scandalDeep}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <span style={{ display: "inline-block", background: C.scandal, color: "#fff", fontSize: 10.5, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", padding: "3px 9px", borderRadius: 4 }}>Denúncia nova</span>
                {confirmDel === inf.id ? (
                  <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: C.mute }}>Excluir?</span>
                    <button type="button" onClick={() => { onRemoveInfraction(inf.id); setConfirmDel(null); }} style={{ border: "none", background: "none", color: C.scandal, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Sim</button>
                    <button type="button" onClick={() => setConfirmDel(null)} style={{ border: "none", background: "none", color: C.mute, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Não</button>
                  </span>
                ) : (
                  <button type="button" onClick={() => setConfirmDel(inf.id)} aria-label="Remover denúncia" style={{ border: "none", background: "none", color: C.mute, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Remover</button>
                )}
              </div>
              <div style={{ fontFamily: "Fraunces, serif", fontSize: 20, color: C.wine, fontWeight: 600, margin: "8px 0 2px" }}>Flagra no {inf.place}</div>
              {inf.culprits && <div style={{ fontSize: 13, color: C.ink, marginBottom: 6 }}>Suspeitos: <b>{inf.culprits}</b></div>}
              {inf.detail && <p style={{ fontSize: 13.5, color: C.mute, margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>"{inf.detail}"</p>}
              <div style={{ fontSize: 11, color: C.mute, marginTop: 8 }}>Denunciado por {person(inf.by)?.name || "alguém"} · aguardando julgamento dos traídos.</div>
            </Card>
          ))}

          {INFRACTIONS.map((inf) => {
            const condemned = inf.verdict === "condenados";
            /* o Mural vira um spread de escândalo tabloide: tinta-preta + vermelho */
            const acc = condemned ? C.scandal : C.terraSoft;
            const darkInk = "#17120C";
            const lightInk = "#EFE7D6";
            const lightMute = "#A79D89";
            const panel = "rgba(239,231,214,.06)";
            const excluded = PEOPLE.filter((p) => !inf.caught.includes(p.id));
            return (
              <Card key={inf.id} style={{ marginBottom: 16, border: `1px solid ${condemned ? C.scandalDeep : C.line}`, position: "relative", background: darkInk, color: lightInk }}>
                {/* carimbo teatral */}
                <div style={{
                  position: "absolute", top: 14, right: 12, transform: "rotate(-8deg)",
                  border: `2.5px solid ${acc}`, color: acc, borderRadius: 8,
                  padding: "3px 10px", fontWeight: 800, fontSize: 13, letterSpacing: 2,
                  textTransform: "uppercase", background: "rgba(23,18,12,.6)", zIndex: 2,
                }}>
                  {condemned ? "Condenados" : "Absolvidos"}
                </div>

                {inf.photo && (
                  <div style={{ position: "relative" }}>
                    <BurningPhoto src={inf.photo} alt={"Prova: " + inf.place} />
                    <div style={{
                      position: "absolute", bottom: 12, left: 12, zIndex: 6,
                      background: "rgba(23,18,12,.82)", color: lightInk, borderRadius: 8,
                      padding: "4px 10px", fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
                      display: "flex", alignItems: "center", gap: 6,
                    }}>
                      <Camera size={12} /> Prova nº 1 — sendo destruída
                    </div>
                  </div>
                )}
                <div style={{ padding: 16 }}>
                  <span style={{
                    display: "inline-block", background: condemned ? C.scandal : C.terraSoft, color: condemned ? "#fff" : darkInk,
                    fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase",
                    padding: "3px 10px", borderRadius: 4,
                  }}>{inf.severity}</span>
                  <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, color: lightInk, fontWeight: 560, margin: "12px 0 2px", letterSpacing: -0.3 }}>
                    Pegos no <em style={{ fontStyle: "italic", color: acc }}>{inf.place}</em>
                  </div>
                  <div style={{ fontSize: 12, color: lightMute, marginBottom: 12 }}>{inf.date} · Prova: {inf.proof}</div>

                  {/* medidor: quem saiu vs quem foi traído */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, background: panel, borderRadius: 12, padding: 12 }}>
                    <AvatarStack ids={inf.caught} size={26} />
                    <EightMeter filled={inf.caught.length} color={acc}
                      label={`${inf.caught.length} saíram · ${8 - inf.caught.length} traídos`} />
                  </div>

                  <div style={{ borderLeft: `3px solid ${acc}`, paddingLeft: 12, marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: lightMute, textTransform: "uppercase", letterSpacing: 1 }}>Alegação da defesa</div>
                    <p style={{ fontSize: 15, color: lightInk, margin: "3px 0 0", fontStyle: "italic", fontFamily: "Fraunces, serif" }}>"{inf.excuse}"</p>
                  </div>

                  <p style={{ fontSize: 13, color: lightMute, margin: "0 0 14px", lineHeight: 1.5 }}>{inf.detail}</p>

                  {/* veredito editorial */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderTop: `1px solid rgba(239,231,214,.14)`, borderBottom: `1px solid rgba(239,231,214,.14)`, marginBottom: inf.pena ? 12 : 0 }}>
                    <Scale size={16} color={acc} />
                    <span style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: lightMute, fontWeight: 700 }}>Veredito dos traídos</span>
                    <span style={{ marginLeft: "auto", fontFamily: "Fraunces, serif", fontSize: 22, color: acc, fontWeight: 600 }}>{inf.votes.rejeita} × {inf.votes.aceita}</span>
                  </div>
                  <div style={{ fontSize: 11, color: lightMute, marginBottom: inf.pena ? 12 : 0 }}>Quem estava na foto não vota.</div>

                  {inf.pena && (
                    <div style={{ background: "rgba(192,48,28,.14)", border: `1px solid ${C.scandalDeep}`, borderRadius: 10, padding: "10px 12px", fontSize: 13, color: lightInk }}>
                      <span style={{ color: acc, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, fontSize: 11 }}>Pena imposta</span>
                      <div style={{ marginTop: 3 }}>{inf.pena}</div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}

          {/* placar de panelinha */}
          <Card style={{ padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.terra, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>Placar da panelinha</div>
            {[
              { pair: "Luca & Mayara + Vitor & Gabrielle", n: 1 },
              { pair: "Davi & Isabel", n: 0 },
              { pair: "Maria Gabriela & Vinicius", n: 0 },
            ].map((row, i) => (
              <div key={row.pair} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 2 ? `1px solid ${C.line}` : "none", fontSize: 13.5 }}>
                <span style={{ color: C.ink, fontWeight: i === 0 ? 700 : 500 }}>{row.pair}</span>
                <span style={{ color: i === 0 ? C.wine : C.mute, fontWeight: 700 }}>{row.n} {row.n === 1 ? "infração" : "infrações"}</span>
              </div>
            ))}
            <div style={{ fontSize: 12, color: C.mute, marginTop: 10 }}>Os outros seis seguem com ficha limpa. Por enquanto.</div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* PERFIS */
function ProfilesScreen() {
  const foods = {
    davi: "Feijoada, japonês", isabel: "Italiano, vinho", luca: "Churrasco, cerveja",
    mayara: "Vegetariano, café", gabi: "Frutos do mar", vini: "Hambúrguer, IPA",
    vitor: "Pizza, drinks", gab: "Doces, brunch",
  };
  return (
    <div>
      <Header title="O grupo" sub="Quatro casais, oito histórias." />
      <div style={{ padding: "8px 20px 20px" }}>
        {COUPLES.map((c) => (
          <div key={c.id} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Heart size={15} color={C.terra} fill={C.terra} />
              <span style={{ fontFamily: "Fraunces, serif", fontSize: 17, color: C.wine, fontWeight: 600 }}>{c.label}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {c.members.map((id) => (
                <Card key={id} style={{ padding: 14, textAlign: "center" }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}><Avatar id={id} size={52} /></div>
                  <div style={{ fontWeight: 700, color: C.ink, fontSize: 14 }}>{person(id).name}</div>
                  <div style={{ fontSize: 11.5, color: C.mute, marginTop: 4, lineHeight: 1.3 }}>{foods[id]}</div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* CRIAR ENCONTRO */
function CreateScreen({ go, onCreate }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [period, setPeriod] = useState("Agosto");
  const [type, setType] = useState(null);
  const [price, setPrice] = useState(null);
  const [regions, setRegions] = useState([]);
  const [deadline, setDeadline] = useState("3 dias");
  const [done, setDone] = useState(false);

  const TYPES = ["Jantar", "Almoço", "Bar", "Passeio", "Show / teatro", "Surpresa"];
  const PRICES = ["Até R$ 60", "R$ 60–120", "R$ 120–200", "Tanto faz"];
  const REGIONS = ["Barra", "Recreio", "Zona Sul", "Centro", "Niterói", "Baixada", "Serra", "Região dos Lagos"];
  const DEADLINES = ["2 dias", "3 dias", "5 dias", "1 semana"];

  const toggleRegion = (r) =>
    setRegions((s) => (s.includes(r) ? s.filter((x) => x !== r) : [...s, r]));

  const ready = name.trim().length > 0 && type && price;

  const Chip = ({ label, active, onClick }) => (
    <button type="button" onClick={onClick} aria-pressed={active} style={{
      background: active ? C.wine : "#fff", color: active ? "#fff" : C.ink,
      border: `1.5px solid ${active ? C.wine : C.line}`, borderRadius: 999,
      padding: "8px 15px", fontSize: 13, cursor: "pointer", fontWeight: 600,
      whiteSpace: "nowrap", transition: "all .15s", userSelect: "none",
      fontFamily: "Archivo, sans-serif",
    }}>{label}</button>
  );

  const Field = ({ label, children, hint }) => (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.wine, marginBottom: 8 }}>
        {label} {hint && <span style={{ fontWeight: 400, color: C.mute }}>· {hint}</span>}
      </div>
      {children}
    </div>
  );

  const inputStyle = {
    width: "100%", border: `1.5px solid ${C.line}`, borderRadius: 14,
    padding: "13px 14px", fontSize: 15, fontFamily: "Archivo, sans-serif",
    background: "#fff", color: C.ink, outline: "none",
  };

  if (done) {
    return (
      <div>
        <Header title="Temos um encontro nascendo!" sub="A votação de datas já está aberta pros oito." />
        <div style={{ padding: "8px 20px 20px" }}>
          <Card style={{ padding: 24, textAlign: "center", marginBottom: 18 }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#EAF0E4", display: "grid", placeItems: "center", margin: "0 auto 14px" }}>
              <Check size={32} color={C.olive} />
            </div>
            <div style={{ fontFamily: "Fraunces, serif", fontSize: 22, color: C.wine, fontWeight: 600, marginBottom: 6 }}>{name}</div>
            <div style={{ fontSize: 14, color: C.mute, marginBottom: 4 }}>{type} · {price} · prazo de {deadline}</div>
            {regions.length > 0 && <div style={{ fontSize: 13, color: C.mute }}>{regions.join(" · ")}</div>}
            <div style={{ margin: "18px 0 4px", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <EightMeter filled={1} label="1 de 8 votaram — você conta como o primeiro" />
            </div>
          </Card>
          <Btn full onClick={() => go("calendar")}><Vote size={18} /> Ir para a votação de datas</Btn>
          <div style={{ height: 10 }} />
          <Btn full variant="ghost" onClick={() => go("home")}>Voltar ao início</Btn>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Criar encontro" sub="Três respostas e o resto o grupo decide votando." />
      <div style={{ padding: "8px 20px 20px" }}>
        <Field label="Nome do encontro">
          <input style={inputStyle} placeholder="Ex.: Jantar de agosto" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>

        <Field label="Descrição" hint="opcional">
          <input style={inputStyle} placeholder="Alguma ideia ou ocasião especial?" value={desc} onChange={(e) => setDesc(e.target.value)} />
        </Field>

        <Field label="Que tipo de programa?">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {TYPES.map((t) => <Chip key={t} label={t} active={type === t} onClick={() => setType(t)} />)}
          </div>
        </Field>

        <Field label="Faixa de preço por pessoa">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {PRICES.map((p) => <Chip key={p} label={p} active={price === p} onClick={() => setPrice(p)} />)}
          </div>
        </Field>

        <Field label="Regiões" hint="pode marcar várias">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {REGIONS.map((r) => <Chip key={r} label={r} active={regions.includes(r)} onClick={() => toggleRegion(r)} />)}
          </div>
        </Field>

        <Field label="Período desejado">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["Agosto", "Setembro", "Próximo feriado"].map((p) => <Chip key={p} label={p} active={period === p} onClick={() => setPeriod(p)} />)}
          </div>
        </Field>

        <Field label="Prazo para votar">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {DEADLINES.map((d) => <Chip key={d} label={d} active={deadline === d} onClick={() => setDeadline(d)} />)}
          </div>
        </Field>

        <Btn full disabled={!ready} onClick={() => { onCreate && onCreate({ name: name.trim(), desc: desc.trim(), type, price, regions, period, deadline }); setDone(true); }}>
          <Sparkles size={18} /> {ready ? "Abrir votação de datas" : "Preencha nome, tipo e preço"}
        </Btn>
      </div>
    </div>
  );
}

/* LOGIN — só os oito entram, cada um com seu código */
const ACCESS_CODES = { // demo: no app real a autenticação é via Supabase (magic link)
  davi: "1101", isabel: "1102", luca: "2201", mayara: "2202",
  gabi: "3301", vini: "3302", vitor: "4401", gab: "4402",
};

function LoginScreen({ onLogin }) {
  const [sel, setSel] = useState(null);
  const [pin, setPin] = useState("");
  const [err, setErr] = useState(false);

  const tryEnter = () => {
    if (pin === ACCESS_CODES[sel]) onLogin(sel);
    else { setErr(true); setPin(""); }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "40px 24px 60px" }}>
      <div style={{ textAlign: "center", marginBottom: 30 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: C.wine, display: "grid", placeItems: "center" }}>
            <Lock size={24} color="#fff" />
          </div>
        </div>
        <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: C.terra, fontWeight: 700, marginBottom: 8 }}>Encontro de Casais</div>
        <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 34, color: C.wine, margin: 0, fontWeight: 700, letterSpacing: -0.5 }}>Sucesso Absoluto</h1>
        <p style={{ color: C.mute, fontSize: 14, margin: "10px 0 0" }}>Só os oito entram. Quem é você?</p>
      </div>

      {!sel ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {PEOPLE.map((p) => (
            <button type="button" key={p.id} onClick={() => { setSel(p.id); setErr(false); }}
              aria-label={`Entrar como ${p.name}`}
              style={{
                background: C.cream, borderRadius: 20, border: `1px solid ${C.line}`, boxShadow: SH.card,
                padding: 14, textAlign: "center", cursor: "pointer", fontFamily: "Archivo, sans-serif",
              }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}><Avatar id={p.id} size={48} /></div>
              <div style={{ fontWeight: 700, color: C.ink, fontSize: 13.5 }}>{p.name}</div>
            </button>
          ))}
        </div>
      ) : (
        <Card style={{ padding: 22, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}><Avatar id={sel} size={56} /></div>
          <label htmlFor="pin-input" style={{ fontFamily: "Fraunces, serif", fontSize: 20, color: C.wine, fontWeight: 600, marginBottom: 14, display: "block" }}>Oi, {person(sel).name}!</label>
          <input
            id="pin-input" type="password" inputMode="numeric" maxLength={4} placeholder="••••"
            aria-label={`Código de 4 dígitos de ${person(sel).name}`} aria-invalid={err}
            value={pin} autoFocus
            onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setErr(false); }}
            onKeyDown={(e) => e.key === "Enter" && pin.length === 4 && tryEnter()}
            style={{
              width: "100%", border: `1.5px solid ${err ? C.wineSoft : C.line}`, borderRadius: 14,
              padding: "14px", fontSize: 22, textAlign: "center", letterSpacing: 12,
              fontFamily: "Archivo, sans-serif", outline: "none", marginBottom: 10, background: "#fff", color: C.ink,
            }}
          />
          {err && <div style={{ fontSize: 13, color: C.wineSoft, fontWeight: 600, marginBottom: 10 }}>Esse não é o código de {person(sel).name}. Tenta de novo.</div>}
          <Btn full disabled={pin.length !== 4} onClick={tryEnter}>Entrar</Btn>
          <div style={{ marginTop: 12 }}>
            <button onClick={() => { setSel(null); setPin(""); setErr(false); }} style={{ background: "none", border: "none", color: C.mute, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>Não sou eu — voltar</button>
          </div>
        </Card>
      )}

      <p style={{ textAlign: "center", fontSize: 12, color: C.mute, marginTop: 24 }}>
        Acesso restrito ao grupo — cada pessoa tem seu próprio código.
        {sel && <> Demo: o código de {person(sel).name} é <b>{ACCESS_CODES[sel]}</b>.</>}
      </p>
    </div>
  );
}

/* ---------- NAV + SHELL ---------- */

const TABS = [
  { id: "home", label: "Início", icon: Home },
  { id: "calendar", label: "Calendário", icon: CalendarDays },
  { id: "explore", label: "Explorar", icon: Compass },
  { id: "placevote", label: "Votação", icon: Vote },
  { id: "memories", label: "Memórias", icon: Sparkles },
];

export default function App() {
  const saved = React.useMemo(() => store.read(), []);
  const [tab, setTab] = useState("home");
  const [user, setUser] = useState(saved.me || null); // id da pessoa logada (persistido)

  /* estado compartilhado e PERSISTIDO — sobrevive ao refresh */
  const [suggested, setSuggested] = useState(saved.suggested || []);       // ids sugeridos ao grupo
  const [customPlaces, setCustomPlaces] = useState(saved.customPlaces || []); // lugares criados por você
  const [myBallot, setMyBallot] = useState(saved.myBallot || null);        // { picks:[ids], veto }
  const [dateVotes, setDateVotes] = useState(saved.dateVotes || {});       // { [dateId]: "can"|"maybe"|"no" }
  const [customDates, setCustomDates] = useState(saved.customDates || []); // datas sugeridas por você
  const [presence, setPresence] = useState(saved.presence ?? null);        // true/false/null p/ encontro confirmado
  const [encontros, setEncontros] = useState(saved.encontros || []);       // encontros criados
  const [infractions, setInfractions] = useState(saved.infractions || []); // denúncias no Mural
  const [toast, setToast] = useState(null);
  const nextId = React.useRef(saved.nextId || 1000);

  // mantém o "ME" (usado pelas telas) em sincronia com a sessão persistida
  if (user) ME = user;

  const livePlaces = useMemo(() => [...ALL_PLACES, ...customPlaces], [customPlaces]);

  // grava tudo que muda (best-effort; ignora se o storage estiver bloqueado)
  React.useEffect(() => {
    store.write({ me: user, suggested, customPlaces, myBallot, dateVotes, customDates, presence, encontros, infractions, nextId: nextId.current });
  }, [user, suggested, customPlaces, myBallot, dateVotes, customDates, presence, encontros, infractions]);

  const showToast = (msg) => { setToast(msg); };
  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  const go = (t) => { setTab(t); window.scrollTo(0, 0); };
  // sair encerra a sessão mas PRESERVA os dados do grupo (nada é perdido)
  const logout = () => { setUser(null); setTab("home"); };

  const suggestPlace = (p) => {
    if (suggested.includes(p.id)) { showToast(`"${p.name}" já está no ranking.`); return; }
    setSuggested((s) => [...s, p.id]);
    showToast(`"${p.name}" entrou no ranking da votação.`);
  };
  const addCustom = ({ name, region }) => {
    const clean = name.trim();
    // evita duplicidade: se já existe um lugar com o mesmo nome, apenas sugere o existente
    const existing = livePlaces.find((p) => norm(p.name) === norm(clean));
    if (existing) { suggestPlace(existing); go("placevote"); return; }
    const id = ++nextId.current;
    const place = {
      id, name: clean, cat: "Sugestão", hood: region, price: 2, rating: 4.5,
      img: "linear-gradient(140deg,#123B3A,#A9834A)", desc: "Adicionado por você para o grupo votar.",
      tags: ["Novo", region], dist: "", custom: true,
    };
    setCustomPlaces((s) => [...s, place]);
    setSuggested((s) => [...s, id]);
    showToast(`"${clean}" criado e sugerido ao grupo.`);
  };
  const confirmVote = ({ picks, veto }) => {
    setMyBallot({ picks, veto });
    showToast("Voto registrado — os pontos já contam.");
  };
  const resetVote = () => { setMyBallot(null); showToast("Voto desfeito — pode escolher de novo."); };
  const voteDate = (dateId, val) => setDateVotes((s) => ({ ...s, [dateId]: s[dateId] === val ? null : val }));
  const addDate = (d) => {
    const id = "cd" + (++nextId.current);
    setCustomDates((s) => [...s, { id, date: d.date, weekday: d.weekday, slot: d.slot, time: d.time || "", prefer: [], can: [], maybe: [], no: [], custom: true }]);
    setDateVotes((s) => ({ ...s, [id]: "prefer" }));
    showToast(`Data "${d.date}" sugerida ao grupo.`);
  };
  const createEncontro = (data) => {
    const id = "e" + (++nextId.current);
    setEncontros((s) => [{ id, ...data, createdBy: user, votes: 1 }, ...s]);
    showToast("Encontro criado — votação de datas aberta.");
  };
  const setGoing = (v) => setPresence(v);
  const addInfraction = ({ place, culprits, detail }) => {
    const id = "inf" + (++nextId.current);
    setInfractions((s) => [{ id, place: place.trim(), culprits: culprits.trim(), detail: detail.trim(), by: user }, ...s]);
    showToast("Denúncia registrada no Mural.");
  };
  const removeInfraction = (id) => { setInfractions((s) => s.filter((x) => x.id !== id)); showToast("Denúncia removida."); };

  const screens = {
    home: <HomeScreen go={go} encontros={encontros} dateVotes={dateVotes} customDates={customDates} />,
    calendar: <CalendarScreen dateVotes={dateVotes} onVote={voteDate} customDates={customDates} onAddDate={addDate} />,
    explore: <ExploreScreen go={go} onSuggest={suggestPlace} suggested={suggested} onAddCustom={addCustom} livePlaces={livePlaces} />,
    placevote: <PlaceVoteScreen suggested={suggested} livePlaces={livePlaces} myBallot={myBallot} onConfirmVote={confirmVote} onResetVote={resetVote} showToast={showToast} />,
    confirmed: <ConfirmedScreen presence={presence} onSetGoing={setGoing} showToast={showToast} />,
    memories: <MemoriesScreen infractions={infractions} onDenounce={addInfraction} onRemoveInfraction={removeInfraction} />,
    profiles: <ProfilesScreen />,
    create: <CreateScreen go={go} onCreate={createEncontro} />,
  };

  const showBack = tab === "confirmed" || tab === "profiles" || tab === "create";

  return (
    <div className="sa-page" style={{ minHeight: "100vh", fontFamily: "Archivo, system-ui, sans-serif", color: C.ink }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..900;1,9..144,300..900&family=Archivo:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { margin: 0; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
        ::-webkit-scrollbar { display: none; }
        h1, h2 { font-optical-sizing: auto; }
        button:focus-visible, a:focus-visible, input:focus-visible { outline: 2px solid ${C.terra}; outline-offset: 2px; }

        /* fundo quente atrás da "tela" do app */
        .sa-page {
          background:
            radial-gradient(120% 70% at 50% -8%, #F1E6D4, transparent 62%),
            linear-gradient(180deg, #EADDCB 0%, #E4D4BF 55%, #DFCDB6 100%);
        }
        /* a coluna do app vira uma tela elevada (só aparece elevada no desktop) */
        .sa-screen { background: ${C.sand}; box-shadow: ${SH.screen}; }

        /* cards: transição suave + leve elevação no hover */
        .sa-card { transition: transform .28s cubic-bezier(.22,.61,.36,1), box-shadow .28s cubic-bezier(.22,.61,.36,1); }
        @media (hover: hover) {
          .sa-card:hover { transform: translateY(-2px); box-shadow: ${SH.cardHover}; }
        }

        /* botões: interação consistente */
        .sa-btn { transition: transform .12s ease, filter .18s ease, box-shadow .18s ease; }
        .sa-btn:not(.is-disabled):active { transform: translateY(1px) scale(.985); }
        @media (hover: hover) {
          .sa-btn:not(.is-disabled):hover { transform: translateY(-1px); filter: brightness(1.04); }
        }

        @media (prefers-reduced-motion: reduce) {
          * { transition: none !important; animation: none !important; }
        }
        /* efeito de queima agora é canvas (componente BurningPhoto) */
      `}</style>

      {!user ? (
        <div className="sa-screen" style={{ maxWidth: 440, margin: "0 auto", minHeight: "100vh" }}>
          <LoginScreen onLogin={(id) => { ME = id; setUser(id); }} />
        </div>
      ) : (
      <div className="sa-screen" style={{ maxWidth: 440, margin: "0 auto", minHeight: "100vh", position: "relative", paddingBottom: 90 }}>
        {showBack && (
          <div style={{ padding: "16px 20px 0" }}>
            <button onClick={() => go("home")} style={{ background: "none", border: "none", color: C.wine, display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, cursor: "pointer", padding: 0 }}>
              <ArrowLeft size={18} /> Início
            </button>
          </div>
        )}

        {screens[tab]}

        {tab === "home" && (
          <div style={{ padding: "0 20px 20px", display: "flex", gap: 10 }}>
            <Btn full variant="ghost" onClick={() => go("confirmed")}><Check size={16} /> Ver exemplo confirmado</Btn>
            <Btn full variant="ghost" onClick={() => go("profiles")}><Users size={16} /> O grupo</Btn>
            <Btn variant="ghost" onClick={logout} aria-label="Sair"><LogOut size={16} /></Btn>
          </div>
        )}

        {toast && (
          <div role="status" style={{
            position: "fixed", bottom: 92, left: "50%", transform: "translateX(-50%)",
            zIndex: 40, maxWidth: 400, width: "calc(100% - 40px)",
            background: C.wineDeep, color: "#F6F2E9", borderRadius: 12,
            padding: "12px 16px", fontSize: 13.5, fontWeight: 500,
            boxShadow: "0 18px 40px -18px rgba(12,37,35,.7)",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <Check size={16} color={C.terraSoft} /> <span>{toast}</span>
          </div>
        )}

        <nav style={{
          position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
          width: "100%", maxWidth: 440, background: "rgba(251,247,240,.9)",
          backdropFilter: "blur(14px)", borderTop: `1px solid ${C.line}`,
          boxShadow: "0 -8px 24px -18px rgba(62,16,25,.4)",
          display: "flex", justifyContent: "space-around", padding: "10px 8px 14px",
        }}>
          {TABS.map((t) => {
            const active = tab === t.id;
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => go(t.id)}
                aria-current={active ? "page" : undefined} aria-label={t.label} style={{
                background: "none", border: "none", cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                color: active ? C.wine : C.mute, flex: 1, padding: "4px 0", minHeight: 44,
              }}>
                <div style={{ background: active ? "rgba(92,26,43,.10)" : "transparent", borderRadius: 12, padding: "5px 14px", transition: "background .2s ease" }}>
                  <Icon size={21} strokeWidth={active ? 2.4 : 2} />
                </div>
                <span style={{ fontSize: 10.5, fontWeight: active ? 700 : 500 }}>{t.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
      )}
    </div>
  );
}
