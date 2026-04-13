# EduAI Suite - Frontend

Welcome to the EduAI Suite Frontend. This project is built using a premium technical stack designed for scalability and high-impact visual design.

## 🚀 Getting Started

1.  **Install Dependencies**:
    ```bash
    npm install
    ```
2.  **Run Development Server**:
    ```bash
    npm run dev
    ```

## 🎨 Design System
- **Colors**: Deep Blue (#264796) and Regal Gold (#d0ae61).
- **Aesthetics**: Glassmorphism, smooth transitions, and premium typography.
- **Framework**: Tailwind CSS configured with custom brand tokens in `tailwind.config.js`.

## 📂 Folder Architecture
We follow a **Feature-Sliced Design (FSD)** lightweight pattern:
- `src/features`: Business logic (Auth, Exam Engine, Analytics, etc.)
- `src/shared`: Reusable UI components (GlassCard, Buttons) and utilities.
- `src/layouts`: Page wrappers (DashboardShell).

## 💡 Building in Antigravity
To continue building this project:
1.  **Feature Implementation**: Focus on one folder in `src/features` at a time.
2.  **Component Design**: Always use the `GlassCard` and `cn` utility for consistent aesthetics.
3.  **Real-time Logic**: Use the `src/services` folder for WebSocket integration.
