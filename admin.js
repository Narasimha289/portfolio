const API_BASE = "https://portfolio-backend-luer.onrender.com";

const loginBox = document.getElementById("loginBox");
const toolbar = document.getElementById("toolbar");
const messagesContainer = document.getElementById("messagesContainer");
const statusMessage = document.getElementById("statusMessage");
const emptyState = document.getElementById("emptyState");

const totalCountEl = document.getElementById("totalCount");
const unreadCountEl = document.getElementById("unreadCount");

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const searchInput = document.getElementById("searchInput");
const filterStatus = document.getElementById("filterStatus");

let token = localStorage.getItem("adminToken") || "";

/* ===== LOGIN ===== */
loginBtn.addEventListener("click", async () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    alert("Enter username and password");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/admin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (res.ok) {
      token = data.token;
      localStorage.setItem("adminToken", token);
      showDashboard();
    } else {
      alert(data.message || "Login failed");
    }
  } catch {
    alert("Server error");
  }
});

/* ===== LOGOUT ===== */
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("adminToken");
  location.reload();
});

/* ===== SHOW DASHBOARD ===== */
function showDashboard() {
  loginBox.style.display = "none";
  toolbar.classList.remove("hidden");
  loadMessages();
}

/* ===== LOAD MESSAGES ===== */
async function loadMessages() {
  messagesContainer.innerHTML = "";
  statusMessage.textContent = "Loading...";

  try {
    const res = await fetch(`${API_BASE}/api/messages`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!res.ok) {
      statusMessage.textContent = "Failed to load messages";
      return;
    }

    renderMessages(data);
  } catch {
    statusMessage.textContent = "Server error";
  }
}

/* ===== RENDER MESSAGES ===== */
function renderMessages(messages) {
  messagesContainer.innerHTML = "";

  // ===== FILTER + SEARCH =====
  const searchText = searchInput.value.toLowerCase();
  const statusFilter = filterStatus.value;

  const filtered = messages.filter((msg) => {
    const matchSearch =
      msg.name.toLowerCase().includes(searchText) ||
      msg.email.toLowerCase().includes(searchText) ||
      msg.subject.toLowerCase().includes(searchText) ||
      msg.message.toLowerCase().includes(searchText);

    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "read" && msg.isRead) ||
      (statusFilter === "unread" && !msg.isRead);

    return matchSearch && matchStatus;
  });

  // ===== STATS =====
  totalCountEl.textContent = messages.length;
  unreadCountEl.textContent = messages.filter(m => !m.isRead).length;

  // ===== EMPTY STATE =====
  if (filtered.length === 0) {
    emptyState.style.display = "block";
    statusMessage.textContent = "";
    return;
  } else {
    emptyState.style.display = "none";
  }

  statusMessage.textContent = "";

  // ===== RENDER CARDS =====
  filtered.forEach((msg) => {
    const card = document.createElement("div");
    card.className = "message-card";

    card.innerHTML = `
      <h3>${msg.subject}</h3>
      <p><strong>Name:</strong> ${msg.name}</p>
      <p><strong>Email:</strong> ${msg.email}</p>
      <p><strong>Message:</strong> ${msg.message}</p>
      
      <p class="status-badge ${msg.isRead ? "read" : "unread"}">
        ${msg.isRead ? "Read" : "Unread"}
      </p>

      <p class="message-date">
        ${new Date(msg.createdAt).toLocaleString()}
      </p>

      <div class="actions">
        <button class="read-btn" data-id="${msg._id}" data-read="${msg.isRead}">
          ${msg.isRead ? "Mark Unread" : "Mark Read"}
        </button>

        <button class="delete-btn" data-id="${msg._id}">
          Delete
        </button>
      </div>
    `;

    messagesContainer.appendChild(card);
  });

  attachActions();
}

/* ===== ACTIONS ===== */
function attachActions() {
  document.querySelectorAll(".read-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const current = btn.dataset.read === "true";

      await fetch(`${API_BASE}/api/messages/${id}/read`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isRead: !current })
      });

      loadMessages();
    });
  });

  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;

      // ✅ CONFIRMATION (NEW FEATURE)
      if (!confirm("Are you sure you want to delete this message?")) return;

      await fetch(`${API_BASE}/api/messages/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      loadMessages();
    });
  });
}

/* ===== FILTER EVENTS ===== */
searchInput.addEventListener("input", loadMessages);
filterStatus.addEventListener("change", loadMessages);
document.getElementById("loadMessagesBtn").addEventListener("click", loadMessages);

/* ===== AUTO LOGIN ===== */
if (token) {
  showDashboard();
}