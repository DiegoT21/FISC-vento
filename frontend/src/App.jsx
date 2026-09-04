import { Outlet } from "react-router-dom";
import AppShell from "./shared/layout/AppShell";
import { RoleProvider } from "./shared/hooks/useRole";

export default function App() {
  return (
    <RoleProvider>
      <AppShell>
        <Outlet />
      </AppShell>
    </RoleProvider>
  );
}
