import { createContext, useContext, useState } from "react";

export const ROLES = ["Administrador", "Custodio", "Auditor"];

const RoleContext = createContext(null);

export function RoleProvider({ children }) {
  const [role, setRole] = useState(ROLES[0]);
  return (
    <RoleContext.Provider value={{ role, setRole, roles: ROLES }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return ctx;
}
