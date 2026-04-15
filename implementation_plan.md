# TeacherBuddy Simple Navigation Layout Redesign

This implementation plan outlines the redesign of the TeacherBuddy UI to match the simplicity and ease of use found in Google Classroom. Our goal is to declutter the persistent navigation and make the app more approachable for teachers, while preserving the existing theme colors, dark/light mode toggle, and the Christ University branding.

## User Review Required

> [!WARNING]
> Please review this plan before we begin execution. We are proposing a major layout change from an always-visible, glassmorphic sidebar to a cleaner Top App Bar with a collapsible hamburger menu (Drawer), exactly like Google Classroom.

## Proposed Changes

---

### DashboardShell Layout

We will transform `apps/teacherbuddy/src/layouts/DashboardShell.tsx` to use a top-heavy layout pattern.

#### [MODIFY] [DashboardShell.tsx](file:///c:/Users/Omkaar/Desktop/Projects/EduAI_Suite/apps/teacherbuddy/src/layouts/DashboardShell.tsx)

- **Top Navigation Bar:** 
  - Add a sticky top bar that contains a Hamburger Menu button, the current Logo, and the App Name.
  - Move the Global Search into the center of the top bar.
  - Move Theme (Light/Dark mode) switch, Notification Bell, and Teacher Profile Avatar to the right side of the top bar.
- **Collapsible Slide-out Drawer:**
  - Convert the existing fixed sidebar into a collapsible drawer.
  - It will be hidden by default on smaller screens or can be toggled open/closed by the Hamburger Menu. 
  - The drawer will list all 11 existing navigation items (Dashboard, Teacher Tools, Game Studio, Classrooms, Bulk Evaluation, Reports, etc.) in a flat, clean, vertical list.
  - We will remove the heavy gradients from the sidebar to give it a clean, Google Classroom-esque solid background (respecting dark/light mode surface colors).
- **Theme & Branding:**
  - Maintain the Christ University gold and blue colors derived from `logo (5).png`.
  - Maintain the `useTheme` hook implementation.

## Open Questions

> [!IMPORTANT]
> 1. Do you prefer the sidebar drawer to be hidden completely until the hamburger menu is clicked, or always visible on very large screens (like a standard drawer pattern)?
> 2. Are there any specific navigation links from the 11 items that you want to prioritize or place prominently directly on the top app bar?

## Verification Plan

### Automated Tests
- Build verification: Run `npm run build` in the `teacherbuddy` app to verify no typing errors are introduced.

### Manual Verification
- Launch the `teacherbuddy` development server.
- Verify that the layout resembles Google Classroom's clean Top Bar and Drawer style.
- Toggle the hamburger menu open and closed. 
- Try searching and opening the profile dropdown.
- Test the Light/Dark mode toggle to ensure the UI surfaces correctly adapt while maintaining the brand colors.
