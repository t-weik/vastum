document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("life-grid");
    const drawer = document.getElementById("settings-drawer");
    const userForm = document.getElementById("user-form");
    const compareGrid = document.getElementById("compare-grid");

    const viewMain = document.getElementById("view-main");
    const viewCompare = document.getElementById("view-compare");
    const mainSection = document.getElementById("main-view-section");
    const compareSection = document.getElementById("compare-view-section");

    // Persistente Benutzerdaten (Alle 22 Pflichtangaben)
    let userData = JSON.parse(localStorage.getItem("lifeDataFull")) || {
        vorname: "Gast", geschlecht: "divers", alter: 30, lebenserwartung: 80, wohnort: "München",
        beruf: "Freelancer", schlaf: 8, handy: "02:30", sport: 3, freunde: 8, tv: "01:30",
        rauchen: 0, suessigkeiten: "mittel", groesse: 178, gewicht: 72, alkohol_konsum: "selten",
        alkohol_liter: 0.5, blutdruck: "normal", stress: "normal", arbeitsstunden: 40,
        urlaub: 30, krankheitstage: 5, gehalt: 2800, vermoegen: 12000
    };

    const toggleDrawer = (state) => drawer.classList.toggle("open", state);
    document.getElementById("settings-toggle").onclick = () => toggleDrawer(true);
    document.getElementById("settings-close").onclick = () => toggleDrawer(false);

    const parseTime = (str) => {
        if (!str || !str.includes(":")) return 0;
        const [h, m] = str.split(":").map(Number);
        return h + (m / 60);
    };

    // Errechnet Geburtsjahr anhand des aktuellen Jahres (2026) und des Alters
    const getGeburtsjahr = (age) => 2026 - parseInt(age);

    // Laden der 35 J. Musterperson
    document.getElementById("btn-example").onclick = () => {
        const ex = {
            vorname: "Maximilian", geschlecht: "maennlich", alter: 35, lebenserwartung: 85, wohnort: "Hamburg",
            beruf: "Projektmanager", schlaf: 7.5, handy: "03:15", sport: 5, freunde: 10, tv: "01:00",
            rauchen: 3, suessigkeiten: "mittel", groesse: 182, gewicht: 81, alkohol_konsum: "regelmaessig",
            alkohol_liter: 1.2, blutdruck: "normal", stress: "hoch", arbeitsstunden: 38,
            urlaub: 30, krankheitstage: 4, gehalt: 3200, vermoegen: 45000
        };
        Object.keys(ex).forEach(key => { if (document.getElementById(key)) document.getElementById(key).value = ex[key]; });
    };

    userForm.onsubmit = (e) => {
        e.preventDefault();
        const newData = {};
        [...userForm.elements].forEach(el => { if (el.id) newData[el.id] = el.value; });
        userData = newData;
        localStorage.setItem("lifeDataFull", JSON.stringify(userData));
        toggleDrawer(false);
        render();
    };

    // Ansichten-Umschalter
    viewMain.onclick = () => {
        viewMain.classList.add("active");
        viewCompare.classList.remove("active");
        mainSection.classList.add("active");
        compareSection.classList.remove("active");
        render();
    };

    viewCompare.onclick = () => {
        viewCompare.classList.add("active");
        viewMain.classList.remove("active");
        compareSection.classList.add("active");
        mainSection.classList.remove("active");
        renderCompare();
    };

    // Hauptansicht generieren
    function render() {
        grid.innerHTML = "";
        const totalMonths = userData.lebenserwartung * 12;
        const passedMonths = userData.alter * 12;

        // Erstellt die Punkte flach ohne logische Zeilenumbrüche im HTML
        // CSS ordnet das Ganze im 24er Grid an
        for (let m = 0; m < totalMonths; m++) {
            const dot = document.createElement("div");
            dot.className = `dot ${m < passedMonths ? 'past' : 'future'}`;
            dot.id = `m-${m}`;
            grid.appendChild(dot);
        }
        updateStats("standard");
    }

    // Statistikauswertung mit Füllung von UNTEN nach OBEN
    function updateStats(filter) {
        const dots = document.querySelectorAll("#life-grid .dot");
        const totalMonths = dots.length;

        // Filterklassen zurücksetzen
        dots.forEach(d => d.className = d.className.replace(/highlighted|dimmed/g, "").trim());

        let ratio = 0;
        let title = "Gelebte Zeit";
        let subtext = "";

        if (filter === "standard") {
            ratio = (userData.alter * 12) / totalMonths;
            const geburtsjahr = getGeburtsjahr(userData.alter);
            subtext = `${userData.alter * 12} Monate gelebt (Geburtsjahr ca. ${geburtsjahr}).`;
        } else {
            const factors = {
                schlaf: userData.schlaf / 24,
                handy: parseTime(userData.handy) / 24,
                tv: parseTime(userData.tv) / 24,
                arbeit: userData.arbeitsstunden / 168,
                sport: userData.sport / 168,
                freunde: userData.freunde / 168
            };
            ratio = factors[filter] || 0;
            title = filter.toUpperCase();
            const totalYears = (totalMonths / 12 * ratio).toFixed(1);
            subtext = `Projeziert auf dein Gesamtleben entspricht das ca. ${totalYears} Jahren am Stück.`;
        }

        document.getElementById("stat-title").innerText = title;
        document.getElementById("stat-percent").innerText = Math.round(ratio * 100) + "%";
        document.getElementById("stat-absolute").innerText = subtext;

        if (filter !== "standard") {
            const targetCount = Math.round(totalMonths * ratio);
            
            // Fülle von unten nach oben: Beginne am Ende des Arrays
            for (let i = totalMonths - 1; i >= 0; i--) {
                const distanceFromEnd = (totalMonths - 1) - i;
                if (distanceFromEnd < targetCount) {
                    dots[i].classList.add("highlighted");
                } else {
                    dots[i].classList.add("dimmed");
                }
            }
        }
    }

    // Einzelauswertung (Dashboard mit Vergleichen)
    function renderCompare() {
        compareGrid.innerHTML = "";
        const totalMonths = userData.lebenserwartung * 12;

        const compareItems = [
            { key: "Gelebt", ratio: (userData.alter * 12) / totalMonths, display: `${userData.alter} Jahre` },
            { key: "Schlaf", ratio: userData.schlaf / 24, display: `${userData.schlaf}h/Tag` },
            { key: "Arbeit", ratio: userData.arbeitsstunden / 168, display: `${userData.arbeitsstunden}h/Woche` },
            { key: "Smartphone", ratio: parseTime(userData.handy) / 24, display: `${userData.handy}h/Tag` },
            { key: "Freunde", ratio: userData.freunde / 168, display: `${userData.freunde}h/Woche` },
            { key: "Sport", ratio: userData.sport / 168, display: `${userData.sport}h/Woche` },
            { key: "TV & Video", ratio: parseTime(userData.tv) / 24, display: `${userData.tv}h/Tag` },
            { key: "Rauchen", ratio: (userData.rauchen * 5) / 10080, display: `${userData.rauchen} Stk/W.` }, // Grobe Zeitrelation
            { key: "Urlaub", ratio: userData.urlaub / 365, display: `${userData.urlaub} Tage/J.` },
            { key: "Krankheit", ratio: userData.krankheitstage / 365, display: `${userData.krankheitstage} Tage/J.` }
        ];

        compareItems.forEach(item => {
            const card = document.createElement("div");
            card.className = "compare-card";

            const title = document.createElement("div");
            title.className = "compare-card-title";
            title.innerText = item.key;

            // Mini-Grid für die Vorschau (Zusammenfassung im Vergleich)
            const miniGrid = document.createElement("div");
            miniGrid.className = "compare-mini-grid";
            
            const totalMiniDots = 120; // Repräsentative 120 Punkte (10 Jahre skaliert)
            const targetMiniDots = Math.round(totalMiniDots * item.ratio);

            for (let md = 0; md < totalMiniDots; md++) {
                const miniDot = document.createElement("div");
                miniDot.className = "dot";
                
                // Befüllung von unten nach oben
                const distanceFromEnd = (totalMiniDots - 1) - md;
                if (distanceFromEnd < targetMiniDots) {
                    miniDot.className += " highlighted";
                } else {
                    miniDot.className += " future";
                }
                miniGrid.appendChild(miniDot);
            }

            const value = document.createElement("div");
            value.className = "compare-card-value";
            value.innerText = Math.round(item.ratio * 100) + "%";

            const sub = document.createElement("div");
            sub.className = "stat-sub";
            sub.innerText = item.display;

            card.appendChild(title);
            card.appendChild(miniGrid);
            card.appendChild(value);
            card.appendChild(sub);
            compareGrid.appendChild(card);
        });
    }

    // Filter Buttons der Hauptansicht
    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            updateStats(btn.dataset.filter);
        };
    });

    // Init-Formulardaten setzen
    Object.keys(userData).forEach(key => { if (document.getElementById(key)) document.getElementById(key).value = userData[key]; });
    render();
});