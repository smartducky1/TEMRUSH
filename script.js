const form = document.getElementById("wlForm");
const formMessage = document.getElementById("formMessage");
const body = document.getElementById("leaderboardBody");
const toast = document.getElementById("toast");
const submissions = [];

// Set this after deploying Google Apps Script.
const API_URL = "PASTE_YOUR_APPS_SCRIPT_URL_HERE";

function shortWallet(w) {
  return w.length > 12 ? `${w.slice(0,6)}...${w.slice(-4)}` : w;
}
function validWallet(w) {
  return /^0x[a-fA-F0-9]{40}$/.test(w);
}
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2500);
}
function renderBoard() {
  body.innerHTML = "";
  submissions.slice().reverse().forEach((s, i) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${String(i + 1).padStart(2,"0")}</td>
      <td>${s.x}</td><td>${shortWallet(s.wallet)}</td>
      <td><span class="status pending">PENDING</span></td>`;
    body.appendChild(row);
  });
}
async function apiRequest(payload) {
  if (!API_URL || API_URL.includes("PASTE_YOUR_APPS_SCRIPT_URL_HERE")) {
    return { ok: false, localOnly: true };
  }
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {"Content-Type": "text/plain;charset=utf-8"},
    body: JSON.stringify(payload)
  });
  return await response.json();
}

form.addEventListener("submit", async e => {
  e.preventDefault();
  const x = document.getElementById("xUsername").value.trim();
  const wallet = document.getElementById("wallet").value.trim();

  if (!validWallet(wallet)) {
    formMessage.textContent = "Please enter a valid EVM wallet address.";
    return;
  }

  try {
    const result = await apiRequest({action:"submit", xUsername:x, wallet:wallet});
    if (!result.localOnly) {
      if (!result.ok) {
        formMessage.textContent = result.error || "Submission failed.";
        return;
      }
      form.reset();
      formMessage.textContent = "Application received — approval pending.";
      showToast("APPLICATION RECEIVED");
      return;
    }

    if (submissions.some(s => s.wallet.toLowerCase() === wallet.toLowerCase())) {
      formMessage.textContent = "HEY — THIS WALLET HAS ALREADY BEEN SUBMITTED.";
      return;
    }
    submissions.push({x: x.startsWith("@") ? x : "@" + x, wallet});
    renderBoard();
    form.reset();
    formMessage.textContent = "Application received — approval pending.";
    showToast("APPLICATION RECEIVED");
    document.getElementById("leaderboard").scrollIntoView({behavior:"smooth"});
  } catch (err) {
    formMessage.textContent = "Submission service is unavailable.";
  }
});

document.getElementById("checkButton").addEventListener("click", async () => {
  const wallet = document.getElementById("checkWallet").value.trim();
  const result = document.getElementById("checkResult");

  if (!validWallet(wallet)) {
    result.textContent = "ENTER A VALID EVM WALLET.";
    return;
  }

  try {
    const data = await apiRequest({action:"check", wallet:wallet});
    if (!data.localOnly) {
      result.textContent = data.ok
        ? `APPLICATION FOUND — STATUS: ${String(data.status).toUpperCase()}`
        : "NO APPLICATION FOUND FOR THIS WALLET.";
      return;
    }
    const found = submissions.find(s => s.wallet.toLowerCase() === wallet.toLowerCase());
    result.textContent = found ? "APPLICATION FOUND — STATUS: PENDING" : "NO APPLICATION FOUND FOR THIS WALLET.";
  } catch (err) {
    result.textContent = "CHECKER SERVICE IS UNAVAILABLE.";
  }
});

document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener("click", e => {
    const el = document.querySelector(a.getAttribute("href"));
    if (el) { e.preventDefault(); el.scrollIntoView({behavior:"smooth"}); }
  });
});
