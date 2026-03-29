const loginBox = document.getElementById("loginBox");
const toolbar = document.getElementById("toolbar");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loadMessagesBtn = document.getElementById("loadMessagesBtn");
const searchInput = document.getElementById("searchInput");
const filterStatus = document.getElementById("filterStatus");
const statusMessage = document.getElementById("statusMessage");
const messagesContainer = document.getElementById("messagesContainer");
const totalCount = document.getElementById("totalCount");
const unreadCount = document.getElementById("unreadCount");
const emptyState = document.getElementById("emptyState");

// Change this after deployment
const API_BASE = "https://portfolio-backend-luer.onrender.com";

function getToken() {
  return localStorage.getItem("adminToken");
}

function setToken(token) {
  localStorage.setItem("adminToken", token);
}

function clearToken() {
  localStorage.removeItem("adminToken");
}

function setStatus(message, color = "#007bff") {
  statusMessage.textContent = message;
  statusMessage.style.color = color;
}

function updateStats(messages) {
  totalCount.textContent = messages.length;
  unreadCount.textContent = messages.filter((msg) => !msg.isRead).length;
}

function toggleEmptyState(messages) {
  if (messages.length === 0) {
    emptyState.style.display = "block";
  } else {
    emptyState.style.display = "none";
  }
}

function showDashboard() {
  loginBox.classList.add("hidden");
  toolbar.classList.remove("hidden");
}

function showLogin() {
  loginBox.classList.remove("hidden");
  toolbar.classList.add("hidden");
  messagesContainer.innerHTML = "";
  totalCount.textContent = "0";
  unreadCount.textContent = "0";
  emptyState.style.display = "none";
}

function handleUnauthorized(message = "Session expired. Please login again.") {
  clearToken();
  setStatus(message, "red");
  showLogin();
}

async function login() {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    setStatus("Please enter username and password.", "red");
    return;
  }

  setStatus("Logging in...", "#007bff");

  try {
    const response = await fetch(`${API_BASE}/api/admin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok) {
      setStatus(data.message || "Login failed.", "red");
      return;
    }

    setToken(data.token);
    setStatus("Login successful.", "green");
    showDashboard();
    passwordInput.value = "";
    await loadMessages();
  } catch (error) {
    setStatus("Server error during login.", "red");
  }
}

async function loadMessages() {
  const token = getToken();

  if (!token) {
    showLogin();
    return;
  }

  const search = searchInput.value.trim();
  const status = filterStatus.value;

  setStatus("Loading messages...", "#007bff");
  messagesContainer.innerHTML = "";
  emptyState.style.display = "none";

  try {
    const response = await fetch(
      `${API_BASE}/api/messages?search=${encodeURIComponent(search)}&status=${encodeURIComponent(status)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        handleUnauthorized(data.message || "Unauthorized access.");
        return;
      }

      setStatus(data.message || "Failed to load messages.", "red");
      updateStats([]);
      toggleEmptyState([]);
      return;
    }

    updateStats(data);
    toggleEmptyState(data);

    if (data.length === 0) {
      setStatus("No messages found.", "#666");
      return;
    }

    setStatus(`Loaded ${data.length} message(s).`, "green");

    data.forEach((msg) => {
      const card = document.createElement("div");
      card.className = `message-card ${msg.isRead ? "read" : "unread"}`;

      card.innerHTML = `
        <h3>${escapeHtml(msg.subject)}</h3>
        <p><strong>Name:</strong> ${escapeHtml(msg.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(msg.email)}</p>
        <p><strong>Message:</strong> ${escapeHtml(msg.message)}</p>
        <p class="message-status">
          <strong>Status:</strong>
          <span class="status-badge ${msg.isRead ? "read" : "unread"}">
            ${msg.isRead ? "Read" : "Unread"}
          </span>
        </p>
        <p class="message-date"><strong>Received:</strong> ${new Date(msg.createdAt).toLocaleString()}</p>
        <div class="card-actions">
          <button class="${msg.isRead ? "unread-btn" : "read-btn"}" data-id="${msg._id}" data-read="${msg.isRead}">
            ${msg.isRead ? "Mark as Unread" : "Mark as Read"}
          </button>
          <button class="delete-btn" data-id="${msg._id}">Delete</button>
        </div>
      `;

      messagesContainer.appendChild(card);
    });

    attachActionEvents();
  } catch (error) {
    setStatus("Server error. Could not fetch messages.", "red");
    updateStats([]);
    toggleEmptyState([]);
  }
}

function attachActionEvents() {
  const readButtons = document.querySelectorAll(".read-btn, .unread-btn");
  const deleteButtons = document.querySelectorAll(".delete-btn");

  readButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const token = getToken();
      const id = button.getAttribute("data-id");
      const currentRead = button.getAttribute("data-read") === "true";

      try {
        const response = await fetch(`${API_BASE}/api/messages/${id}/read`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ isRead: !currentRead })
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            handleUnauthorized(data.message || "Unauthorized access.");
            return;
          }

          alert(data.message || "Failed to update message.");
          return;
        }

        await loadMessages();
      } catch (error) {
        alert("Server error while updating message.");
      }
    });
  });

  deleteButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const token = getToken();
      const id = button.getAttribute("data-id");

      const confirmed = confirm("Are you sure you want to delete this message?");
      if (!confirmed) return;

      try {
        const response = await fetch(`${API_BASE}/api/messages/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            handleUnauthorized(data.message || "Unauthorized access.");
            return;
          }

          alert(data.message || "Failed to delete message.");
          return;
        }

        await loadMessages();
      } catch (error) {
        alert("Server error while deleting message.");
      }
    });
  });
}

function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

loginBtn.addEventListener("click", login);

logoutBtn.addEventListener("click", () => {
  clearToken();
  setStatus("Logged out successfully.", "green");
  showLogin();
});

loadMessagesBtn.addEventListener("click", loadMessages);
searchInput.addEventListener("input", loadMessages);
filterStatus.addEventListener("change", loadMessages);

passwordInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    login();
  }
});

if (getToken()) {
  showDashboard();
  loadMessages();
} else {
  showLogin();
}
