import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Library,
  Radio,
  Activity,
  ShieldCheck,
  Cpu,
  User,
  Lock,
  Eye,
  Info,
  LogIn,
  Headset
} from 'lucide-react';

const Login = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-6xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[700px]">
        {/* Left Column (Green) */}
        <div className="md:w-[45%] bg-gradient-to-br from-[#0c5942] to-[#073628] p-10 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle background pattern or overlay could go here */}
          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center gap-4 mb-12">
              <div className="w-12 h-12 rounded-xl border border-white/20 flex items-center justify-center bg-white/5 backdrop-blur-sm">
                <Library size={24} className="text-white/90" />
              </div>
              <div>
                <p className="text-[10px] tracking-wider text-green-200 font-semibold uppercase">Universidad Tecnológica de Panamá</p>
                <h2 className="text-lg font-bold tracking-wide">FISC · Campus V.L.S.</h2>
              </div>
            </div>

            {/* Title & Description */}
            <h1 className="text-4xl font-extrabold mb-6 leading-tight">
              Gestión Integral &<br />Trazabilidad de Activos
            </h1>
            <p className="text-green-100 text-sm leading-relaxed mb-12 opacity-90 max-w-sm">
              Sistema centralizado de control patrimonial, custodia de equipamiento tecnológico e inventario inteligente para laboratorios y departamentos de la FISC.
            </p>

            {/* Features List */}
            <div className="space-y-4">
              {/* Feature 1 */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-4 items-start backdrop-blur-sm hover:bg-white/10 transition-colors">
                <div className="mt-1 w-10 h-10 rounded-full bg-[#127255] flex items-center justify-center flex-shrink-0">
                  <Radio size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Lectura RFID UHF & Códigos QR</h3>
                  <p className="text-xs text-green-200 opacity-90 leading-relaxed">
                    Identificación instantánea de activos de alta densidad
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-4 items-start backdrop-blur-sm hover:bg-white/10 transition-colors">
                <div className="mt-1 w-10 h-10 rounded-full bg-[#127255] flex items-center justify-center flex-shrink-0">
                  <Activity size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Conciliación Patrimonial en Tiempo Real</h3>
                  <p className="text-xs text-green-200 opacity-90 leading-relaxed">
                    Sincronización directa con el catálogo de Bienes Patrimoniales
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-4 items-start backdrop-blur-sm hover:bg-white/10 transition-colors">
                <div className="mt-1 w-10 h-10 rounded-full bg-[#127255] flex items-center justify-center flex-shrink-0">
                  <ShieldCheck size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1">Auditoría Criptográfica & Actas Digitales</h3>
                  <p className="text-xs text-green-200 opacity-90 leading-relaxed">
                    Control riguroso de custodias, préstamos y traslados
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (White) */}
        <div className="md:w-[55%] p-10 flex flex-col relative">

          {/* Top Bar */}
          <div className="flex justify-between items-center mb-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-[#0c5942]">
                <Cpu size={22} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-800 leading-tight">FISC · UTP</h2>
                <p className="text-xs text-gray-500">Portal de Control de Activos</p>
              </div>
            </div>
            <div className="px-3 py-1.5 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
              Acceso Seguro
            </div>
          </div>

          <div className="flex-grow flex flex-col justify-center max-w-md mx-auto w-full">
            {/* Form Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Iniciar Sesión</h1>
              <p className="text-sm text-gray-500">
                Ingrese su correo electrónico y contraseña para acceder al sistema.
              </p>
            </div>

            {/* Form */}
            <form className="space-y-5" onSubmit={handleLogin}>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5 tracking-wide uppercase">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-gray-50/50 text-sm focus:ring-2 focus:ring-[#0c5942]/20 focus:border-[#0c5942] transition-colors placeholder-gray-400"
                    placeholder="ej. maria.arrocha@utp.ac.pa"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-gray-500 tracking-wide uppercase">
                    Contraseña
                  </label>
                  <a href="#" className="text-xs font-semibold text-[#0c5942] hover:underline">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="password"
                    className="block w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl bg-gray-50/50 text-sm focus:ring-2 focus:ring-[#0c5942]/20 focus:border-[#0c5942] transition-colors placeholder-gray-400"
                    placeholder="••••••••••••"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer">
                    <Eye size={18} className="text-gray-400 hover:text-gray-600 transition-colors" />
                  </div>
                </div>
              </div>

              {/* Remember me */}
              <div className="flex items-center justify-between pt-1 pb-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className="w-4 h-4 rounded border border-gray-300 flex items-center justify-center group-hover:border-[#0c5942] transition-colors">
                    {/* Add checkmark icon here if checked */}
                  </div>
                  <span className="text-xs text-gray-600 font-medium">Recordar este dispositivo por 30 días</span>
                </label>
                <Info size={14} className="text-gray-400" />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-[#0c5942] hover:bg-[#094734] text-white py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-[#0c5942]/20"
              >
                Ingresar al Sistema
                <LogIn size={18} />
              </button>
            </form>
          </div>

          {/* Bottom links */}
          <div className="mt-auto pt-10">
            <button className="w-full py-3 px-4 bg-gray-50 hover:bg-gray-100 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-[#0c5942] transition-colors border border-gray-100 mb-6">
              <Headset size={18} />
              ¿Problemas de acceso? Soporte FISC
            </button>

            <p className="text-center text-[10px] text-gray-400 font-medium">
              Facultad de Ingeniería de Sistemas Computacionales · Universidad Tecnológica de Panamá
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
