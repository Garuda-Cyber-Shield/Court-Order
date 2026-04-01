# Garuda Cyber Shield - Facebook Post Removal Court Order Generator

![Garuda Cyber Shield Project](https://img.shields.io/badge/Project_Owner-Garuda_Cyber_Shield-111827?style=for-the-badge)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS_4-38B2AC?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge)

A professional, fully-responsive legal document generation tool developed exclusively by Garuda Cyber Shield. This enterprise-grade dashboard allows authorized officers to dynamically and securely generate highly detailed Facebook Content Removal Court Orders modeled accurately for 10 separate nations.

## Core Features
- 10-Country Localization System: Accurately rendered emblems, government titles, departments, seals, and native legal directives for Bangladesh, India, Bhutan, Nepal, Kuwait, Saudi Arabia, Dubai/UAE, Oman, Qatar, and Maldives.
- Fluid Responsive Architecture: Seamlessly interact with and preview entire A4-sized documents on narrow mobile screens utilizing fluid layout down-scaling mechanisms.
- Automatic Signatures & Seals: Injects automated typography styling mapping localized authorizations along with transparent national vector seals perfectly aligned across pages.
- Secure QR Code Hashing: Every generated document is stamped with a robust deterministic verification hash algorithm and embedded instantly inside a live scan-ready SVG QR Code.
- Vector A4 PDF Export: Bypasses destructive canvas screenshot systems by interfacing safely with native Web Browser print APIs to push pixel-perfect mathematical vectors straight into flawless A4 PDF format.

## Technology Stack
- Framework: React 19 (Vite)
- Language: TypeScript
- Styling Pipeline: Tailwind CSS v4 
- Primary Utilities: react-qr-code, html-to-pdf.js

---

## Installation & Getting Started

### Prerequisites
Ensure the following are installed on your local machine:
- Node.js (v18.x or higher is recommended)
- npm or yarn package managers

### 1. Clone & Access the Repository
Since this is an internal Garuda Cyber Shield resource, ensure you have properly pulled the repository to your local operating system.
```bash
git clone <repository_url>
cd facebook-post-removal-code-CH4RM
```

### 2. Install Project Dependencies
Run the following package install script to inject all React and Tailwind resources required by the application as outlined in package.json.
```bash
npm install
```

### 3. Start the Development Environment
Run the lightweight Vite local development backend proxy server:
```bash
npm run dev
```

The terminal will return a local URL (usually http://localhost:5173). Open this URL in any modern browser to begin interacting with the tool immediately.

### 4. Build for Production Environment
To lock the application state into a single-file distributable or optimized static build, execute the following script:
```bash
npm run build
```
This packages all components, fonts, logic, and SVG dependencies into the /dist pipeline securely.

---

## License & Copyright
Copyright 2026 Garuda Cyber Shield. All Rights Reserved. 

This internal project strictly remains proprietary property of Garuda Cyber Shield. Unauthorized duplication, modification, implementation, or distribution is entirely prohibited.
