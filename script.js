/* DARK MODE */

function toggleDark(){
    document.body.classList.toggle("dark")
}


/* TYPING EFFECT */

const text = ["Developer","AI Enthusiast","Problem Solver","Project Builder"];
let i=0;
let j=0;
let currentText="";
let isDeleting=false;

function type(){
    currentText = text[i];
    const el = document.querySelector(".typing");
    if(el){
        el.textContent = currentText.substring(0,j);
    }

    if(!isDeleting && j < currentText.length){
        j++;
        setTimeout(type,100);
    }
    else if(isDeleting && j>0){
        j--;
        setTimeout(type,50);
    }
    else{
        isDeleting = !isDeleting;
        if(!isDeleting){
            i = (i+1) % text.length;
        }
        setTimeout(type,800);
    }
}
type();



/* ===== SCROLL EVENTS ===== */

const sections = document.querySelectorAll("section");
const navLinks = document.querySelectorAll(".nav-item");

window.addEventListener("scroll", ()=>{

    /* SCROLL REVEAL */
    sections.forEach(sec=>{
        let top = sec.getBoundingClientRect().top;
        if(top < window.innerHeight - 100){
            sec.classList.add("reveal","active");
        }
    });

    /* ACTIVE NAVBAR */
    let current = "";

    sections.forEach(section=>{
        const sectionTop = section.offsetTop - 150;

        if(window.scrollY >= sectionTop){
            current = section.getAttribute("id");
        }
    });

    navLinks.forEach(link=>{
        link.classList.remove("active");
        if(link.getAttribute("href") === "#" + current){
            link.classList.add("active");
        }
    });

});

document.querySelectorAll(".skill-fill").forEach(bar=>{
let barTop = bar.getBoundingClientRect().top;

if(barTop < window.innerHeight - 50){
bar.style.width = bar.dataset.width;
}
});

/* HAMBURGER MENU */

const hamburger = document.querySelector(".hamburger");
const navMenu = document.querySelector(".nav-links");



document.querySelectorAll(".nav-item").forEach(link=>{
link.addEventListener("click",()=>{
navMenu.classList.remove("active");
});
});


hamburger.addEventListener("click",()=>{
navMenu.classList.toggle("active");
document.body.classList.toggle("menu-open");

if(navMenu.classList.contains("active")){
hamburger.textContent="✕";
}else{
hamburger.textContent="☰";
}
});

window.addEventListener("DOMContentLoaded", function(){

const modal = document.getElementById("certModal");
const modalImg = document.getElementById("modalImg");
const closeModal = document.getElementById("closeModal");

document.querySelectorAll(".zoom-cert").forEach(function(img){

    img.addEventListener("click", function(){

        modal.style.display = "flex";
        modalImg.src = this.src;

    });

});

closeModal.addEventListener("click", function(){
    modal.style.display = "none";
});

modal.addEventListener("click", function(e){
    if(e.target !== modalImg){
        modal.style.display = "none";
    }
});

});