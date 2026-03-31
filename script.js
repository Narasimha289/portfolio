/* DARK MODE */
function toggleDark() {
  document.body.classList.toggle("dark");
}

/* ===== SELECTORS ===== */
const sections = document.querySelectorAll("section");
const navLinks = document.querySelectorAll(".nav-item");
const hamburger = document.querySelector(".hamburger");
const navMenu = document.querySelector(".nav-links");

/* ===== SCROLL REVEAL + ACTIVE NAVBAR ===== */
window.addEventListener("scroll", () => {
  let current = "";

  sections.forEach((section) => {
    const top = section.getBoundingClientRect().top;

    if (top < window.innerHeight - 100) {
      section.classList.add("reveal", "active");
    }

    const sectionTop = section.offsetTop - 150;
    if (window.scrollY >= sectionTop) {
      current = section.getAttribute("id");
    }
  });

  navLinks.forEach((link) => {
    link.classList.remove("active");
    if (link.getAttribute("href") === "#" + current) {
      link.classList.add("active");
    }
  });
});

/* ===== SKILL BAR ANIMATION ===== */
function animateSkills() {
  document.querySelectorAll(".skill-fill").forEach((bar) => {
    const barTop = bar.getBoundingClientRect().top;

    if (barTop < window.innerHeight - 50) {
      bar.style.width = bar.dataset.width;
    }
  });
}

window.addEventListener("load", animateSkills);
window.addEventListener("scroll", animateSkills);

/* ===== HAMBURGER MENU ===== */
document.querySelectorAll(".nav-item").forEach((link) => {
  link.addEventListener("click", () => {
    navMenu.classList.remove("active");
    document.body.classList.remove("menu-open");
    hamburger.textContent = "☰";
  });
});

if (hamburger) {
  hamburger.addEventListener("click", () => {
    navMenu.classList.toggle("active");
    document.body.classList.toggle("menu-open");

    if (navMenu.classList.contains("active")) {
      hamburger.textContent = "✕";
    } else {
      hamburger.textContent = "☰";
    }
  });
}

/* ===== CERTIFICATE MODAL ===== */
window.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("certModal");
  const modalImg = document.getElementById("modalImg");
  const closeModal = document.getElementById("closeModal");

  if (modal && modalImg && closeModal) {
    document.querySelectorAll(".zoom-cert").forEach((img) => {
      img.addEventListener("click", () => {
        modal.style.display = "flex";
        modalImg.src = img.src;
      });
    });

    closeModal.addEventListener("click", () => {
      modal.style.display = "none";
    });

    modal.addEventListener("click", (e) => {
      if (e.target !== modalImg) {
        modal.style.display = "none";
      }
    });
  }
});

/* ===== CONTACT FORM ===== */
const contactForm = document.getElementById("contactForm");
const formMessage = document.getElementById("formMessage");
const submitBtn = document.getElementById("submitBtn");
const toast = document.getElementById("toast");
const loadingSpinner = document.getElementById("loadingSpinner");

function showFormMessage(message, type = "") {
  if (!formMessage) return;

  formMessage.textContent = message;
  formMessage.className = "form-message";

  if (type) {
    formMessage.classList.add(type);
  }
}

function showToast(message, isError = false) {
  if (!toast) return;

  toast.textContent = message;
  toast.style.background = isError ? "#e74c3c" : "#2ecc71";
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

if (contactForm) {
  contactForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = {
      name: document.getElementById("name").value.trim(),
      email: document.getElementById("email").value.trim(),
      subject: document.getElementById("subject").value.trim(),
      message: document.getElementById("message").value.trim(),
    };

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      showFormMessage("Please fill in all fields.", "error");
      showToast("Please fill in all fields.", true);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";
    showFormMessage("Sending your message...");

    if (loadingSpinner) {
      loadingSpinner.style.display = "block";
    }

    try {
      const response = await fetch("https://portfolio-backend-luer.onrender.com/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        showFormMessage(result.message || "Message sent successfully.", "success");
        showToast(result.message || "Message sent successfully.");
        contactForm.reset();

        setTimeout(() => {
          if (formMessage) {
            formMessage.textContent = "";
            formMessage.className = "form-message";
          }
        }, 3000);
      } else {
        showFormMessage(result.message || "Failed to send message.", "error");
        showToast(result.message || "Failed to send message.", true);
      }
    } catch (error) {
      showFormMessage("Server error. Please try again later.", "error");
      showToast("Server error. Please try again later.", true);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send Message";

      if (loadingSpinner) {
        loadingSpinner.style.display = "none";
      }
    }
  });
}

function scrollCertificates(direction) {
    const container = document.getElementById("certScroll");
    const scrollAmount = 350;

    container.scrollBy({
        left: direction * scrollAmount,
        behavior: "smooth"
    });
}