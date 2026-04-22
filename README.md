# 🔧 Texas Plumbing Prep

**Theoretical Exam Simulator for the Texas Tradesman Plumbing License**

A free, independent practice-exam tool designed to help aspiring plumbers prepare for the theoretical portion of the **Texas Tradesman Plumber-Limited Examination**.

🌐 **Live site:** [olivergranja.github.io/tradesman-plumbing-exam](https://olivergranja.github.io/tradesman-plumbing-exam/)

---

## ✨ Features

- 🎯 **3 unique exam versions** — each with 80 questions, covering all 10 official topics
- ⚠️ **5 trap questions per exam** — designed to test attention to detail
- ⏱️ **5-minute timed simulator** with color-coded progress bar
- ✅ **Instant feedback** after each answer with full explanations
- 📊 **Detailed results** — correct, incorrect, skipped, and points breakdown
- 🔄 **Smart answer shuffling** — no 3-in-a-row same-letter answers
- 🌓 **Light & dark modes** with automatic system detection
- 📱 **Fully responsive** — works on phones, tablets, and desktops
- 🔒 **No tracking, no accounts, no cookies** — 100% privacy-friendly
- 💾 **Works offline** once loaded (static site)

---

## 📚 Topics Covered

Each exam version covers the complete theoretical syllabus:

1. Definitions
2. General Regulations
3. Fixtures
4. Water Supply & Distribution
5. Sanitary Drainage
6. Vents
7. Traps
8. Fuel Gas
9. Water Heaters
10. License Law

---

## ⚠️ Important Disclaimer

This website is an **independent practice tool** and is **NOT affiliated with, endorsed by, or connected to the Texas State Board of Plumbing Examiners (TSBPE)** or any state agency.

It does **NOT replace** the official training required by law to qualify for the Tradesman Plumber-Limited Examination. Applicants must complete **24 hours of classroom training** through a TSBPE-approved course provider before taking the official exam.

For authoritative and current information, visit: [tsbpe.texas.gov](https://tsbpe.texas.gov)

---

## 🛠️ Tech Stack

- **HTML5** — semantic structure
- **CSS3** — custom properties for theming, flexbox/grid layouts, animations
- **Vanilla JavaScript (ES6+)** — no frameworks, no build step
- **Google Fonts** — Bebas Neue, DM Sans, DM Mono

---

## 📁 Project Structure

```
tradesman-plumbing-exam/
├── index.html              # Main HTML structure
├── css/
│   └── styles.css          # Theme variables, layouts, responsive rules
├── js/
│   ├── questions.js        # Question bank + topic distribution
│   ├── exam.js             # Exam engine (timer, rendering, results)
│   └── theme.js            # Light/dark mode toggle
├── assets/
│   └── logo.jpg            # Site emblem (Texas + plumbing theme)
└── README.md
```

---

## 🚀 Running Locally

No build tools needed — it's a static site.

```bash
# Clone the repo
git clone https://github.com/olivergranja/tradesman-plumbing-exam.git
cd tradesman-plumbing-exam

# Open directly in your browser
open index.html

# Or serve with any local web server, e.g.:
python3 -m http.server 8000
# Then visit http://localhost:8000
```

---

## 📧 Contact

Questions, suggestions, or found an error in a question?

📧 **texasplumbingprep@gmail.com**

---

## 💛 Support

If this practice exam helps you prepare for your Tradesman license, consider supporting the project:

🅿️ [paypal.me/OliverGranja](https://paypal.me/OliverGranja)

---

## 📄 License

© 2025 **Oliver Granja – ViscaCode**. All rights reserved.

All original content (questions, explanations, design) is copyrighted.
Referenced code names (IRC, UPC) belong to their respective organizations.

---

## 🙋 About the Author

I'm Oliver Granja, a candidate pursuing my Tradesman Plumber-Limited License in Texas. I built this practice exam as a tool to help myself study — and to share it with other aspiring plumbers who want to pass their theoretical exam on the first try.

**ViscaCode** is my personal brand for the projects I build while learning to code.
