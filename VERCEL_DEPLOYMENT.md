# NeuroSense-WSN v2: Vercel Live Deployment Guide

This repository is pre-configured for **zero-friction live deployment on [Vercel](https://vercel.com)** with full support for:
1. **Python Serverless API Functions** (`@vercel/python` runtime via `api/index.py`).
2. **High-Performance Static Edge Assets** (Three.js 3D Field, Voronoi Canvas, Chart.js benchmarks, and precomputed static JSON datasets).

---

## Deployment Options

### Method 1: 1-Click Import via Vercel Dashboard (Recommended)

1. **Push your code to GitHub / GitLab / Bitbucket**:
   ```bash
   git add .
   git commit -m "Configure Vercel live serverless deployment"
   git push origin main
   ```

2. **Open Vercel Dashboard**:
   - Go to [vercel.com/new](https://vercel.com/new) and log in.
   - Select your Git repository (`Energy-Efficient-WSN-Routing-main` or `NeuroSense-WSN`).

3. **Configure Project Settings**:
   - **Framework Preset**: Leave as `Other` (or default).
   - **Root Directory**: `./` (leave default).
   - **Build & Output Settings**: Handled automatically by `vercel.json`.
   - Click **Deploy**.

4. **Live URL**:
   - Vercel will build and assign a live URL (e.g., `https://neurosense-wsn.vercel.app`).

---

### Method 2: Deploy Using Vercel CLI

If you prefer using the command line:

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy to Preview / Development**:
   ```bash
   vercel
   ```
   *(Follow prompts: link existing project or create a new one)*

3. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

---

## Architecture on Vercel

```
├── api/
│   └── index.py            # Vercel Serverless Function entry point (Flask WSGI)
├── src/                    # Python core: WSN Simulation, ANN, PSO, Voronoi
├── static_data/            # Precomputed fallback JSON datasets
├── web/                    # Static Web Application
│   ├── css/style.css       # Laboratory HUD and Glassmorphism CSS
│   ├── js/                 # ES6 Frontend Modules (Three.js 3D, Chart.js, etc.)
│   ├── static_data/        # Mirrored static JSON cache
│   └── index.html          # Laboratory Dashboard
├── vercel.json             # Vercel Serverless Function and Edge Routing Rules
└── requirements.txt        # Python runtime dependencies
```

### Route Routing Summary

| Route Pattern | Destination | Description |
| :--- | :--- | :--- |
| `/` | `web/index.html` | Laboratory HUD & 3D Web Workbench |
| `/api/*` | `api/index.py` | Python Serverless Functions (Simulation, ANN, Benchmarks) |
| `/css/*` | `web/css/*` | Stylesheets & Glassmorphic themes |
| `/js/*` | `web/js/*` | Client ES6 Modules |
| `/static_data/*` | `static_data/*` | Offline & Edge Cached Datasets |

---

## Verification & Health Check

After deployment, you can verify your live endpoints:

- **Health Check**: `https://<your-vercel-domain>/api/health`
  ```json
  { "status": "ok", "service": "NeuroSense-WSN API", "version": "2.0.0" }
  ```
- **Live Scenarios**: `https://<your-vercel-domain>/api/scenarios`
- **ANN Model Metadata**: `https://<your-vercel-domain>/api/ann/model`
- **Web UI**: `https://<your-vercel-domain>/`
