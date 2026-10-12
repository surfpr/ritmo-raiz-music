import { AdminGuard } from "@/components/AdminGuard";
import { Layout } from "@/components/Layout";
import { CartProvider } from "@/contexts/CartContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import AdminPage from "@/pages/AdminPage";
import CustomMusicPage from "@/pages/CustomMusicPage";
import DashboardPage from "@/pages/DashboardPage";
import LandingPage from "@/pages/LandingPage";
import PoliciesPage from "@/pages/PoliciesPage";
import StorePage from "@/pages/StorePage";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Toaster } from "sonner";

const rootRoute = createRootRoute({
  component: () => (
    <LanguageProvider>
      <CartProvider>
        <Layout>
          <Outlet />
        </Layout>
        <Toaster position="bottom-right" richColors />
      </CartProvider>
    </LanguageProvider>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
});

const storeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/store",
  component: StorePage,
});

const customMusicRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/custom-music",
  component: CustomMusicPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: () => (
    <AdminGuard>
      <AdminPage />
    </AdminGuard>
  ),
});

const policiesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/policies",
  component: PoliciesPage,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: DashboardPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  storeRoute,
  customMusicRoute,
  adminRoute,
  policiesRoute,
  dashboardRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
