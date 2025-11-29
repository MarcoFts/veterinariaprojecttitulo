import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";

export default function CuentaCreada() {
  return (
    <div className="min-h-screen bg-[#e8f4ff] flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl border border-slate-200 p-10 text-center animate-fadeIn">
        
        {/* Ícono éxito */}
        <div className="flex justify-center mb-4">
          <CheckCircle className="text-emerald-500 w-20 h-20 drop-shadow-sm" />
        </div>

        {/* Título */}
        <h2 className="text-3xl font-bold text-slate-800">
          ¡Tu cuenta ha sido creada!
        </h2>

        {/* Subtítulo */}
        <p className="text-slate-600 mt-3 text-base leading-relaxed px-4">
          Tu registro fue exitoso. Ya puedes iniciar sesión para gestionar tus
          mascotas, revisar citas disponibles y acceder a todo el sistema Vetyon.
        </p>

        {/* Botones */}
        <div className="mt-10 w-full space-y-4">

          <Link
            to="/login/cliente"
            className="block w-full py-3 rounded-xl text-white font-medium 
              bg-gradient-to-r from-blue-500 to-blue-700 
              hover:from-blue-600 hover:to-blue-800
              transition shadow-lg"
          >
            Ir al inicio de sesión
          </Link>

          <Link
            to="/seleccion-login"
            className="block w-full py-3 rounded-xl font-medium text-slate-700 
              bg-slate-100 hover:bg-slate-200 transition border border-slate-300"
          >
            Volver al inicio
          </Link>
        </div>

      </div>
    </div>
  );
}
