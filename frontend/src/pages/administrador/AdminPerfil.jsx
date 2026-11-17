import { useEffect, useState } from "react";
import { UserCheck } from "lucide-react";
import { me } from "../../services/api";
import MfaProfileSection from "../../components/mfa/MfaProfileSection";

export default function AdminPerfil() {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    me()
      .then((res) => setProfile(res.data))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-slate-900 flex items-center justify-center text-white">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Mi Perfil de Administrador</h1>
            <p className="text-xs text-slate-500">
              Información de cuenta y configuración personal de seguridad MFA.
            </p>
          </div>
        </div>

        {profile && (
          <div className="grid sm:grid-cols-3 gap-4 text-sm pt-2">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-500">Nombre</p>
              <p className="font-semibold text-slate-900">{profile.name || "—"}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-500">Correo</p>
              <p className="font-semibold text-slate-900">{profile.email || "—"}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-500">Rol</p>
              <p className="font-semibold text-slate-900">
                {profile.is_staff ? "Administrador" : "Usuario"}
              </p>
            </div>
          </div>
        )}
      </div>

      <MfaProfileSection />
    </div>
  );
}
