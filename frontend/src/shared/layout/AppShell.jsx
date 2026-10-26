import { useCallback, useState } from "react";
import Sidebar from "./Sidebar";
import BarraMovil from "./BarraMovil";

export default function AppShell({ children }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const cerrarMenu = useCallback(() => setMenuAbierto(false), []);
  const abrirMenu = useCallback(() => setMenuAbierto(true), []);

  return (
    <div className="flex min-h-dvh overflow-x-hidden bg-[#E5F2FF] font-sans text-slate-900">
      <Sidebar abierto={menuAbierto} alCerrar={cerrarMenu} />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="min-w-0 flex-1 overflow-x-hidden p-4 pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:p-6 md:pb-6">
          {children}
        </main>
      </div>
      <BarraMovil menuAbierto={menuAbierto} alAbrirMenu={abrirMenu} />
    </div>
  );
}
