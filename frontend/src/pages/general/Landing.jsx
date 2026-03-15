import React from "react";
import { useNavigate } from "react-router-dom";
import {
    User,
    Stethoscope,
    Shield,
    ChevronRight,
    Menu,
    X,
    ArrowRight
} from "lucide-react";

export default function Landing() {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    const roles = [
        {
            id: "cliente",
            title: "Para Mascotas",
            description: "Gestiona las citas de tus mascotas y revisa su historial médico.",
            features: ["Agendamiento online", "Historial de vacunas", "Perfil de mascotas"],
            icon: <User className="h-6 w-6" />,
            color: "bg-sky-500",
            buttonColor: "border-sky-500 text-sky-600 hover:bg-sky-500 hover:text-white",
            target: "/login/cliente"
        },
        {
            id: "veterinario",
            title: "Para Especialistas",
            description: "Toma el control de tu agenda y fichas clínicas avanzadas.",
            features: ["Agenda interactiva", "Fichas clínicas pro", "Gestión de pacientes"],
            icon: <Stethoscope className="h-6 w-6" />,
            color: "bg-emerald-500",
            buttonColor: "border-emerald-500 text-emerald-600 hover:bg-emerald-500 hover:text-white",
            target: "/login/veterinario"
        },
        {
            id: "admin",
            title: "Administración",
            description: "Gestión centralizada de inventario y seguridad del sistema.",
            features: ["Control de stock", "Gestión de usuarios", "Reportes de gestión"],
            icon: <Shield className="h-6 w-6" />,
            color: "bg-slate-800",
            buttonColor: "border-slate-800 text-slate-800 hover:bg-slate-800 hover:text-white",
            target: "/login/admin"
        }
    ];

    const services = [
        {
            title: "Agendamiento Pro",
            desc: "Evita colisiones con nuestro sistema avanzado de bloqueo de concurrencia.",
            icon: "📅"
        },
        {
            title: "Historial Clínico",
            desc: "Fichas digitales seguras para cada paciente, siempre accesibles.",
            icon: "🧬"
        },
        {
            title: "Stock Inteligente",
            desc: "Control total de inventario con alertas automáticas de reposición.",
            icon: "📦"
        },
        {
            title: "Vencimientos",
            desc: "Alertas preventivas para insumos y medicamentos próximos a vencer.",
            icon: "⚠️"
        }
    ];

    return (
        <div className="min-h-screen bg-[#fffdfa] text-slate-900 font-['Fredoka'] overflow-x-hidden">

            {/* HEADER / NAVBAR */}
            <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-sky-600 p-1.5 rounded-[0.75rem] shadow-md shadow-sky-100">
                            <Shield className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-slate-900">Vetyon</span>
                    </div>

                    <nav className="hidden md:flex items-center gap-8">
                        <a href="#services" className="text-sm font-semibold hover:text-sky-600 transition-colors">Servicios</a>
                        <a href="#access" className="text-sm font-semibold hover:text-sky-600 transition-colors">Accesos</a>
                        <button
                            onClick={() => document.getElementById('access')?.scrollIntoView({ behavior: 'smooth' })}
                            className="bg-slate-900 text-white px-6 py-2 rounded-full text-xs font-bold hover:scale-105 transition-transform shadow-lg"
                        >
                            Comenzar
                        </button>
                    </nav>

                    <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden bg-white border-b border-slate-100 p-4 animate-fadeScale">
                        <nav className="flex flex-col gap-3">
                            <a href="#services" className="text-sm font-bold p-2" onClick={() => setIsMenuOpen(false)}>Servicios</a>
                            <a href="#access" className="text-sm font-bold p-2" onClick={() => setIsMenuOpen(false)}>Accesos</a>
                        </nav>
                    </div>
                )}
            </header>

            {/* HERO SECTION */}
            <section className="pt-24 pb-12 px-4">
                <div className="max-w-5xl mx-auto bg-slate-900 rounded-[2.5rem] p-8 md:p-16 relative overflow-hidden text-center text-white shadow-xl">
                    <div className="absolute inset-0 bg-dot-pattern text-white/5 opacity-30 pointer-events-none" />

                    <div className="relative z-10 flex flex-col items-center">
                        <div className="bg-white/10 border border-white/20 px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm">
                            <span className="text-xs font-bold tracking-wide">Vetyon 2026 🐾</span>
                        </div>

                        <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-6 max-w-2xl">
                            Cuidado Tecnológico para <span className="text-sky-400">Tus Mascotas</span>
                        </h1>

                        <p className="text-sm md:text-base text-slate-300 max-w-lg mb-8 leading-relaxed">
                            La plataforma integral que une a veterinarios, administradores y dueños de mascotas en un solo ecosistema digital.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => document.getElementById('access')?.scrollIntoView({ behavior: 'smooth' })}
                                className="bg-sky-500 hover:bg-sky-400 text-white px-8 py-3.5 rounded-full text-sm font-bold shadow-lg transition-all flex items-center gap-2"
                            >
                                Ingresar al Sistema <ArrowRight className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                                className="bg-transparent border border-white/30 hover:border-white text-white px-8 py-3.5 rounded-full text-sm font-bold transition-all"
                            >
                                Ver Servicios
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* SERVICES PREVIEW */}
            <section id="services" className="py-16 px-6 bg-[#ffecbc]/10">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <div className="bg-emerald-100 text-emerald-700 px-4 py-1 rounded-full inline-block font-bold text-xs mb-4">
                            ¿Qué ofrecemos?
                        </div>
                        <h2 className="text-2xl md:text-4xl font-bold mb-4">Gestión Eficiente en <span className="text-emerald-600">Tiempo Real</span></h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {services.map((s, i) => (
                            <div key={i} className="flex items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                                <div className="text-2xl bg-slate-50 p-3 rounded-xl">{s.icon}</div>
                                <div>
                                    <h4 className="text-lg font-bold mb-0.5">{s.title}</h4>
                                    <p className="text-xs text-slate-500">{s.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ACCESS SECTION */}
            <section id="access" className="py-16 px-6 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl md:text-4xl font-bold mb-3">Accesos al <span className="text-sky-600">Sistema</span></h2>
                        <p className="text-slate-500 text-sm">Selecciona tu perfil para iniciar sesión.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {roles.map((r) => (
                            <div
                                key={r.id}
                                className="bg-white border border-slate-100 rounded-[2.5rem] p-8 flex flex-col items-center text-center hover:border-sky-100 transition-all shadow-sm group"
                            >
                                <div className={`${r.color} w-full h-32 rounded-[1.5rem] flex items-center justify-center mb-6 relative overflow-hidden`}>
                                    <div className="absolute inset-0 bg-dot-pattern opacity-10" />
                                    <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                                        {React.cloneElement(r.icon, { className: "h-8 w-8 text-white" })}
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold mb-1">{r.title}</h3>
                                <p className="text-xs text-slate-500 mb-6 px-4">
                                    {r.description}
                                </p>

                                <div className="space-y-2 mb-8 w-full border-t border-slate-50 pt-6">
                                    {r.features.map((f, idx) => (
                                        <div key={idx} className="flex items-center gap-2 text-slate-600 justify-center">
                                            <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                            <span className="text-[10px] font-medium uppercase tracking-tight">{f}</span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => navigate(r.target)}
                                    className={`w-full py-3 rounded-full border-2 text-sm font-bold transition-all flex items-center justify-center gap-2 ${r.buttonColor}`}
                                >
                                    Iniciar Sesión <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="bg-slate-900 text-white pt-12 pb-8 px-6 rounded-t-[2.5rem]">
                <div className="max-w-5xl mx-auto flex flex-col items-center gap-8">
                    <div className="flex flex-col items-center gap-2">
                        <div className="bg-sky-600 p-2 rounded-xl">
                            <Shield className="h-5 w-5" />
                        </div>
                        <h2 className="text-xl font-bold">Vetyon</h2>
                    </div>

                    <nav className="flex flex-wrap justify-center gap-6 text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                        <a href="#" className="hover:text-white transition-colors">Servicios</a>
                        <a href="#" className="hover:text-white transition-colors">Accesos</a>
                        <a href="#" className="hover:text-white transition-colors">Privacidad</a>
                    </nav>

                    <div className="w-full h-[1px] bg-white/5" />

                    <p className="text-[10px] text-slate-500 text-center">
                        © 2026 Vetyon · Plataforma Veterinaria Integral.
                    </p>
                </div>
            </footer>
        </div>
    );
}
