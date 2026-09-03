import { useState } from "react";
import {
  LayoutDashboard, Boxes, MapPin, HandCoins, ArrowLeftRight, ScrollText,
  Users, ScanLine, Search, ChevronLeft, Paperclip, X, Check, Clock,
  AlertTriangle, QrCode, Radio
} from "lucide-react";

const ROLES = ["Administrador", "Custodio", "Auditor"];

const NAV = [
  { id: "dashboard", label: "Panel principal", icon: LayoutDashboard, roles: ["Administrador", "Custodio", "Auditor"] },
  { id: "activos", label: "Activos", icon: Boxes, roles: ["Administrador", "Custodio", "Auditor"] },
  { id: "escaneo", label: "Escaneo QR / RFID", icon: ScanLine, roles: ["Administrador", "Custodio", "Auditor"] },
  { id: "ubicaciones", label: "Ubicaciones", icon: MapPin, roles: ["Administrador", "Auditor"] },
  { id: "prestamos", label: "Préstamos", icon: HandCoins, roles: ["Administrador", "Custodio", "Auditor"] },
  { id: "traslados", label: "Traslados", icon: ArrowLeftRight, roles: ["Administrador", "Custodio"] },
  { id: "auditoria", label: "Auditoría", icon: ScrollText, roles: ["Administrador", "Auditor"] },
  { id: "administracion", label: "Administración", icon: Users, roles: ["Administrador"] },
];

const ACTIVOS = [
  { id: 1, ref: "REF-00842", servitac: "SVT-118423", desc: "CPU Dell OptiPlex 3080", categoria: "Equipo", origen: "Comprado", estatus: "EXISTE", estado: "EN USO", ubicacion: "Lab. 3-407" },
  { id: 2, ref: "REF-00843", servitac: "SVT-118424", desc: "Monitor LG 22'", categoria: "Equipo", origen: "Comprado", estatus: "EXISTE", estado: "EN USO", ubicacion: "Lab. 3-407" },
  { id: 3, ref: "REF-01190", servitac: "SVT-119887", desc: "Switch TP-Link 24p", categoria: "Equipo", origen: "Donado", estatus: "EXISTE", estado: "DAÑADO", ubicacion: "Cuarto de Redes" },
  { id: 4, ref: "REF-02201", servitac: "SVT-120410", desc: "Silla ejecutiva", categoria: "Mobiliario", origen: "Comprado", estatus: "EXISTE", estado: "EN USO", ubicacion: "Oficina 17" },
  { id: 5, ref: "REF-02350", servitac: "SVT-120990", desc: "Proyector Epson X400", categoria: "Equipo", origen: "Comprado", estatus: "ADICIONAR", estado: "EN USO", ubicacion: "Aula 5-201" },
  { id: 6, ref: "REF-02411", servitac: "SVT-121055", desc: "Router Cisco 2900", categoria: "Equipo", origen: "Donado", estatus: "EXTRAVIADO", estado: "DAÑADO", ubicacion: "Sin ubicar" },
];

const PRESTAMOS = [
  { id: 1, activo: "Proyector Epson X400", persona: "Ana Batista", fecha: "12 ago 2026", estado: "Activo" },
  { id: 2, activo: "Laptop Dell Latitude", persona: "Carlos Ríos", fecha: "02 ago 2026", estado: "Devuelto" },
];

const TRASLADOS = [
  { id: 1, activo: "CPU Dell OptiPlex 3080", origen: "Lab. 3-407", destino: "Lab. 3-410", estado: "Pendiente" },
  { id: 2, activo: "Switch TP-Link 24p", origen: "Cuarto de Redes", destino: "Depto. de TI", estado: "Autorizado" },
];

const LOGS = [
  { id: 1, usuario: "lsaucedo", accion: "Actualizó estado", tabla: "ACTIVO", fecha: "27 ago 2026, 4:12 pm" },
  { id: 2, usuario: "dtorres", accion: "Creó solicitud", tabla: "TRASLADO_SOLICITUD", fecha: "27 ago 2026, 2:03 pm" },
  { id: 3, usuario: "auditor1", accion: "Consultó reporte", tabla: "ACTIVO", fecha: "26 ago 2026, 11:47 am" },
];

const USUARIOS = [
  { id: 1, nombre: "Laura Saucedo", usuario: "lsaucedo", rol: "Administrador" },
  { id: 2, nombre: "Diego Torres", usuario: "dtorres", rol: "Custodio" },
  { id: 3, nombre: "Personal Bienes Patrimoniales", usuario: "auditor1", rol: "Auditor" },
];

function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-gray-100 text-gray-700",
    good: "bg-emerald-50 text-emerald-700",
    warn: "bg-amber-50 text-amber-700",
    bad: "bg-red-50 text-red-700",
    info: "bg-sky-50 text-sky-700",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

function estadoTone(estado) {
  if (estado === "EN USO") return "good";
  if (estado === "DAÑADO") return "bad";
  return "neutral";
}
function estatusTone(estatus) {
  if (estatus === "EXISTE") return "good";
  if (estatus === "ADICIONAR") return "info";
  if (estatus === "EXTRAVIADO" || estatus === "NO EXISTE") return "bad";
  return "neutral";
}

function StatCard({ label, value, tone }) {
  const tones = {
    neutral: "border-gray-200",
    warn: "border-amber-200",
    bad: "border-red-200",
    good: "border-emerald-200",
  };
  return (
    <div className={`bg-white rounded-lg border ${tones[tone || "neutral"]} p-4 flex-1 min-w-[140px]`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-medium text-gray-900">{value}</p>
    </div>
  );
}

function Dashboard({ role }) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-medium text-gray-900">Panel principal</h1>
        <p className="text-sm text-gray-500">Resumen del inventario de la FISC — {role}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <StatCard label="Total de activos" value="8,687" />
        <StatCard label="En uso" value="5,928" tone="good" />
        <StatCard label="Dañados" value="600" tone="bad" />
        <StatCard label="Traslados pendientes" value="3" tone="warn" />
        <StatCard label="Préstamos activos" value="12" />
      </div>
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-500" />
          <p className="text-sm font-medium text-gray-900">Pendientes de atención</p>
        </div>
        <div className="divide-y divide-gray-100">
          <div className="px-4 py-3 text-sm text-gray-700 flex items-center justify-between">
            <span>2,185 activos sin estatus definido en el inventario</span>
            <Badge tone="warn">Revisar</Badge>
          </div>
          <div className="px-4 py-3 text-sm text-gray-700 flex items-center justify-between">
            <span>1 activo marcado como EXTRAVIADO — Router Cisco 2900</span>
            <Badge tone="bad">Extraviado</Badge>
          </div>
          <div className="px-4 py-3 text-sm text-gray-700 flex items-center justify-between">
            <span>Traslado de CPU Dell OptiPlex 3080 esperando autorización</span>
            <Badge tone="info">Pendiente</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivoDetail({ activo, onBack }) {
  const [tab, setTab] = useState("info");
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        <ChevronLeft size={16} /> Volver al listado
      </button>
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-medium text-gray-900">{activo.desc}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{activo.ref} · {activo.servitac}</p>
          </div>
          <div className="flex gap-2">
            <Badge tone={estatusTone(activo.estatus)}>{activo.estatus}</Badge>
            <Badge tone={estadoTone(activo.estado)}>{activo.estado}</Badge>
          </div>
        </div>

        <div className="flex gap-1 mt-5 border-b border-gray-100">
          {[["info", "Información"], ["historial", "Historial"], ["documentos", "Documentos"]].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-3 py-2 text-sm border-b-2 -mb-px ${tab === id ? "border-green-700 text-green-800 font-medium" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "info" && (
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-4 text-sm">
            <div><p className="text-gray-400 text-xs">Categoría</p><p className="text-gray-800">{activo.categoria}</p></div>
            <div><p className="text-gray-400 text-xs">Origen</p><p className="text-gray-800">{activo.origen}</p></div>
            <div><p className="text-gray-400 text-xs">Ubicación</p><p className="text-gray-800">{activo.ubicacion}</p></div>
            <div><p className="text-gray-400 text-xs">Tag RFID</p><p className="text-gray-800 font-mono text-xs">RF-{activo.servitac}</p></div>
          </div>
        )}
        {tab === "historial" && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600"><Clock size={14} className="text-gray-400" /> Registrado en el sistema — 03 feb 2025</div>
            <div className="flex items-center gap-2 text-sm text-gray-600"><ArrowLeftRight size={14} className="text-gray-400" /> Trasladado a {activo.ubicacion} — 14 jun 2026</div>
          </div>
        )}
        {tab === "documentos" && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-700 border border-gray-100 rounded px-3 py-2">
              <Paperclip size={14} className="text-gray-400" /> Factura_compra.pdf
            </div>
            <button className="text-sm text-green-800 hover:underline">+ Adjuntar documento</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Activos({ onOpen }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Todas");
  const filtered = ACTIVOS.filter((a) =>
    (cat === "Todas" || a.categoria === cat) &&
    (a.desc.toLowerCase().includes(q.toLowerCase()) || a.servitac.toLowerCase().includes(q.toLowerCase()))
  );
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-gray-900">Activos</h1>
          <p className="text-sm text-gray-500">{filtered.length} de {ACTIVOS.length} activos</p>
        </div>
        <button className="bg-green-800 text-white text-sm px-3 py-2 rounded-lg hover:bg-green-900">+ Registrar activo</button>
      </div>
      <div className="flex gap-2">
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 flex-1">
          <Search size={15} className="text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por descripción o servitac..." className="text-sm outline-none w-full text-gray-700" />
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 bg-white text-gray-700">
          <option>Todas</option>
          <option>Equipo</option>
          <option>Mobiliario</option>
        </select>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs">
              <th className="text-left px-4 py-2 font-medium">Descripción</th>
              <th className="text-left px-4 py-2 font-medium">Servitac</th>
              <th className="text-left px-4 py-2 font-medium">Ubicación</th>
              <th className="text-left px-4 py-2 font-medium">Estatus</th>
              <th className="text-left px-4 py-2 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((a) => (
              <tr key={a.id} onClick={() => onOpen(a)} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-4 py-2.5 text-gray-800">{a.desc}</td>
                <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">{a.servitac}</td>
                <td className="px-4 py-2.5 text-gray-600">{a.ubicacion}</td>
                <td className="px-4 py-2.5"><Badge tone={estatusTone(a.estatus)}>{a.estatus}</Badge></td>
                <td className="px-4 py-2.5"><Badge tone={estadoTone(a.estado)}>{a.estado}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Escaneo({ onOpen }) {
  const [mode, setMode] = useState("qr");
  const [found, setFound] = useState(null);
  const simulate = () => setFound(ACTIVOS[Math.floor(Math.random() * ACTIVOS.length)]);
  return (
    <div className="space-y-4 max-w-md">
      <div>
        <h1 className="text-lg font-medium text-gray-900">Escaneo</h1>
        <p className="text-sm text-gray-500">Identifica un activo por cámara o lector RFID</p>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setMode("qr")} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm border ${mode === "qr" ? "bg-green-800 text-white border-green-800" : "bg-white text-gray-600 border-gray-200"}`}>
          <QrCode size={15} /> QR / Barras
        </button>
        <button onClick={() => setMode("rfid")} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm border ${mode === "rfid" ? "bg-green-800 text-white border-green-800" : "bg-white text-gray-600 border-gray-200"}`}>
          <Radio size={15} /> Lector RFID
        </button>
      </div>
      <div className="bg-white border border-gray-200 border-dashed rounded-lg h-52 flex flex-col items-center justify-center gap-3 text-gray-400">
        {mode === "qr" ? <QrCode size={40} /> : <Radio size={40} />}
        <p className="text-xs">{mode === "qr" ? "Vista de cámara (simulada)" : "Esperando lectura de proximidad..."}</p>
        <button onClick={simulate} className="text-sm bg-gray-900 text-white px-3 py-1.5 rounded-lg">Simular lectura</button>
      </div>
      {found && (
        <div onClick={() => onOpen(found)} className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center justify-between cursor-pointer">
          <div>
            <p className="text-sm font-medium text-emerald-800">{found.desc}</p>
            <p className="text-xs text-emerald-600">{found.servitac} — {found.ubicacion}</p>
          </div>
          <Check size={18} className="text-emerald-600" />
        </div>
      )}
    </div>
  );
}

function Ubicaciones() {
  const deptos = [
    { nombre: "Departamento de TI", ubicaciones: ["Lab. 3-407", "Lab. 3-410", "Cuarto de Redes"] },
    { nombre: "Dirección FISC", ubicaciones: ["Oficina 17", "Sala de Reuniones"] },
    { nombre: "Docencia", ubicaciones: ["Aula 5-201", "Aula 5-202"] },
  ];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-gray-900">Ubicaciones</h1>
          <p className="text-sm text-gray-500">Estructura por departamentos y espacios físicos</p>
        </div>
        <button className="bg-green-800 text-white text-sm px-3 py-2 rounded-lg hover:bg-green-900">+ Nueva ubicación</button>
      </div>
      <div className="space-y-3">
        {deptos.map((d) => (
          <div key={d.nombre} className="bg-white rounded-lg border border-gray-200">
            <div className="px-4 py-2.5 border-b border-gray-100 text-sm font-medium text-gray-800">{d.nombre}</div>
            <div className="divide-y divide-gray-100">
              {d.ubicaciones.map((u) => (
                <div key={u} className="px-4 py-2 text-sm text-gray-600 flex items-center gap-2">
                  <MapPin size={13} className="text-gray-400" /> {u}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Prestamos() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-gray-900">Préstamos</h1>
          <p className="text-sm text-gray-500">Activos prestados a personas de la facultad</p>
        </div>
        <button className="bg-green-800 text-white text-sm px-3 py-2 rounded-lg hover:bg-green-900">+ Nuevo préstamo</button>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs">
              <th className="text-left px-4 py-2 font-medium">Activo</th>
              <th className="text-left px-4 py-2 font-medium">Persona</th>
              <th className="text-left px-4 py-2 font-medium">Fecha</th>
              <th className="text-left px-4 py-2 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {PRESTAMOS.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-2.5 text-gray-800">{p.activo}</td>
                <td className="px-4 py-2.5 text-gray-600">{p.persona}</td>
                <td className="px-4 py-2.5 text-gray-500">{p.fecha}</td>
                <td className="px-4 py-2.5"><Badge tone={p.estado === "Activo" ? "info" : "good"}>{p.estado}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Traslados() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-gray-900">Traslados</h1>
          <p className="text-sm text-gray-500">Solicitudes de traslado entre ubicaciones</p>
        </div>
        <button className="bg-green-800 text-white text-sm px-3 py-2 rounded-lg hover:bg-green-900">+ Nueva solicitud</button>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs">
              <th className="text-left px-4 py-2 font-medium">Activo</th>
              <th className="text-left px-4 py-2 font-medium">Origen</th>
              <th className="text-left px-4 py-2 font-medium">Destino</th>
              <th className="text-left px-4 py-2 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {TRASLADOS.map((t) => (
              <tr key={t.id}>
                <td className="px-4 py-2.5 text-gray-800">{t.activo}</td>
                <td className="px-4 py-2.5 text-gray-600">{t.origen}</td>
                <td className="px-4 py-2.5 text-gray-600">{t.destino}</td>
                <td className="px-4 py-2.5"><Badge tone={t.estado === "Autorizado" ? "good" : "warn"}>{t.estado}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Auditoria() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-medium text-gray-900">Auditoría</h1>
        <p className="text-sm text-gray-500">Bitácora de acciones del sistema</p>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs">
              <th className="text-left px-4 py-2 font-medium">Usuario</th>
              <th className="text-left px-4 py-2 font-medium">Acción</th>
              <th className="text-left px-4 py-2 font-medium">Tabla</th>
              <th className="text-left px-4 py-2 font-medium">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {LOGS.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-2.5 text-gray-800 font-mono text-xs">{l.usuario}</td>
                <td className="px-4 py-2.5 text-gray-600">{l.accion}</td>
                <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">{l.tabla}</td>
                <td className="px-4 py-2.5 text-gray-500">{l.fecha}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Administracion() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium text-gray-900">Administración</h1>
          <p className="text-sm text-gray-500">Usuarios y roles del sistema</p>
        </div>
        <button className="bg-green-800 text-white text-sm px-3 py-2 rounded-lg hover:bg-green-900">+ Nuevo usuario</button>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs">
              <th className="text-left px-4 py-2 font-medium">Nombre</th>
              <th className="text-left px-4 py-2 font-medium">Usuario</th>
              <th className="text-left px-4 py-2 font-medium">Rol</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {USUARIOS.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-2.5 text-gray-800">{u.nombre}</td>
                <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">{u.usuario}</td>
                <td className="px-4 py-2.5"><Badge tone="info">{u.rol}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function App() {
  const [role, setRole] = useState("Administrador");
  const [page, setPage] = useState("dashboard");
  const [selected, setSelected] = useState(null);

  const visibleNav = NAV.filter((n) => n.roles.includes(role));

  const openActivo = (a) => {
    setSelected(a);
    setPage("activoDetail");
  };

  let content;
  if (page === "dashboard") content = <Dashboard role={role} />;
  else if (page === "activos") content = <Activos onOpen={openActivo} />;
  else if (page === "activoDetail") content = <ActivoDetail activo={selected} onBack={() => setPage("activos")} />;
  else if (page === "escaneo") content = <Escaneo onOpen={openActivo} />;
  else if (page === "ubicaciones") content = <Ubicaciones />;
  else if (page === "prestamos") content = <Prestamos />;
  else if (page === "traslados") content = <Traslados />;
  else if (page === "auditoria") content = <Auditoria />;
  else if (page === "administracion") content = <Administracion />;

  return (
    <div className="flex min-h-[640px] bg-gray-50 font-sans text-gray-900">
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-4 py-4 border-b border-gray-100 flex items-center gap-2.5">
          <img
            src="data:image/png;base64,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"
            alt="Logo FISC"
            className="w-9 h-9 object-contain shrink-0"
          />
          <div>
            <p className="text-sm font-medium text-gray-900 leading-tight">Gestión de Activos</p>
            <p className="text-xs text-gray-400 leading-tight">Facultad de Ing. de Sistemas Computacionales</p>
          </div>
        </div>
        <nav className="flex-1 py-2">
          {visibleNav.map((n) => {
            const Icon = n.icon;
            const active = page === n.id || (page === "activoDetail" && n.id === "activos");
            return (
              <button
                key={n.id}
                onClick={() => setPage(n.id)}
                className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm ${active ? "bg-green-50 text-green-800 font-medium border-r-2 border-green-800" : "text-gray-600 hover:bg-gray-50"}`}
              >
                <Icon size={16} /> {n.label}
              </button>
            );
          })}
        </nav>
        <div className="px-4 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-1">Rol activo (demo)</p>
          <select value={role} onChange={(e) => { setRole(e.target.value); setPage("dashboard"); }} className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700">
            {ROLES.map((r) => <option key={r}>{r}</option>)}
          </select>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">{content}</main>
    </div>
  );
}
