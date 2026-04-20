import React from "react";
import { createBrowserRouter } from "react-router-dom";
import { StudentShell } from "../layouts/StudentShell";
import { StudentDashboard } from "../features/dashboard/StudentDashboard";
import { StudentClassrooms } from "../features/classroom/StudentClassrooms";
import { StudentExams } from "../features/exam/StudentExams";
import { AuthPage } from "../features/auth/AuthPage";
import { GamesPage } from "../features/games/GamesPage";
import { ChainAnswerGamePage } from "../features/games/ChainAnswerGamePage";
import { AppointmentBookingPage } from "../features/appointments/AppointmentBookingPage";
import { ConstructionPage } from "../shared/components/ConstructionPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <AuthPage />,
  },
  {
    path: "/",
    element: <StudentShell />,
    children: [
      { index: true, element: <StudentDashboard /> },
      { path: "classroom", element: <StudentClassrooms /> },
      { path: "exams", element: <StudentExams /> },
      { path: "games", element: <GamesPage /> },
      { path: "games/chain-answer", element: <ChainAnswerGamePage /> },
      { path: "appointments", element: <AppointmentBookingPage /> },
      { path: "*", element: <ConstructionPage /> },
    ],
  },
  {
    path: "*",
    element: <ConstructionPage />,
  },
]);
