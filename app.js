/* TAB SWITCHING */
document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const tabId = btn.dataset.tab;

        // Guard admin tabs
        if ((tabId === "add" || tabId === "bracket") && !isAdmin) {
            const entered = prompt("Enter admin password:");

            if (entered === ADMIN_PASSWORD) {
                localStorage.setItem("adminAuth", "true");
                isAdmin = true;
            }
            isAdmin = localStorage.getItem("adminAuth") === "true";

        }

        // Switch tab
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));

        btn.classList.add("active");
        document.getElementById(tabId).classList.add("active");
    });
});

/* ================= STORAGE KEYS ================= */
const STORAGE = {
    pool: "poolWinners",
    quarter: "quarterWinners",
    semi: "semiWinners"
};

/* ================= DOM REFERENCES ================= */
const poolTeams = document.querySelectorAll("#bracket .pool-team");
const quarterCells = document.querySelectorAll("#bracket .quarter");
const semiCells = document.querySelectorAll("#bracket .semi");
const MATCH_KEY = "matchCenterData";

/*
{
  live: "Team A vs Team B",
  result: "Team X defeated Team Y",
  upcoming: "Team C vs Team D"
}
*/

const ADMIN_PASSWORD = "admin"; // change this
let isAdmin = false;
let isAdminUnlocked = sessionStorage.getItem("adminUnlocked") === "true";

function openTab(tabId) {
    const adminTabs = ["add", "bracket"];

    if (adminTabs.includes(tabId) && !isAdminUnlocked) {
        const input = prompt("Enter admin password:");

        if (input !== ADMIN_PASSWORD) {
            alert("Wrong password. Access denied.");
            return; // ⛔ STOP HERE — THIS WAS MISSING
        }

        isAdminUnlocked = true;
        sessionStorage.setItem("adminUnlocked", "true");
    }

    document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
    document.getElementById(tabId).classList.add("active");
}
function adminLogout() {
    sessionStorage.removeItem("adminUnlocked");
    location.reload();
}


/* ================= INIT ================= */
window.addEventListener("DOMContentLoaded", () => {
    restorePoolWinners();
    restoreQuarterWinners();
    restoreSemiWinners();
    restoreFinalWinners()
    renderViewOnlyBracket();
    renderPublic("live");

});

/* ================= POOL → QUARTER ================= */
poolTeams.forEach((team, index) => {
    team.addEventListener("click", () => {
        const name = team.textContent.trim();
        if (!name || name === "—") return;

        const poolIndex = Math.floor(index / 5); // 0–3
        let data = getData(STORAGE.pool);

        data[poolIndex] = data[poolIndex] || [];

        const pos = data[poolIndex].indexOf(name);

        // Toggle OFF
        if (pos !== -1) {
            data[poolIndex].splice(pos, 1);
            team.classList.remove("selected");
        }
        // Toggle ON
        else if (data[poolIndex].length < 2) {
            data[poolIndex].push(name);
            team.classList.add("selected");
        }

        updateQuarterFromPool(poolIndex, data[poolIndex]);
       saveData(STORAGE.pool, data);
        renderViewOnlyBracket();
    });
});

function updateQuarterFromPool(poolIndex, winners) {
    const base = poolIndex * 2;
    quarterCells[base].textContent = winners[0] || `QF ${base + 1}`;
    quarterCells[base + 1].textContent = winners[1] || `QF ${base + 2}`;
}
renderViewOnlyBracket();


/* ================= QUARTER → SEMI ================= */
quarterCells.forEach((cell, index) => {
    cell.addEventListener("click", () => {
        const name = cell.textContent.trim();
        if (!name || name.startsWith("QF")) return;

        const matchIndex = Math.floor(index / 2);
        let data = getData(STORAGE.quarter);

        data[matchIndex] = name;
        clearQuarterSelection(matchIndex);
        cell.classList.add("selected");

        updateSemiFromQuarter(matchIndex, name);
        saveData(STORAGE.quarter, data);
        renderViewOnlyBracket();
    });
});

function updateSemiFromQuarter(matchIndex, name) {
    semiCells[matchIndex].textContent = name;
}
renderViewOnlyBracket();

/* ================= SEMI → FINAL ================= */

const finalCells = document.querySelectorAll("#bracket .final");
const FINAL_STORAGE_KEY = "finalWinners";

/* Semi click → Final */
semiCells.forEach((cell, index) => {
    cell.addEventListener("click", () => {
        const name = cell.textContent.trim();
        if (!name || name.startsWith("Semi")) return;

        const matchIndex = Math.floor(index / 2); // 0 or 1
        let data = getData(FINAL_STORAGE_KEY);

        // Toggle behavior
        data[matchIndex] = name;

        clearFinalSelection(matchIndex);
        cell.classList.add("selected");

        finalCells[matchIndex].textContent = name;

        saveData(FINAL_STORAGE_KEY, data);
        renderViewOnlyBracket();
    });
});

/* Restore Final winners */
function restoreFinalWinners() {
    const data = getData(FINAL_STORAGE_KEY);

    data.forEach((name, index) => {
        if (!name) return;

        finalCells[index].textContent = name;
        finalCells[index].classList.add("selected");
    });
}

/* Clear selection for same final match */
function clearFinalSelection(matchIndex) {
    semiCells.forEach((cell, i) => {
        if (Math.floor(i / 2) === matchIndex) {
            cell.classList.remove("selected");
        }
    });
}


/* ================= SEMI SELECTION ================= */
semiCells.forEach((cell, index) => {
    cell.addEventListener("click", () => {
        const name = cell.textContent.trim();
        if (!name || name.startsWith("Semi")) return;

        let data = getData(STORAGE.semi);
        data[index] = name;

        clearSemiSelection(index);
        cell.classList.add("selected");

        saveData(STORAGE.semi, data);
    });
});

/* ================= RESTORE ================= */
function restorePoolWinners() {
    const data = getData(STORAGE.pool);

    data.forEach((winners, poolIndex) => {
        if (!winners) return;

        winners.forEach(name => {
            poolTeams.forEach(team => {
                if (team.textContent.trim() === name) {
                    team.classList.add("selected");
                }
            });
        });

        updateQuarterFromPool(poolIndex, winners);
    });
}

function restoreQuarterWinners() {
    const data = getData(STORAGE.quarter);

    data.forEach((name, index) => {
        if (!name) return;

        quarterCells[index * 2]?.classList.add("selected");
        updateSemiFromQuarter(index, name);
    });
}

function restoreSemiWinners() {
    const data = getData(STORAGE.semi);

    data.forEach((name, index) => {
        if (!name) return;
        semiCells[index].classList.add("selected");
    });
}

/* ================= HELPERS ================= */
function clearQuarterSelection(matchIndex) {
    quarterCells.forEach((cell, i) => {
        if (Math.floor(i / 2) === matchIndex) {
            cell.classList.remove("selected");
        }
    });
}

function clearSemiSelection(index) {
    semiCells[index].classList.remove("selected");
}

function saveData(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
    renderViewOnlyBracket();
}

function getData(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}


/* Generic sync helper */
function syncStage(selector, storageKey) {
    const sourceData = JSON.parse(localStorage.getItem(storageKey));
    if (!sourceData) return;

    const viewCells = document
        .querySelector("#bracket-view")
        ?.querySelectorAll(selector);

    if (!viewCells) return;

    // FLATTEN if needed
    const flatData = Array.isArray(sourceData[0])
        ? sourceData.flat()
        : sourceData;

    viewCells.forEach((cell, index) => {
        if (flatData[index]) {
            cell.textContent = flatData[index];
            cell.classList.add("selected");
        }
    });
}

function renderViewOnlyBracket() {
    renderStage("#bracket-view .pool-team", "tournamentTeams");
    renderStage("#bracket-view .quarter", "poolWinners");
    renderStage("#bracket-view .semi", "quarterWinners");
    renderStage("#bracket-view .final", "finalWinners");
}

function renderStage(selector, storageKey) {
    const data = JSON.parse(localStorage.getItem(storageKey));
    if (!data) return;

    const cells = document.querySelectorAll(selector);
    const flatData = Array.isArray(data[0]) ? data.flat() : data;

    cells.forEach((cell, index) => {
        cell.textContent = flatData[index] || cell.textContent;
        cell.classList.toggle("selected", !!flatData[index]);
    });
}


function renderStage(selector, storageKey) {
    const data = JSON.parse(localStorage.getItem(storageKey));
    if (!data) return;

    const cells = document.querySelectorAll(selector);
    const flatData = Array.isArray(data[0]) ? data.flat() : data;

    cells.forEach((cell, index) => {
        cell.textContent = flatData[index] || cell.textContent;
        if (flatData[index]) {
            cell.classList.add("selected");
        }
    });
}

/* ========= UPDATE BRACKET (ADD / EDIT TEAMS) ========= */

const updateBtn = document.getElementById("updateBracket");

updateBtn.addEventListener("click", () => {
    const inputs = document.querySelectorAll("#add .pool input");
    const poolCells = document.querySelectorAll("#bracket .pool-team");

    const teams = [];

    inputs.forEach((input, index) => {
        const name = input.value.trim() || "—";
        teams.push(name);

        if (poolCells[index]) {
            poolCells[index].textContent = name;
            poolCells[index].classList.remove("selected");
        }
    });

    /* Save teams */
    localStorage.setItem("tournamentTeams", JSON.stringify(teams));

    /* Reset downstream data */
    localStorage.removeItem("poolWinners");
    localStorage.removeItem("quarterWinners");
    localStorage.removeItem("semiWinners");
    localStorage.removeItem("finalWinners");

    /* Clear UI selections */
    document.querySelectorAll(".selected").forEach(el =>
        el.classList.remove("selected")
    );

    /* Reset rounds text */
    document.querySelectorAll(".quarter").forEach((q, i) => q.textContent = `QF ${i + 1}`);
    document.querySelectorAll(".semi").forEach((s, i) => s.textContent = `Semi ${i + 1}`);
    document.querySelectorAll(".final").forEach((f, i) => f.textContent = `Finalist ${i + 1}`);

    /* Sync view-only bracket */
    renderViewOnlyBracket();
});

//updateMatch
document.getElementById("updateMatch").addEventListener("click", () => {
    const data = JSON.parse(localStorage.getItem(MATCH_KEY)) || { results: [] };

    data.current = {
        team1: document.getElementById("currentTeam1").value.trim(),
        team2: document.getElementById("currentTeam2").value.trim()
    };

    data.upcoming = {
        team1: document.getElementById("nextTeam1").value.trim(),
        team2: document.getElementById("nextTeam2").value.trim()
    };

    localStorage.setItem(MATCH_KEY, JSON.stringify(data));

    syncWinnerSelection();
    renderPublic("live");
});


//public button
document.querySelectorAll(".public-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".public-btn")
            .forEach(b => b.classList.remove("active"));

        btn.classList.add("active");
        renderPublicView(btn.dataset.view);
    });
});
function renderPublicView(type) {
    const data = JSON.parse(localStorage.getItem(MATCH_KEY));
    if (!data) return;

    const el = document.getElementById("public-display-text");

    if (type === "result" && data.result) {
        el.innerHTML = `
            <span>${data.result.winner}</span>
            <strong> VS </strong>
            <span class="loser">${data.result.loser}</span>
        `;
        return;
    }

    el.textContent = data[type] || "—";
}




//Live update
function renderPublicMatch() {
    const data = JSON.parse(localStorage.getItem(MATCH_KEY));
    if (!data) return;

    document.getElementById("public-current").textContent =
        `${data.current.team1 || "—"} VS ${data.current.team2 || "—"}`;

    document.getElementById("public-next").textContent =
        `${data.next.team1 || "—"} VS ${data.next.team2 || "—"}`;
}
//Restore on page load
window.addEventListener("DOMContentLoaded", () => {
    const data = JSON.parse(localStorage.getItem(MATCH_KEY));
    if (!data) return;

    document.getElementById("currentTeam1").value = data.current.team1 || "";
    document.getElementById("currentTeam2").value = data.current.team2 || "";
    document.getElementById("nextTeam1").value = data.next.team1 || "";
    document.getElementById("nextTeam2").value = data.next.team2 || "";

    renderPublicMatch();
     renderPublicView("live");
      syncWinnerSelection();
    renderPublicTabs("live");
});

//Click to select winner
const team1Btn = document.getElementById("matchTeam1");
const team2Btn = document.getElementById("matchTeam2");

let selectedWinner = null;

function syncWinnerSelection() {
    const data = JSON.parse(localStorage.getItem(MATCH_KEY));
    if (!data || !data.current) return;

    team1Btn.textContent = data.current.team1 || "—";
    team2Btn.textContent = data.current.team2 || "—";

    selectedWinner = null;
    team1Btn.classList.remove("selected");
    team2Btn.classList.remove("selected");
};
team1Btn.addEventListener("click", () => selectWinner(team1Btn, team2Btn));
team2Btn.addEventListener("click", () => selectWinner(team2Btn, team1Btn));

function selectWinner(winnerBtn, loserBtn) {
    selectedWinner = {
        winner: winnerBtn.textContent,
        loser: loserBtn.textContent
    };

    winnerBtn.classList.add("selected");
    loserBtn.classList.remove("selected");

    saveMatchResult();
}
function saveMatchResult() {
    const data = JSON.parse(localStorage.getItem(MATCH_KEY));
    if (!data || !selectedWinner) return;

    data.results = data.results || [];

    data.results.unshift({
        winner: selectedWinner.winner,
        loser: selectedWinner.loser,
        time: Date.now()
    });

    localStorage.setItem(MATCH_KEY, JSON.stringify(data));

    renderPublic("result");
}



//Save the result to local storage
saveResultBtn.addEventListener("click", () => {
    if (!selectedWinner) {
        alert("Select a winner first");
        return;
    }

    const data = JSON.parse(localStorage.getItem(MATCH_KEY)) || {};

    data.result = selectedWinner;

    localStorage.setItem(MATCH_KEY, JSON.stringify(data));

    alert("Result saved");
});
//SynMatch

function syncMatchButtons() {
    const data = JSON.parse(localStorage.getItem(MATCH_KEY));
    if (!data || !data.live) return;

    const [t1, t2] = data.live.split(" VS ");
    team1Btn.textContent = t1;
    team2Btn.textContent = t2;

    selectedWinner = null;
    team1Btn.classList.remove("selected");
    team2Btn.classList.remove("selected");
};
//renderpublictab
function renderPublicTabs(type = "live") {
    const data = JSON.parse(localStorage.getItem(MATCH_KEY));
    if (!data) return;

    const el = document.getElementById("public-display");

    if (type === "live") {
        el.textContent = `${data.current.team1 || "—"} VS ${data.current.team2 || "—"}`;
    }

    if (type === "upcoming") {
        el.textContent = `${data.upcoming.team1 || "—"} VS ${data.upcoming.team2 || "—"}`;
    }

    if (type === "result" && data.result) {
        el.innerHTML = `
            <span>${data.result.winner}</span>
            <strong> VS </strong>
            <span class="loser">${data.result.loser}</span>
        `;
    }
}
//render core logic
function renderPublic(type) {
    const data = JSON.parse(localStorage.getItem(MATCH_KEY));
    const container = document.getElementById("public-display");

    if (!data) {
        container.textContent = "No data available";
        return;
    }

    container.innerHTML = "";

    /* LIVE */
    if (type === "live") {
        container.innerHTML = `
            <div class="match-card live">
                ${data.current.team1 || "—"} 
                <strong> VS </strong> 
                ${data.current.team2 || "—"}
            </div>
        `;
    }

    /* UPCOMING */
    if (type === "upcoming") {
        container.innerHTML = `
            <div class="match-card upcoming">
                ${data.upcoming.team1 || "—"} 
                <strong> VS </strong> 
                ${data.upcoming.team2 || "—"}
            </div>
        `;
    }

    /* RESULT */
    if (type === "result") {
        if (!data.results || data.results.length === 0) {
            container.textContent = "No results yet";
            return;
        }

        data.results.forEach(match => {
            const div = document.createElement("div");
            div.className = "match-card result";

            div.innerHTML = `
                <span class="winner">${match.winner}</span>
                <strong> VS </strong>
                <span class="loser">${match.loser}</span>
            `;

            container.appendChild(div);
        });
    }
};

//Add team
function addTeam(poolId) {
    const pool = document.querySelector(`[data-pool="${poolId}"] .team-list`);

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Team Name";

    pool.appendChild(input);
}
//Save Pools
function savePools() {
    const pools = {};

    document.querySelectorAll(".pool").forEach(pool => {
        const id = pool.dataset.pool;
        pools[id] = [...pool.querySelectorAll("input")]
            .map(i => i.value.trim())
            .filter(Boolean);
    });

    localStorage.setItem("poolsData", JSON.stringify(pools));
};

// bracket data
function renderPublicBracket() {
    const bracket = JSON.parse(localStorage.getItem("bracketData")) || {};
    const container = document.getElementById("publicBracketView");
    

    container.innerHTML = "";

    ["Quarter Finals", "Semi Finals", "Final"].forEach(round => {
        if (!bracket[round]) return;

        const section = document.createElement("div");
        section.className = "round-card";

        section.innerHTML = `<h3>${round}</h3>`;

        bracket[round].forEach(match => {
            const div = document.createElement("div");
            div.className = "match-card";

            div.innerHTML = `
                <div class="${match.winner === match.team1 ? 'winner' : ''}">
                    ${match.team1}
                </div>
                <div class="vs">vs</div>
                <div class="${match.winner === match.team2 ? 'winner' : ''}">
                    ${match.team2}
                </div>
            `;

            section.appendChild(div);
        });

        container.appendChild(section);
    });
}

localStorage.setItem("bracketData", JSON.stringify(bracket));
renderPublicBracket();
document.addEventListener("DOMContentLoaded", renderPublicBracket);




// /* ========= TOURNAMENT TEAM STORAGE ========= */

// const updateBtn = document.getElementById("updateBracket");

// /* SAVE + UPDATE BRACKET */
// updateBtn.addEventListener("click", () => {
//     const inputs = document.querySelectorAll("#add .pool input");
//     const poolTeams = document.querySelectorAll("#bracket .pool-team");

//     const teamData = [];

//     inputs.forEach((input, index) => {
//         const value = input.value.trim() || "—";
//         teamData.push(value);

//         if (poolTeams[index]) {
//             poolTeams[index].textContent = value;
//         }
//     });

//     // Save to localStorage
//     localStorage.setItem("tournamentTeams", JSON.stringify(teamData));
// });

// /* LOAD FROM localStorage ON PAGE LOAD */
// window.addEventListener("DOMContentLoaded", () => {
//     const savedTeams = JSON.parse(localStorage.getItem("tournamentTeams"));
//     if (!savedTeams) return;

//     const inputs = document.querySelectorAll("#add .pool input");
//     const poolTeams = document.querySelectorAll("#bracket .pool-team");

//     savedTeams.forEach((team, index) => {
//         if (inputs[index]) {
//             inputs[index].value = team;
//         }
//         if (poolTeams[index]) {
//             poolTeams[index].textContent = team;
//         }
//     });
// });

// /* ========= POOL → QUARTER LOGIC WITH STORAGE ========= */

// const poolTeams = document.querySelectorAll("#bracket .pool-team");
// const quarterCells = document.querySelectorAll("#bracket .quarter");

// // LocalStorage key
// const STORAGE_KEY = "poolWinners";

// // Load saved winners on page load
// window.addEventListener("DOMContentLoaded", restorePoolWinners);

// // Click handling
// poolTeams.forEach((team, index) => {
//     team.addEventListener("click", () => handlePoolClick(team, index));
// });

// function handlePoolClick(teamCell, teamIndex) {
//     const teamName = teamCell.textContent.trim();
//     if (!teamName || teamName === "—") return;

//     const poolIndex = Math.floor(teamIndex / 5); // 0–3
//     const poolStartQF = poolIndex * 2;           // 0,2,4,6

//     let winners = getStoredWinners();

//     winners[poolIndex] = winners[poolIndex] || [];

//     const selectedIndex = winners[poolIndex].indexOf(teamName);

//     // CASE 1: Deselect existing winner
//     if (selectedIndex !== -1) {
//         winners[poolIndex].splice(selectedIndex, 1);
//         teamCell.classList.remove("selected");
//         updateQuarterCells(poolIndex, winners[poolIndex]);
//         saveWinners(winners);
//         return;
//     }

//     // CASE 2: Already 2 winners selected → ignore
//     if (winners[poolIndex].length >= 2) return;

//     // CASE 3: Select new winner
//     winners[poolIndex].push(teamName);
//     teamCell.classList.add("selected");

//     updateQuarterCells(poolIndex, winners[poolIndex]);
//     saveWinners(winners);
// }

// /* ---------- Helpers ---------- */

// function updateQuarterCells(poolIndex, winners) {
//     const qfBase = poolIndex * 2;

//     quarterCells[qfBase].textContent = winners[0] || "QF " + (qfBase + 1);
//     quarterCells[qfBase + 1].textContent = winners[1] || "QF " + (qfBase + 2);
// }

// function saveWinners(data) {
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
// }

// function getStoredWinners() {
//     return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
// }

// function restorePoolWinners() {
//     const winners = getStoredWinners();

//     winners.forEach((poolWinners, poolIndex) => {
//         if (!poolWinners) return;

//         poolWinners.forEach(teamName => {
//             poolTeams.forEach(team => {
//                 if (team.textContent.trim() === teamName) {
//                     team.classList.add("selected");
//                 }
//             });
//         });

//         updateQuarterCells(poolIndex, poolWinners);
//     });
// }


//     team.addEventListener("click", () => {
//         if (!team.textContent) return;

//         const round = team.parentElement;
//         round.querySelectorAll(".team").forEach(t => t.classList.remove("selected"));

//         team.classList.add("selected");

//         const nextId = team.dataset.next;
//         if (nextId) {
//             document.getElementById(nextId).textContent = team.textContent;
//             document.getElementById(nextId).classList.remove("selected");
//         } else if (team.id === "qf1") {
//             document.getElementById("champion").textContent = team.textContent;
//         }
//     });
// });