import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import { LogIn, Music } from "lucide-react";
import type { ReactNode } from "react";

function AdminLoginButton() {
  const { login } = useInternetIdentity();
  return (
    <Button
      type="button"
      className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
      onClick={() => login()}
      data-ocid="admin_guard.login_button"
    >
      <LogIn size={16} />
      Iniciar sesión / Sign in
    </Button>
  );
}

export function AdminGuard({ children }: { children: ReactNode }) {
  const { loginStatus } = useInternetIdentity();

  if (loginStatus === "initializing") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    );
  }

  if (loginStatus !== "success") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="bg-card border border-border rounded-2xl p-10 flex flex-col items-center gap-6 w-full max-w-sm shadow-lg">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Music size={32} className="text-primary" />
          </div>
          <div className="text-center space-y-1">
            <h1 className="font-display text-2xl font-bold text-foreground">
              Panel de Administración
            </h1>
            <p className="text-muted-foreground text-sm">
              Inicia sesión con Internet Identity para continuar
            </p>
          </div>
          <AdminLoginButton />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
