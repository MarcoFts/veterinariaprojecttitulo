// src/components/notifications/NotificationBell.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { Bell, CheckCheck } from "lucide-react";
import dayjs from "dayjs";
import "dayjs/locale/es";
dayjs.locale("es");

import {
  getNotificacionesResumen,
  marcarNotificacionLeida,
  marcarTodasNotificacionesLeidas,
} from "../../services/api";
import { useNavigate } from "react-router-dom";

export default function NotificationBell() {
  const { user } = useAuth(); // control login
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [noLeidas, setNoLeidas] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const boxRef = useRef(null);

  const cargar = useCallback(async () => {
    // ✅ no hagas llamadas si no hay sesión
    if (!user) return;

    setLoading(true);
    try {
      const res = await getNotificacionesResumen();
      // tu API devuelve { no_leidas, ultimas } en res.data
      setNoLeidas(res?.data?.no_leidas ?? 0);
      setItems(res?.data?.ultimas ?? []);
    } catch (e) {
      // silencioso para no molestar UI
      console.error("Notif resumen error:", e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ✅ Polling: solo si hay user (evita errores en F5)
  useEffect(() => {
    if (!user) return;

    cargar();
    const t = setInterval(cargar, 20000); // 20s
    return () => clearInterval(t);
  }, [user, cargar]);

  // ✅ Cerrar dropdown al click afuera (siempre montado, no rompe hooks)
  useEffect(() => {
    const onClick = (e) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const onOpen = async () => {
    // si no hay user, no abrir
    if (!user) return;

    setOpen((v) => !v);
    await cargar();
  };

  const clickItem = async (n) => {
    if (!user) return;

    try {
      if (!n.leida) {
        await marcarNotificacionLeida(n.id);
        setNoLeidas((x) => Math.max(0, x - 1));
        setItems((prev) =>
          prev.map((it) => (it.id === n.id ? { ...it, leida: true } : it))
        );
      }
    } catch (e) {
      console.error(e);
    }

    if (n.url) {
      setOpen(false);
      navigate(n.url);
    }
  };

  const marcarTodas = async () => {
    if (!user) return;

    try {
      await marcarTodasNotificacionesLeidas();
      setNoLeidas(0);
      setItems((prev) => prev.map((it) => ({ ...it, leida: true })));
    } catch (e) {
      console.error(e);
    }
  };

  // ✅ IMPORTANTE: el return condicional va AL FINAL (después de hooks)
  if (!user) return null;

  return (
    <div className="relative" ref={boxRef}>
      <button
        onClick={onOpen}
        className="relative inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 hover:bg-slate-50 transition"
        title="Notificaciones"
      >
        <Bell className="h-5 w-5 text-slate-700" />
        {noLeidas > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1.5 text-[11px] font-bold text-white">
            {noLeidas > 99 ? "99+" : noLeidas}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[360px] max-w-[90vw] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Notificaciones
              </p>
              <p className="text-xs text-slate-500">{noLeidas} sin leer</p>
            </div>

            <button
              onClick={marcarTodas}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              disabled={loading || items.length === 0}
              title="Marcar todas como leídas"
            >
              <CheckCheck className="h-4 w-4" />
              Marcar todas
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {loading && (
              <div className="px-4 py-3 text-sm text-slate-500">
                Cargando...
              </div>
            )}

            {!loading && items.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                No tienes notificaciones aún.
              </div>
            )}

            {!loading &&
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => clickItem(n)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition ${
                    n.leida ? "bg-white" : "bg-slate-50/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {n.titulo}
                      </p>

                      {n.mensaje ? (
                        <p className="mt-0.5 text-xs text-slate-600 line-clamp-2">
                          {n.mensaje}
                        </p>
                      ) : null}

                      <p className="mt-1 text-[11px] text-slate-500">
                        {n.creada_en
                          ? dayjs(n.creada_en).format("DD/MM/YYYY HH:mm")
                          : ""}
                      </p>
                    </div>

                    {!n.leida && (
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-slate-900 shrink-0" />
                    )}
                  </div>
                </button>
              ))}
          </div>

          <div className="px-4 py-3 text-xs text-slate-500 bg-slate-50 border-t border-slate-100">
            Tip: al hacer click se marca como leída y navega (si tiene URL).
          </div>
        </div>
      )}
    </div>
  );
}
