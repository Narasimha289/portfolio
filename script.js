/* DARK MODE */

function toggleDark(){
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

    sections.forEach(section => {
        const top = section.getBoundingClientRect().top;

        if (top < window.innerHeight - 100) {
            section.classList.add("reveal", "active");
        }

        const sectionTop = section.offsetTop - 150;
        if (window.scrollY >= sectionTop) {
            current = section.getAttribute("id");
        }
    });

    navLinks.forEach(link => {
        link.classList.remove("active");
        if (link.getAttribute("href") === "#" + current) {
            link.classList.add("active");
        }
    });

});


/* ===== SKILL BAR ANIMATION ===== */

function animateSkills(){
    document.querySelectorAll(".skill-fill").forEach(bar => {
        const barTop = bar.getBoundingClientRect().top;

        if (barTop < window.innerHeight - 50) {
            bar.style.width = bar.dataset.width;
        }
    });
}

window.addEventListener("load", animateSkills);
window.addEventListener("scroll", animateSkills);


/* ===== HAMBURGER MENU ===== */

document.querySelectorAll(".nav-item").forEach(link => {
    link.addEventListener("click", () => {
        navMenu.classList.remove("active");
        document.body.classList.remove("menu-open");
        hamburger.textContent = "☰";
    });
});

hamburger.addEventListener("click", () => {
    navMenu.classList.toggle("active");
    document.body.classList.toggle("menu-open");

    if (navMenu.classList.contains("active")) {
        hamburger.textContent = "✕";
    } else {
        hamburger.textContent = "☰";
    }
});


/* ===== CERTIFICATE MODAL ===== */

window.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("certModal");
    const modalImg = document.getElementById("modalImg");
    const closeModal = document.getElementById("closeModal");

    document.querySelectorAll(".zoom-cert").forEach(img => {
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
});