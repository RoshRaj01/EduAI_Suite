import { createBrowserRouter } from "react-router-dom";
import { DashboardShell } from "../layouts/DashboardShell";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { ClassroomsPage } from "../features/classroom/ClassroomsPage";
import { ExamsPage } from "../features/exam/ExamsPage";
import { AnalyticsPage } from "../features/analytics/AnalyticsPage";
import { WellbeingPage } from "../features/wellbeing/WellbeingPage";
import { AIChatPage } from "../features/ai-chat/AIChatPage";
import { AuthPage } from "../features/auth/AuthPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <AuthPage />,
  },
  {
    path: "/",
    element: <DashboardShell />,
    children: [
      { index: true,            element: <DashboardPage />   },
      { path: "classroom",      element: <ClassroomsPage />  },
      { path: "exams",          element: <ExamsPage />       },
      { path: "analytics",      element: <AnalyticsPage />   },
      { path: "wellbeing",      element: <WellbeingPage />   },
      { path: "chat",           element: <AIChatPage />      },
    ],
  },
]);
