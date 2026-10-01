import { Navigate, Outlet, Route, Routes, HashRouter } from "react-router-dom";
import { AppProviders } from "@/components/providers/AppProviders";
import { isAuthenticated } from "@/lib/client-auth";
import HomePage from "@/app/page";
import AboutPage from "@/app/about/page";
import ContactsPage from "@/app/contacts/page";
import DailyIndicatorPage from "@/app/daily-indicator/page";
import DayPage from "@/app/day/page";
import ExpensesPage from "@/app/expenses/page";
import FocusPage from "@/app/focus/page";
import IndicatorsPage from "@/app/indicators/page";
import LoginPage from "@/app/login/page";
import MonthPage from "@/app/month/page";
import MonthlyIndicatorPage from "@/app/monthly-indicator/page";
import RegisterPage from "@/app/register/page";
import SavingsDebtsPage from "@/app/savings-debts/page";
import SettingsPage from "@/app/settings/page";
import WeekPage from "@/app/week/page";
import WeeklyIndicatorPage from "@/app/weekly-indicator/page";
import YearGoalsPage from "@/app/year-goals/page";

function RequireAuth() {
  return isAuthenticated() ? <Outlet /> : <Navigate replace to="/login" />;
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  return isAuthenticated() ? <Navigate replace to="/" /> : children;
}

export function App() {
  return (
    <AppProviders>
      <HashRouter>
        <Routes>
          <Route
            path="/login"
            element={<PublicOnly><LoginPage /></PublicOnly>}
          />
          <Route
            path="/register"
            element={<PublicOnly><RegisterPage /></PublicOnly>}
          />
          <Route element={<RequireAuth />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contacts" element={<ContactsPage />} />
            <Route path="/daily-indicator" element={<DailyIndicatorPage />} />
            <Route path="/dashboard" element={<Navigate replace to="/" />} />
            <Route path="/day" element={<DayPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/focus" element={<FocusPage />} />
            <Route path="/indicators" element={<IndicatorsPage />} />
            <Route path="/month" element={<MonthPage />} />
            <Route path="/monthly-indicator" element={<MonthlyIndicatorPage />} />
            <Route path="/savings-debts" element={<SavingsDebtsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/week" element={<WeekPage />} />
            <Route path="/weekly-indicator" element={<WeeklyIndicatorPage />} />
            <Route path="/year-goals" element={<YearGoalsPage />} />
          </Route>
          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </HashRouter>
    </AppProviders>
  );
}
