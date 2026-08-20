import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";

// Pages — cargadas de forma lazy para mejor performance
import { lazy, Suspense } from "react";

const DashboardPage    = lazy(() => import("@/pages/DashboardPage"));
const PackagesPage     = lazy(() => import("@/pages/PackagesPage"));
const PackageFormPage  = lazy(() => import("@/pages/PackageFormPage"));
const TrailersPage     = lazy(() => import("@/pages/TrailersPage"));
const TrailerFormPage  = lazy(() => import("@/pages/TrailerFormPage"));
const LoadingPage      = lazy(() => import("@/pages/LoadingPage"));
const RoutesPage       = lazy(() => import("@/pages/RoutesPage"));
const RouteDetailPage  = lazy(() => import("@/pages/RouteDetailPage"));
const DriversPage      = lazy(() => import("@/pages/DriversPage"));
const ClientsPage      = lazy(() => import("@/pages/ClientsPage"));
const ReportsPage      = lazy(() => import("@/pages/ReportsPage"));
const OperationsPage   = lazy(() => import("@/pages/OperationsPage"));
const SettingsPage     = lazy(() => import("@/pages/SettingsPage"));

function PageLoader() {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-navy border-t-transparent" />
    </div>
  );
}

function withSuspense(Component: React.ComponentType) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Component />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard",          element: withSuspense(DashboardPage) },
      { path: "packages",           element: withSuspense(PackagesPage) },
      { path: "packages/new",       element: withSuspense(PackageFormPage) },
      { path: "packages/:id/edit",  element: withSuspense(PackageFormPage) },
      { path: "trailers",           element: withSuspense(TrailersPage) },
      { path: "trailers/new",       element: withSuspense(TrailerFormPage) },
      { path: "trailers/:id/edit",  element: withSuspense(TrailerFormPage) },
      { path: "loading/:trailerId", element: withSuspense(LoadingPage) },
      { path: "routes",             element: withSuspense(RoutesPage) },
      { path: "routes/:id",         element: withSuspense(RouteDetailPage) },
      { path: "drivers",            element: withSuspense(DriversPage) },
      { path: "clients",            element: withSuspense(ClientsPage) },
      { path: "reports",            element: withSuspense(ReportsPage) },
      { path: "operations",         element: withSuspense(OperationsPage) },
      { path: "settings",           element: withSuspense(SettingsPage) },
    ],
  },
]);
