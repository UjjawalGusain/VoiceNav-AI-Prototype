document.addEventListener("DOMContentLoaded", () => {

    // ---------- UTILITIES ----------
    const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const createButton = (text, parent) => {
        const btn = document.createElement("button");
        btn.textContent = text;
        btn.classList.add("dynamic-btn");
        parent.appendChild(btn);
        return btn;
    };

    const main = document.querySelector("main");
    if (!main) return; // safety for malformed pages

    // ---------- GLOBAL NAV DYNAMICS ----------
    const navLinks = document.querySelectorAll("nav a");
    if (navLinks.length) {
        setInterval(() => {
            navLinks.forEach(link => {
                link.style.transition = "transform 0.3s ease";
                link.style.transform = `rotate(${randomInt(-5, 5)}deg)`;
            });
        }, 2000);
    }

    // ---------- PAGE-SPECIFIC DYNAMICS ----------
    const page = window.location.pathname.split("/").pop().replace(".html", "");
    console.log(`Page: ${page}`);
    
    // ======= INDEX PAGE =======
    if (page === "" || page === "index") {
        const galleryImages = document.querySelectorAll(".gallery img");
        if (galleryImages.length) {
            setInterval(() => {
                galleryImages.forEach(img => {
                    img.style.position = "relative";
                    img.style.top = `${randomInt(-10, 10)}px`;
                    img.style.left = `${randomInt(-10, 10)}px`;
                });
            }, 3000);
        }

      const sections = document.querySelectorAll("main section");
setInterval(() => {
    sections.forEach(section => {
        if (Math.random() < 0.5) {
            const heading = section.querySelector("h2");
            if (heading) {
                heading.textContent = `Updated ${randomInt(1, 100)}`;
            }
        }
    });
}, 4000);


        setInterval(() => {
            const tempBtn = createButton("Temp Button", main);
            tempBtn.style.backgroundColor = `rgb(${randomInt(0,255)},${randomInt(0,255)},${randomInt(0,255)})`;
            setTimeout(() => tempBtn.remove(), 5000);
        }, 7000);

        // Shadow DOM simulation
        const shadowHost = document.createElement("div");
        shadowHost.id = "shadowHost";
        document.body.appendChild(shadowHost);
        const shadowRoot = shadowHost.attachShadow({ mode: "open" });
        const shadowBtn = document.createElement("button");
        shadowBtn.textContent = "Shadow Button";
        shadowRoot.appendChild(shadowBtn);
        setInterval(() => {
            shadowBtn.textContent = `Shadow Btn ${randomInt(1, 50)}`;
        }, 3000);
    }

    // ======= ABOUT PAGE =======
    if (page === "about") {
        const addMemberBtn = document.querySelector("#addMemberBtn");
        const newMemberInput = document.querySelector("#newMember");
        const teamList = document.querySelector("#teamList");

        if (addMemberBtn && newMemberInput && teamList) {
            addMemberBtn.addEventListener("click", () => {
                const name = newMemberInput.value.trim();
                if (name) {
                    const li = document.createElement("li");
                    li.textContent = name;
                    teamList.appendChild(li);
                    newMemberInput.value = "";
                }
            });
        }

        // Periodically shuffle team members
        setInterval(() => {
            const members = Array.from(teamList.querySelectorAll("li"));
            if (members.length > 1 && Math.random() < 0.5) {
                teamList.appendChild(members.shift());
            }
        }, 4000);
    }

    // ======= CONTACT PAGE =======
    if (page === "contact") {
        const contactForm = document.querySelector("#contactForm");
        const supportList = document.querySelector("#supportList");

        if (contactForm) {
            contactForm.addEventListener("submit", (e) => {
                e.preventDefault();
                const msg = document.createElement("p");
                msg.textContent = "Message sent successfully!";
                msg.style.color = "green";
                contactForm.appendChild(msg);
                setTimeout(() => msg.remove(), 3000);
            });
        }

        if (supportList) {
            const options = ["Chat", "Email", "Call", "Community Forum"];
            setInterval(() => {
                supportList.textContent = "";
                options.forEach(opt => {
                    if (Math.random() < 0.7) {
                        const p = document.createElement("p");
                        p.textContent = `${opt} Support Available`;
                        supportList.appendChild(p);
                    }
                });
            }, 5000);
        }
    }

    // ======= LOGIN PAGE =======
    if (page === "login") {
        const loginForm = document.querySelector("#loginForm");
        const loginStatus = document.querySelector("#loginStatus");
        const promoBanner = document.querySelector("#promoBanner");

        if (loginForm) {
            loginForm.addEventListener("submit", (e) => {
                e.preventDefault();
                const username = document.querySelector("#username").value;
                const password = document.querySelector("#password").value;
                if (username && password) {
                    loginStatus.textContent = `Welcome, ${username}!`;
                    loginStatus.style.color = "green";
                } else {
                    loginStatus.textContent = "Please enter valid credentials.";
                    loginStatus.style.color = "red";
                }
            });
        }

        // Random promo banners
        const promos = [
            "🔥 New AI VoiceNav Premium Available!",
            "⚡ Upgrade Now for Faster Navigation!",
            "🎯 Try VoiceNav on Mobile!"
        ];
        if (promoBanner) {
            setInterval(() => {
                promoBanner.textContent = promos[randomInt(0, promos.length - 1)];
            }, 4000);
        }
    }

});
