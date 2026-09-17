# ASH Help Portal

> A Flask-powered superhero help portal and emergency response channel for **Ash** — the small hero behind safer tomorrows.

The **ASH Help Portal** is an interactive web platform where citizens in need can reach out, submit help requests, explore Ash's origin story, interact with an AI-inspired hero chatbot, and send instant emergency signals to Ash and the emergency support team.

---

## 📁 Project Folder Architecture

Here is the complete folder and file breakdown of the codebase:

```text
pm internship/
├── database/                   # SQLite database storage directory
│   └── ash.db                  # Persistent SQLite database storing citizen help requests
├── static/                     # Web application static assets served by Flask
│   ├── css/                    # Stylesheet assets
│   │   └── style.css           # Design system, glassmorphism theme, responsiveness & animations
│   ├── images/                 # Optimized website photos and video loops
│   │   ├── 1.jpeg              # Heroic stance gallery image
│   │   ├── ash-hero-transparent.webm  # Transparent background hero video loop
│   │   ├── back.mp4            # Portal background loop video
│   │   ├── background1.jpeg    # "The Haven at Twilight" gallery media
│   │   ├── background2.jpeg    # "Mystic Horizon" gallery media
│   │   ├── city.mp4            # Metropolis video loop gallery asset
│   │   ├── diff.png            # Personality blueprint gallery image
│   │   ├── help.png            # Ash portrait image & avatar fallback
│   │   ├── hero.mp4            # Main superhero video loop (MP4 fallback)
│   │   ├── icon.mp4            # Animated signal badge & chatbot avatar loop
│   │   ├── icon.png            # Brand header logo image
│   │   └── logo.jpg            # Hero video poster image & portrait card
│   └── js/                     # Client-side JavaScript logic
│       └── chatbot.js          # Interactive chatbot widget & signal popup handler
├── templates/                  # Flask HTML5 templates
│   ├── index.html              # Main single-page superhero portal
│   └── success.html            # Help request submission confirmation page
├── utils/                      # Python backend helper modules
│   ├── database.py             # SQLite database initialization & request persistence logic
│   └── email_service.py        # Multi-channel notification delivery (SMTP & FormSubmit fallback)
├── .env                        # Environment variables configuration (ignored by git)
├── .gitignore                  # Git version control ignore rules
├── app.py                      # Main Flask application entry point & API route handlers
├── Procfile                    # Production WSGI process file for cloud deployments (Render/Heroku)
├── README.md                   # Project documentation & operational guide
├── render.yaml                 # Infrastructure as Code configuration for Render deployment
├── requirements.txt            # Python package dependencies
└── test_email.py               # Standalone test script for verifying email notification delivery
```

---

## 📂 Detailed Folder Breakdown

### 1. `database/`
* **[`database/ash.db`](file:///c:/Users/DEVIKA/OneDrive/Documents/Desktop/pm%20internship/database/ash.db)**: An SQLite database managed by [`utils/database.py`](file:///c:/Users/DEVIKA/OneDrive/Documents/Desktop/pm%20internship/utils/database.py). It automatically initializes the `help_requests` table with columns: `id`, `name`, `age`, `location`, `email`, `request`, and `submitted_at`.

### 2. `static/`
* **`static/css/`**: Contains [`style.css`](file:///c:/Users/DEVIKA/OneDrive/Documents/Desktop/pm%20internship/static/css/style.css), defining custom CSS design tokens (typography, HSL color palettes, dark glassmorphism, glowing backdrop overlays, keyframe animations, responsive grid layouts).
* **`static/images/`**: Contains all visual assets and background video loops used across the hero background, media gallery, modal triggers, and interactive elements.
* **`static/js/`**: Contains [`chatbot.js`](file:///c:/Users/DEVIKA/OneDrive/Documents/Desktop/pm%20internship/static/js/chatbot.js), which powers the floating superhero AI chatbot widget, preset question suggestions, signal popup modal, and asynchronous form submission (`/submit-help`).

### 3. `templates/`
* **[`templates/index.html`](file:///c:/Users/DEVIKA/OneDrive/Documents/Desktop/pm%20internship/templates/index.html)**: The main landing page. Features hero background video headers, origin story timeline, dynamic media gallery with modal preview, interactive signal request form, floating chatbot widget, and footer CTA.
* **[`templates/success.html`](file:///c:/Users/DEVIKA/OneDrive/Documents/Desktop/pm%20internship/templates/success.html)**: A confirmation page rendered upon successfully filing a help request signal.

### 4. `utils/`
* **[`utils/database.py`](file:///c:/Users/DEVIKA/OneDrive/Documents/Desktop/pm%20internship/utils/database.py)**: Handles database connections, table creation, schema migration safety, and database insert queries for incoming requests.
* **[`utils/email_service.py`](file:///c:/Users/DEVIKA/OneDrive/Documents/Desktop/pm%20internship/utils/email_service.py)**: Dual-mode notification pipeline. Attempts direct SMTP delivery via custom SMTP settings (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`) if configured; otherwise, falls back to the FormSubmit HTTP web gateway for reliable notification delivery.

---

## ⚡ API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Renders the main superhero portal ([`index.html`](file:///c:/Users/DEVIKA/OneDrive/Documents/Desktop/pm%20internship/templates/index.html)) |
| `GET` | `/health` | Health check endpoint returning JSON `{"ok": true, "service": "ash-help-portal"}` |
| `POST` | `/submit-help` | Accepts JSON payload (`name`, `age`, `location`, `email`, `request`), stores in database, sends email alert |
| `GET` | `/success` | Renders signal confirmation screen ([`success.html`](file:///c:/Users/DEVIKA/OneDrive/Documents/Desktop/pm%20internship/templates/success.html)) |

---

## ⚙️ Environment Configuration (`.env`)

Create a `.env` file in the root directory with the following environment variables:

```ini
PORT=5000
FLASK_DEBUG=1
NOTIFICATION_EMAIL=your-email@example.com

# Optional: Custom SMTP Server Configuration
SMTP_HOST=
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM=
SMTP_USE_TLS=true
```

---

## 🚀 Local Development Setup

### 1. Clone & Setup Environment

```powershell
# Create Python virtual environment
python -m venv .venv

# Activate virtual environment (Windows PowerShell)
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

### 2. Run the Application

```powershell
python app.py
```

Open your browser and navigate to `http://127.0.0.1:5000`.

---

## 🧪 Testing Email Notifications

To verify email notifications independently without filling out the web UI:

```powershell
python test_email.py
```

This script will test both SMTP delivery (if configured) and the FormSubmit fallback channel.

---

## ☁️ Production Deployment

This project is pre-configured for host platforms such as **Render**, **Railway**, or **Heroku**:

* **WSGI Server**: Uses `gunicorn` specified in `Procfile`:
  ```text
  web: gunicorn app:app
  ```
* **Render Spec**: Included in [`render.yaml`](file:///c:/Users/DEVIKA/OneDrive/Documents/Desktop/pm%20internship/render.yaml) for automated one-click deployments.
