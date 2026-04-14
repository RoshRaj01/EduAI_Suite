import { createBrowserRouter } from "react-router-dom";
import { DashboardShell } from "../layouts/DashboardShell";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { EvaluationPage } from "../features/evaluation/EvaluationPage";
import { ReportsPage } from "../features/reports/ReportsPage";
import { FormsPage } from "../features/forms/FormsPage";
import { AnalyticsPage } from "../features/analytics/AnalyticsPage";
import { WellbeingPage } from "../features/wellbeing/WellbeingPage";
import { AIChatPage } from "../features/ai-chat/AIChatPage";
import { AuthPage } from "../features/auth/AuthPage";
import { GamesPage } from "../features/games/GamesPage";
import { TeacherToolsPage } from "../features/tools/TeacherToolsPage";

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
      { path: "evaluation",     element: <EvaluationPage />  },
      { path: "reports",        element: <ReportsPage />     },
      { path: "forms",          element: <FormsPage />       },
      { path: "games",          element: <GamesPage />       },
      { path: "tools",          element: <TeacherToolsPage />},
      { path: "analytics",      element: <AnalyticsPage />   },
      { path: "wellbeing",      element: <WellbeingPage />   },
      { path: "chat",           element: <AIChatPage />      },
    ],
  },
]);
