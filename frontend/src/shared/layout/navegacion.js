import {
  LayoutDashboard, Boxes, MapPin, HandCoins, ArrowLeftRight, ScrollText,
  Users, ScanLine, BarChart3,
} from "lucide-react";

export const NAV = [
  { path: "/dashboard", label: "Panel principal", icon: LayoutDashboard, roles: ["Administrador", "Custodio", "Auditor"] },
  { path: "/dashboard/activos", label: "Activos", icon: Boxes, roles: ["Administrador", "Custodio", "Auditor"] },
  { path: "/dashboard/escaneo", label: "Escaneo Barras / RFID", icon: ScanLine, roles: ["Administrador", "Custodio", "Auditor"] },
  { path: "/dashboard/ubicaciones", label: "Ubicaciones", icon: MapPin, roles: ["Administrador", "Auditor"] },
  { path: "/dashboard/reportes", label: "Reportes", icon: BarChart3, roles: ["Administrador", "Auditor"] },
  { path: "/dashboard/prestamos", label: "Préstamos", icon: HandCoins, roles: ["Administrador", "Custodio", "Auditor"] },
  { path: "/dashboard/traslados", label: "Traslados", icon: ArrowLeftRight, roles: ["Administrador", "Custodio"] },
  { path: "/dashboard/auditoria", label: "Auditoría", icon: ScrollText, roles: ["Administrador", "Auditor"] },
  { path: "/dashboard/administracion", label: "Administración", icon: Users, roles: ["Administrador"] },
];
