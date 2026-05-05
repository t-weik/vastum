document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("life-grid");
    const drawer = document.getElementById("settings-drawer");
    const userForm = document.getElementById("user-form");

    let userData = JSON.parse(localStorage.getItem("lifeData")) || {
        vorname: "User", alter: 30, lebenserwartung: 80, schlaf: 8, handy: "03:00", 
        tv: "02:00", arbeitsstunden: 40, sport: 3, freunde: 5
    };

    const openDrawer = () => drawer.classList.add("open");
    const closeDrawer = () => drawer.classList.remove("open");
    
    document.getElementById("settings-toggle").onclick = openDrawer;
    document.getElementById("settings-close").onclick = closeDrawer;

    document.getElementById("btn-example").onclick = () => {
        const example = { vorname: "Max", alter: 35, lebenserwartung: 85, schlaf: 7.5, handy: "02:30", tv: "01:00", arbeitsstunden: 38, sport: 4, freunde: 8 };
        Object.keys(example).forEach(key => { if(document.getElementById(key)) document.getElementById(key).value = example[key]; });
    };

    userForm.onsubmit = (e) => {
        e.preventDefault();
        const fd = new FormData(userForm);
        const newData = {};
        [...userForm.elements].forEach(el => { if(el.id) newData[el.id] = el.value; });
        userData = newData;
        localStorage.setItem("lifeData", JSON.stringify(userData));
        closeDrawer();
        render();
    };

    function render() {
        grid.innerHTML = "";
        const totalMonths = userData.lebenserwartung * 12;
        const passedMonths = userData.alter * 12;
        const dotsPerRow = 24; // 2 Jahre pro Zeile
        const rowsPerBlock = 5; // 10 Jahre pro Block

        for (let i = 0; i < Math.ceil(totalMonths / (dotsPerRow * rowsPerBlock)); i++) {
            const block = document.createElement("div");
            block.className = "decade-block";
            const label = document.createElement("div");
            label.className = "decade-label";
            label.innerText = i * 10;
            block.appendChild(label);

            for (let r = 0; r < rowsPerBlock; r++) {
                const row = document.createElement("div");
                row.className = "year-row";
                for (let d = 0; d < dotsPerRow; d++) {
                    const mIdx = (i * dotsPerRow * rowsPerBlock) + (r * dotsPerRow) + d;
                    if (mIdx >= totalMonths) break;
                    const dot = document.createElement("div");
                    dot.className = `dot ${mIdx < passedMonths ? 'past' : 'future'}`;
                    dot.id = `m-${mIdx}`;
                    row.appendChild(dot);
                }
                block.appendChild(row);
            }
            grid.appendChild(block);
        }
        updateStats("standard");
    }

    function updateStats(filter) {
        const dots = document.querySelectorAll(".dot");
        dots.forEach(d => d.className = d.className.replace(/highlighted|dimmed/g, ""));
        
        let ratio = (userData.alter * 12) / (userData.lebenserwartung * 12);
        let title = "Gelebte Zeit";

        if (filter !== "standard") {
            const hours = {
                schlaf: userData.schlaf / 24,
                arbeit: userData.arbeitsstunden / 168,
                handy: (parseInt(userData.handy.split(":")[0]) || 0) / 24,
                sport: userData.sport / 168,
                freunde: userData.freunde / 168,
                tv: (parseInt(userData.tv.split(":")[0]) || 0) / 24
            };
            ratio = hours[filter] || 0;
            title = filter.toUpperCase();
        }

        document.getElementById("stat-title").innerText = title;
        document.getElementById("stat-percent").innerText = Math.round(ratio * 100) + "%";
        document.getElementById("stat-absolute").innerText = `${Math.round(userData.lebenserwartung * 12 * ratio)} Monate Gesamtaufwand`;

        if (filter !== "standard") {
            const target = Math.round(dots.length * ratio);
            dots.forEach((d, i) => {
                if (i < target) d.classList.add("highlighted");
                else d.classList.add("dimmed");
            });
        }
    }

    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.onclick = (e) => {
            document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            updateStats(btn.dataset.filter);
        };
    });

    Object.keys(userData).forEach(key => { if(document.getElementById(key)) document.getElementById(key).value = userData[key]; });
    render();
});