import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const TAGS = ["GENTILE", "VELOCE", "CORTESE", "VINO", "MULTILINGUE", "ATTENZIONE"];
const STAR_PATH =
  "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z";

const $ = (id) => document.getElementById(id);
const show = (id) => $(id).classList.remove("hidden");
const hide = (id) => $(id).classList.add("hidden");

const waiterId = new URLSearchParams(location.search).get("w");

let rating = 0;
const selectedTags = new Set();
let submitting = false;

function initials(name) {
  if (!name) return "··";
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.[0] ?? "";
  const b = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (a + b).toUpperCase() || "··";
}

function starSvg(on) {
  return `<svg viewBox="0 0 24 24" fill="${on ? "currentColor" : "none"}" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"><path d="${STAR_PATH}"/></svg>`;
}

function renderStars() {
  const el = $("stars");
  el.innerHTML = "";
  for (let i = 1; i <= 5; i++) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "star" + (i <= rating ? " on" : "");
    b.setAttribute("aria-label", `${i} su 5`);
    b.innerHTML = starSvg(i <= rating);
    b.addEventListener("click", () => setRating(i));
    el.appendChild(b);
  }
}

function setRating(n) {
  rating = n;
  renderStars();
  show("after-rating");
  const submit = $("submit");
  submit.disabled = false;
  submit.textContent = "Invia recensione";
}

function renderChips() {
  const el = $("chips");
  el.innerHTML = "";
  for (const t of TAGS) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip" + (selectedTags.has(t) ? " on" : "");
    b.textContent = t;
    b.addEventListener("click", () => {
      if (selectedTags.has(t)) selectedTags.delete(t);
      else selectedTags.add(t);
      b.classList.toggle("on");
    });
    el.appendChild(b);
  }
}

async function loadWaiter() {
  if (!waiterId) {
    hide("state-loading");
    show("state-error");
    return;
  }
  const { data, error } = await sb
    .from("waiter_public_cards")
    .select("*")
    .eq("id", waiterId)
    .maybeSingle();

  if (error || !data) {
    hide("state-loading");
    show("state-error");
    return;
  }

  $("w-avatar").textContent = initials(data.full_name);
  $("w-name").textContent = data.full_name || "Professionista";
  $("w-role").textContent = data.primary_role || "";
  renderStars();
  renderChips();
  hide("state-loading");
  show("review-form");
}

$("comment").addEventListener("input", (e) => {
  $("counter").textContent = String(e.target.value.length);
});

$("review-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (rating < 1 || submitting) return;

  submitting = true;
  const submit = $("submit");
  submit.disabled = true;
  submit.textContent = "Invio…";
  $("error").textContent = "";

  const comment = $("comment").value.trim();
  const reviewer = $("reviewer").value.trim();

  const { error } = await sb.from("reviews").insert({
    waiter_id: waiterId,
    rating,
    comment: comment || null,
    reviewer_name: reviewer || null,
    tags: [...selectedTags],
  });

  if (error) {
    submitting = false;
    submit.disabled = false;
    submit.textContent = "Invia recensione";
    $("error").textContent = "Invio non riuscito. Riprova.";
    return;
  }

  const firstName = ($("w-name").textContent || "").trim().split(/\s+/)[0];
  $("thanks-sub").textContent = firstName
    ? `${firstName} riceverà il tuo feedback e la tua recensione entra a far parte della sua reputazione.`
    : "Il tuo feedback contribuisce alla reputazione del professionista.";
  hide("review-form");
  show("state-success");
});

loadWaiter();
