import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { mfaStatus } from "../../services/api";

export default function MfaGraceBanner({ profilePath }) {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    let active = true;
    mfaStatus()
      .then((res) => {
        if (active) setInfo(res.data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (!info || info.mfa_state !== "S1" || !info.grace_period_until) {
    return null;
  }

  const msLeft = new Date(info.grace_period_until).getTime() - Date.now();
  const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs sm:text-sm text-amber-900">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Tienes <strong>{daysLeft} día(s)</strong> restantes para activar el doble factor de
            autenticación (límite: {new Date(info.grace_period_until).toLocaleDateString()}).
          </span>
        </div>
        <Link
          to={profilePath}
          className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium"
        >
          Activar 2FA ahora
        </Link>
      </div>
    </div>
  );
}
