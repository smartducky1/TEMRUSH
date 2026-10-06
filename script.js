const form = document.getElementById("wlForm");
const formMessage = document.getElementById("formMessage");
const body = document.getElementById("leaderboardBody");
const toast = document.getElementById("toast");

const submissions = [];


// =====================================================
// GOOGLE APPS SCRIPT URL
// =====================================================

const API_URL =
  "https://script.google.com/macros/s/AKfycbzPIpFMNi-imzFGVu2csJSxtfziGPPK33pl5HzZddjjA1DGYm1RD67bcGtRBHuP6QY5/exec";


// =====================================================
// HELPERS
// =====================================================

function shortWallet(w) {

  return w.length > 12
    ? `${w.slice(0, 6)}...${w.slice(-4)}`
    : w;

}


function validWallet(w) {

  return /^0x[a-fA-F0-9]{40}$/.test(w);

}


// Accept any URL beginning with https://x.com/
function validXProof(url) {

  return /^https:\/\/x\.com\/.+/i.test(
    url.trim()
  );

}


// Prevent user-submitted HTML from being inserted
// directly into the leaderboard.
function escapeHtml(value) {

  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


function showToast(message) {

  toast.textContent = message;

  toast.classList.add("show");


  setTimeout(() => {

    toast.classList.remove("show");

  }, 2500);

}


// =====================================================
// LEADERBOARD
// =====================================================

function renderBoard(applications) {

  body.innerHTML = "";


  // No applications
  if (
    !applications ||
    applications.length === 0
  ) {

    body.innerHTML = `
      <tr>
        <td
          colspan="4"
          style="text-align:center;"
        >
          NO APPLICATIONS YET
        </td>
      </tr>
    `;

    return;
  }


  applications.forEach((application, i) => {

    const row =
      document.createElement("tr");


    const username =
      escapeHtml(
        application.xUsername
      );


    const wallet =
      escapeHtml(
        application.wallet
      );


    const status =
      String(
        application.status ||
        "PENDING"
      ).toUpperCase();


    const safeStatus =
      ["PENDING", "APPROVED", "REJECTED"]
        .includes(status)
        ? status
        : "PENDING";


    row.innerHTML = `
      <td>
        ${String(i + 1).padStart(2, "0")}
      </td>

      <td>
        ${username}
      </td>

      <td>
        ${shortWallet(wallet)}
      </td>

      <td>
        <span class="status ${safeStatus.toLowerCase()}">
          ${safeStatus}
        </span>
      </td>
    `;


    body.appendChild(row);

  });

}


// =====================================================
// API REQUEST
// =====================================================

async function apiRequest(payload) {

  if (
    !API_URL ||
    API_URL.includes(
      "PASTE_YOUR_APPS_SCRIPT_URL_HERE"
    )
  ) {

    return {
      ok: false,
      localOnly: true
    };

  }


  const response =
    await fetch(API_URL, {

      method: "POST",

      headers: {
        "Content-Type":
          "text/plain;charset=utf-8"
      },

      body:
        JSON.stringify(payload)

    });


  return await response.json();

}


// =====================================================
// LOAD REAL LEADERBOARD
// =====================================================

async function loadLeaderboard() {

  try {

    const result =
      await apiRequest({

        action: "leaderboard"

      });


    if (
      !result ||
      !result.ok
    ) {

      console.error(
        "Leaderboard error:",
        result?.error
      );

      return;

    }


    renderBoard(
      result.applications || []
    );


  } catch (err) {

    console.error(
      "Leaderboard request failed:",
      err
    );

  }

}


// =====================================================
// WHITELIST FORM
// =====================================================

form.addEventListener(
  "submit",
  async (e) => {

    e.preventDefault();


    // -----------------------------------------
    // GET FORM VALUES
    // -----------------------------------------

    const x =
      document
        .getElementById("xUsername")
        .value
        .trim();


    const wallet =
      document
        .getElementById("wallet")
        .value
        .trim();


    const quoteProof =
      document
        .getElementById("quoteProof")
        .value
        .trim();


    const tagFriendsProof =
      document
        .getElementById("tagFriendsProof")
        .value
        .trim();


    // -----------------------------------------
    // VALIDATE X USERNAME
    // -----------------------------------------

    if (!x) {

      formMessage.textContent =
        "PLEASE ENTER YOUR X USERNAME.";

      return;

    }


    // -----------------------------------------
    // VALIDATE WALLET
    // -----------------------------------------

    if (!validWallet(wallet)) {

      formMessage.textContent =
        "PLEASE ENTER A VALID EVM WALLET ADDRESS.";

      return;

    }


    // -----------------------------------------
    // VALIDATE QT PROOF
    // -----------------------------------------

    if (!quoteProof) {

      formMessage.textContent =
        "PLEASE PASTE YOUR QT LINK.";

      return;

    }


    if (!validXProof(quoteProof)) {

      formMessage.textContent =
        "PLEASE ENTER A VALID X / TWITTER QT LINK.";

      return;

    }


    // -----------------------------------------
    // VALIDATE TAG PROOF
    // -----------------------------------------

    if (!tagFriendsProof) {

      formMessage.textContent =
        "PLEASE PASTE YOUR TAG 3 FRIENDS POST LINK.";

      return;

    }


    if (!validXProof(tagFriendsProof)) {

      formMessage.textContent =
        "PLEASE ENTER A VALID X / TWITTER POST LINK.";

      return;

    }


    // -----------------------------------------
    // SEND TO APPS SCRIPT
    // -----------------------------------------

    try {

      const result =
        await apiRequest({

          action: "submit",

          xUsername: x,

          wallet: wallet,

          quoteProof: quoteProof,

          tagFriendsProof:
            tagFriendsProof

        });


      // =========================================
      // CONNECTED TO GOOGLE APPS SCRIPT
      // =========================================

      if (!result.localOnly) {

        if (!result.ok) {

          formMessage.textContent =
            result.error ||
            "Submission failed.";

          return;

        }


        form.reset();


        formMessage.textContent =
          "Application received — approval pending.";


        showToast(
          "APPLICATION RECEIVED"
        );


        // Immediately reload leaderboard
        await loadLeaderboard();


        // Scroll to leaderboard
        document
          .getElementById("leaderboard")
          .scrollIntoView({
            behavior: "smooth"
          });


        return;

      }


      // =========================================
      // LOCAL FALLBACK
      // =========================================

      if (
        submissions.some(
          s =>
            s.wallet.toLowerCase() ===
            wallet.toLowerCase()
        )
      ) {

        formMessage.textContent =
          "HEY — THIS WALLET HAS ALREADY BEEN SUBMITTED.";

        return;

      }


      submissions.push({

        x:
          x.startsWith("@")
            ? x
            : "@" + x,

        wallet:
          wallet,

        quoteProof:
          quoteProof,

        tagFriendsProof:
          tagFriendsProof

      });


      renderBoard(

        submissions
          .slice()
          .reverse()
          .map(s => ({

            xUsername:
              s.x,

            wallet:
              s.wallet,

            status:
              "PENDING"

          }))

      );


      form.reset();


      formMessage.textContent =
        "Application received — approval pending.";


      showToast(
        "APPLICATION RECEIVED"
      );


      document
        .getElementById("leaderboard")
        .scrollIntoView({
          behavior: "smooth"
        });


    } catch (err) {

      console.error(err);

      formMessage.textContent =
        "Submission service is unavailable.";

    }

  }
);


// =====================================================
// WALLET STATUS CHECKER
// =====================================================

document
  .getElementById("checkButton")
  .addEventListener(
    "click",
    async () => {

      const wallet =
        document
          .getElementById("checkWallet")
          .value
          .trim();


      const result =
        document
          .getElementById("checkResult");


      if (!validWallet(wallet)) {

        result.textContent =
          "ENTER A VALID EVM WALLET.";

        return;

      }


      try {

        const data =
          await apiRequest({

            action: "check",

            wallet: wallet

          });


        // =========================================
        // CONNECTED
        // =========================================

        if (!data.localOnly) {

          result.textContent =
            data.ok

              ? `APPLICATION FOUND — STATUS: ${String(
                  data.status
                ).toUpperCase()}`

              : "NO APPLICATION FOUND FOR THIS WALLET.";

          return;

        }


        // =========================================
        // LOCAL FALLBACK
        // =========================================

        const found =
          submissions.find(
            s =>
              s.wallet.toLowerCase() ===
              wallet.toLowerCase()
          );


        result.textContent =
          found

            ? "APPLICATION FOUND — STATUS: PENDING"

            : "NO APPLICATION FOUND FOR THIS WALLET.";


      } catch (err) {

        console.error(err);

        result.textContent =
          "CHECKER SERVICE IS UNAVAILABLE.";

      }

    }
  );


// =====================================================
// INITIAL LEADERBOARD LOAD
// =====================================================

loadLeaderboard();


// =====================================================
// AUTOMATIC LEADERBOARD REFRESH
// =====================================================

// Check Google Sheets every 5 seconds.
setInterval(() => {

  loadLeaderboard();

}, 5000);


// =====================================================
// SMOOTH NAVIGATION
// =====================================================

document
  .querySelectorAll(
    'a[href^="#"]'
  )
  .forEach(a => {

    a.addEventListener(
      "click",
      e => {

        const el =
          document.querySelector(
            a.getAttribute("href")
          );


        if (el) {

          e.preventDefault();


          el.scrollIntoView({
            behavior: "smooth"
          });

        }

      }
    );

  });
