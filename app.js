"use strict";

var TAGE = 16 * 7;

var langFormat = new Intl.DateTimeFormat("de-DE", {
  weekday: "long", day: "numeric", month: "long", year: "numeric"
});

// Kalendertage addieren (nicht Millisekunden), damit die Zeitumstellung egal ist.
function plus16Wochen(datum) {
  return new Date(datum.getFullYear(), datum.getMonth(), datum.getDate() + TAGE, 12);
}

// TT.MM.JJJJ: das landet in der Zwischenablage.
function kurz(datum) {
  return ("0" + datum.getDate()).slice(-2) + "." +
    ("0" + (datum.getMonth() + 1)).slice(-2) + "." +
    datum.getFullYear();
}

function kopieren(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).catch(function () { return altKopieren(text); });
  }
  return altKopieren(text);
}

// Der Weg wie 2012, falls die moderne Zwischenablage nicht darf.
function altKopieren(text) {
  var feld = document.createElement("textarea");
  feld.value = text;
  feld.setAttribute("readonly", "");
  feld.style.position = "fixed";
  feld.style.opacity = "0";
  document.body.appendChild(feld);
  feld.select();
  var ok = false;
  try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
  document.body.removeChild(feld);
  return ok ? Promise.resolve() : Promise.reject(new Error("Kopieren nicht möglich"));
}

var monatFormat = new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" });
var wochentagFormat = new Intl.DateTimeFormat("de-DE", { weekday: "long" });

var LADESPRUECHE = [
  "Befrage den Maya-Kalender …",
  "Zähle 112 Tage an den Fingern ab …",
  "Lade Zukunft herunter (3G) …"
];

var GROWLS = [
  ["Läuft bei dir.", "Das Datum liegt in der Zwischenablage."],
  ["Neuer Gruschler!", "Die Zukunft hat dich gegruschelt."],
  ["Erfolg freigeschaltet", "Zeitreisende Person (10 Punkte)"],
  ["Like a Boss", "Du kannst jetzt mit Strg+V angeben."],
  ["Swag-Update", "Dein Swag wurde um 16 Wochen erhöht."]
];

// Beim Laden grüßt immer der Y U NO Guy (steht im HTML). Beim Klicken sind diese
// Rage-Faces reihum dran, auch über das Neuladen hinweg.
// zeilen: [obere Zeile, untere Zeile, Bildunterschrift]
// "voll": Bild bringt seinen eigenen Hintergrund mit.
var MEMES = [
  { datei: "me-gusta", name: "Me Gusta",
    zeilen: ["DIESES DATUM", "ME GUSTA", "Reaktion auf deine Zukunft."] },
  { datei: "cereal-guy", name: "Cereal Guy",
    zeilen: ["WAS, SCHON", "SO SPÄT?", "*prust*"] },
  { datei: "poker-face", name: "Poker Face",
    zeilen: ["TUT SO, ALS OB", "ER MITGERECHNET HAT", "Keine Regung."] },
  { datei: "okay", name: "Okay Guy",
    zeilen: ["NUR DAS DATUM?", "OKAY.", "Kein Danke, nichts."] },
  { datei: "fffuuu", name: "Rage Guy",
    zeilen: ["", "", "DAS GING DIE GANZE ZEIT PER KNOPF?!"] },
  { datei: "forever-alone", name: "Forever Alone", voll: "#0b1115",
    zeilen: ["IN 16 WOCHEN", "IMMER NOCH SINGLE", "Sogar in der Zukunft."] },
  { datei: "challenge-accepted", name: "Challenge Accepted",
    zeilen: ["112 TAGE WARTEN?", "CHALLENGE ACCEPTED", "Er zieht das durch."] }
];
// Vorladen, damit beim Klicken nichts flackert.
MEMES.forEach(function (m) { new Image().src = "memes/" + m.datei + ".jpg"; });

var ersatzMerker = {};

// Liefert die nächste Position einer Reihe und merkt sich die übernächste,
// auch über das Neuladen hinweg. Ohne Speicher (z. B. blockiert) startet
// die Reihe an zufälliger Stelle.
function reihum(name, anzahl, schritt) {
  var schluessel = "16wochen-" + name;
  var nummer;
  try {
    nummer = Number(localStorage.getItem(schluessel)) || 0;
    if (!(Number.isInteger(nummer) && nummer >= 0 && nummer < anzahl)) nummer = 0;
    localStorage.setItem(schluessel, (nummer + schritt) % anzahl);
  } catch (e) {
    if (!(name in ersatzMerker)) ersatzMerker[name] = Math.floor(Math.random() * anzahl / schritt) * schritt;
    nummer = ersatzMerker[name];
    ersatzMerker[name] = (nummer + schritt) % anzahl;
  }
  return nummer;
}

// "menge" aufeinanderfolgende Einträge, bei jedem Aufruf die nächsten.
function naechste(name, liste, menge) {
  var start = reihum(name, liste.length, menge);
  return liste.slice(start, start + menge);
}

function pinnwandEintrag(beitrag) {
  var eintrag = document.createElement("li");
  var name = document.createElement("b");
  name.textContent = beitrag[0];
  eintrag.append(name, beitrag[1]);
  return eintrag;
}

function faktenZeigen(datum) {
  el("faktenliste").replaceChildren.apply(el("faktenliste"), faktenHeute.map(function (fakt) {
    var eintrag = document.createElement("li");
    eintrag.innerHTML = typeof fakt === "function" ? fakt(datum) : fakt; // nur eigene Texte von oben
    return eintrag;
  }));
}

// Gut zu wissen: pro Seitenaufruf vier davon, reihum.
var FAKTEN = [
  "Das sind <b>112 Tage</b> oder <b>2.688 Stunden</b>.",
  "Oder <b>38.400-mal</b> „Gangnam Style“ am Stück. Bitte nicht.",
  "Dein altes Nokia hat dann noch <b>2 von 3</b> Akkubalken.",
  function (datum) { return "Es ist wieder ein <b>" + wochentagFormat.format(datum) + "</b>. Mathe, Alter."; },

  "Bis dahin erlebst du genau <b>16 Freitage</b>. Rebecca Black ist bereit.",
  "Die Erde fliegt bis dahin rund <b>288 Millionen km</b> um die Sonne. Ganz ohne Navi.",
  "Dein Herz schlägt bis dahin etwa <b>11 Millionen Mal</b>. Bei Katzenvideos öfter.",
  "<b>112</b> ist auch die Notrufnummer. Zufall? Ja.",

  "Bei 3 SMS am Tag sind das <b>336 SMS</b>. Hol dir lieber die Flat.",
  "Dein Seitenscheitel wächst bis dahin um etwa <b>4 cm</b>. Swag.",
  "Alle 10 Minuten ein Duckface ergibt <b>16.128 Duckfaces</b>. Schlaf wird überbewertet.",
  "Du hast noch <b>16 Montage</b> vor dir. Mein Beileid.",

  "Bei 8 Stunden pro Nacht verschläfst du davon <b>896 Stunden</b>. Läuft.",
  "Deine Fingernägel wachsen rund <b>1 cm</b>. Der Nagellack hält das nicht durch.",
  "Das sind <b>9.676.800 Sekunden</b>. Wir haben nicht nachgezählt. Doch.",
  "<b>32 Tage</b> davon sind Wochenende. YOLO."
];

// Das steht beim Laden an der Pinnwand: pro Seitenaufruf drei, reihum.
var BEITRAEGE = [
  ["xX_Schnuffi92_Xx", "ERSTER!!!!!11"],
  ["Mutti", "Wie drucke ich das Datum aus? LG Mutti"],
  ["DerEchteKevin", "yolo, ich plane nur bis Freitag"],

  ["Chantal :*", "wer kommt heute abend ICQ?? <3"],
  ["Papa_1961", "WIE MACHT MAN DIE GROSSSCHRIFT WIEDER AUS"],
  ["LanPartyLukas", "bringt wer ein Verlängerungskabel mit? DRINGEND"],

  ["Oma Gisela", "Ich habe die Internetseite ausgeschnitten und an den Kühlschrank gehängt."],
  ["MayaExperte2012", "Der Weltuntergang ist nur verschoben. Glaubt mir."],
  ["Jaqueline<3", "wer das liest und nicht teilt hat 7 Jahre Pech"],

  ["HipsterHannes", "Ich fand 16 Wochen schon gut, als es noch 15 waren."],
  ["Sandra (Buchhaltung)", "Wer hat meinen Joghurt gegessen?? Er war beschriftet!"],
  ["FarmFrank", "kann mir jemand ne Kuh schicken? brauche nur noch eine"]
];

// Das kommt beim Klicken dazu, reihum.
var KOMMENTARE = [
  ["Zukunfts-Horst", "Krass, an dem Tag hab ich noch nix vor!"],
  ["Mutti", "Ich habe geklickt und jetzt ist alles kopiert?? LG Mutti"],
  ["xX_Schnuffi92_Xx", "ohne Beweisfoto glaub ich das nicht"],
  ["DerEchteKevin", "alter, bis dahin bin ich voll erwachsen (nicht)"],
  ["Chantal :*", "gleich als Status gepostet <3"],
  ["Admin", "Bitte hört auf, den Knopf zu drücken. Er ist aus Glas."],
  ["Oma Gisela", "So ein schöner grüner Knopf. Gibt es den auch in Beige?"],
  ["HipsterHannes", "Dieses Datum ist mir zu Mainstream."],
  ["Papa_1961", "HABE DAS DATUM IM VIDEOREKORDER EINPROGRAMMIERT"],
  ["LanPartyLukas", "krass, schneller als mein Download"],
  ["Sandra (Buchhaltung)", "Termin eingetragen. Der neue Joghurt ist bis dahin abgelaufen."],
  ["MayaExperte2012", "112 Tage … genau wie in der Prophezeiung!!"]
];

function el(id) { return document.getElementById(id); }

var ruhig = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var klicks = 0;
var laedt = false;
var angezeigterTag = "";
var kopierAuftrag = null;
var growlTimer = 0;
var faktenHeute = []; // wird beim Laden ausgewählt

function blattFuellen(praefix, datum) {
  el(praefix + "-tag").textContent = datum.getDate();
  el(praefix + "-monat").textContent = monatFormat.format(datum);
  el(praefix + "-lang").textContent = langFormat.format(datum);
}

// Hält "Heute" aktuell, auch wenn der Tab über Mitternacht offen bleibt.
function heuteAktualisieren() {
  var jetzt = new Date();
  if (kurz(jetzt) === angezeigterTag) return;
  var warSchonDa = angezeigterTag !== "";
  angezeigterTag = kurz(jetzt);
  blattFuellen("heute", jetzt);
  faktenZeigen(plus16Wochen(jetzt));
  if (warSchonDa && !laedt) {
    kopierAuftrag = null; // verspätete Kopier-Meldungen von gestern ignorieren
    el("ziel-blatt").classList.add("leer");
    el("ziel-tag").textContent = "?";
    el("ziel-monat").textContent = "streng geheim";
    el("ziel-lang").textContent = "Neuer Tag, neue Zukunft.";
    el("meldung").hidden = true;
  }
}

// Nur zu lange Zeilen stauchen, kurze nicht in die Breite ziehen.
function memeZeile(id, text) {
  var zeile = el(id);
  zeile.removeAttribute("textLength");
  zeile.textContent = text;
  if (zeile.getComputedTextLength() > 270) zeile.setAttribute("textLength", "270");
}

function memeZeigen(meme) {
  var rahmen = el("meme");
  var bild = el("meme-bild");
  // Weiße Bilder bekommen oben und unten Platz für die Schrift.
  bild.setAttribute("y", meme.voll ? 0 : 50);
  bild.setAttribute("height", meme.voll ? 300 : 200);
  bild.setAttribute("href", "memes/" + meme.datei + ".jpg");
  el("meme-grund").setAttribute("fill", meme.voll || "#fff");
  el("meme-titel").textContent = meme.name;
  memeZeile("oben", meme.zeilen[0]);
  memeZeile("unten", meme.zeilen[1]);
  el("bildunterschrift").textContent = meme.zeilen[2];
  rahmen.classList.remove("plopp");
  void rahmen.offsetWidth;
  rahmen.classList.add("plopp");
}

function growl(titel, text) {
  var kasten = el("growl");
  clearTimeout(growlTimer);
  kasten.hidden = true;
  void kasten.offsetWidth; // Animation neu starten
  el("growl-titel").textContent = titel;
  el("growl-text").textContent = text;
  kasten.hidden = false;
  growlTimer = setTimeout(function () { kasten.hidden = true; }, 3500);
}

function schnurrbartRegen() {
  if (ruhig) return;
  var farben = ["#111", "#5a3318", "#ff4fa3", "#a6e22e", "#2fb6ff", "#ffcf1f"];
  for (var i = 0; i < 36; i++) {
    var bart = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    bart.setAttribute("viewBox", "0 0 100 40");
    bart.setAttribute("width", 26 + Math.random() * 34);
    bart.innerHTML = '<path d="M50 14C40 0 26 6 22 18S8 30 2 20c0 16 18 24 32 17 8-3 13-9 16-14 3 5 8 11 16 14 14 7 32-1 32-17-6 10-16 10-20-2S60 0 50 14z"/>';
    bart.style.fill = farben[i % farben.length];
    bart.style.left = Math.random() * 100 + "%";
    bart.style.animationDuration = 1.8 + Math.random() * 1.8 + "s";
    bart.style.animationDelay = Math.random() * 0.5 + "s";
    bart.style.setProperty("--dreh", (Math.random() * 720 - 360) + "deg");
    bart.addEventListener("animationend", function (e) { e.target.remove(); });
    el("konfetti").appendChild(bart);
  }
}

function laden(fertig) {
  laedt = true;
  el("laden").hidden = false;
  var schritt = 0;
  (function weiter() {
    if (schritt === LADESPRUECHE.length) {
      laedt = false;
      el("laden").hidden = true;
      fertig();
      return;
    }
    el("ladetext").textContent = LADESPRUECHE[schritt];
    schritt++;
    var breite = [35, 70, 99][schritt - 1];
    requestAnimationFrame(function () { el("fuellung").style.width = breite + "%"; });
    setTimeout(weiter, 550);
  })();
}

// Erfolg wird nur gemeldet, wenn das Kopieren wirklich geklappt hat.
function kopierMeldung(text, geklappt) {
  var kasten = el("meldung");
  var feld = el("notfeld");
  kasten.hidden = false;
  kasten.classList.toggle("fehler", !geklappt);
  feld.hidden = geklappt;
  if (geklappt) {
    el("meldungstext").innerHTML = "<b></b> ist jetzt in deiner Zwischenablage. Läuft bei dir.";
    el("meldungstext").firstChild.textContent = text;
    var spruch = GROWLS[(klicks - 1) % GROWLS.length];
    growl(spruch[0], spruch[1]);
  } else {
    el("meldungstext").textContent = "Epic Fail: Dein Browser lässt uns nicht kopieren. Bitte selbst kopieren (Strg+C bzw. lange tippen):";
    feld.value = text;
    feld.focus();
    feld.select();
  }
}

function zukunftZeigen(auftrag) {
  var blatt = el("ziel-blatt");
  blatt.classList.remove("leer", "flip");
  void blatt.offsetWidth;
  blatt.classList.add("flip");
  blattFuellen("ziel", auftrag.datum);

  memeZeigen(naechste("meme", MEMES, 1)[0]);

  var wand = el("pinnwand");
  wand.prepend(pinnwandEintrag(naechste("kommentar", KOMMENTARE, 1)[0]));
  while (wand.children.length > 4) wand.lastElementChild.remove();
  el("gefaellt").textContent = "Dir, Mutti und " + (3 + klicks) + " anderen gefällt das.";

  schnurrbartRegen();
  auftrag.kopie.then(
    function () { if (auftrag === kopierAuftrag) kopierMeldung(auftrag.text, true); },
    function () { if (auftrag === kopierAuftrag) kopierMeldung(auftrag.text, false); }
  );
}

el("knopf").addEventListener("click", function () {
  heuteAktualisieren();
  var datum = plus16Wochen(new Date());
  klicks++;
  // Sofort kopieren: Browser erlauben das nur direkt beim Klick.
  var kopie = kopieren(kurz(datum));
  kopie.catch(function () {});
  kopierAuftrag = { datum: datum, text: kurz(datum), kopie: kopie };

  if (laedt) return;
  // Den Ladebalken gibt es nur beim ersten Mal. Wir sind ja keine Unmenschen.
  if (klicks === 1 && !ruhig) {
    laden(function () { zukunftZeigen(kopierAuftrag); });
  } else {
    zukunftZeigen(kopierAuftrag);
  }
});

faktenHeute = naechste("fakten", FAKTEN, 4);
naechste("pinnwand", BEITRAEGE, 3).forEach(function (beitrag) {
  el("pinnwand").appendChild(pinnwandEintrag(beitrag));
});
heuteAktualisieren();
setInterval(heuteAktualisieren, 15000);
document.addEventListener("visibilitychange", heuteAktualisieren);
