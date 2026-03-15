import React from "react";
import { useNavigate } from "react-router-dom";
import {
    User,
    Stethoscope,
    Shield,
    Heart,
    Calendar,
    Package,
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
            price: "Acceso Gratuito",
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
            price: "Portal Clínico",
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
            price: "Control Total",
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
            desc: "Evita colisiones con nuestro sistema de bloqueo de concurrencia.",
            icon: "📅"
        },
        {
            title: "Stock Inteligente",
            desc: "Alertas automáticas cuando tus insumos críticos se están agotando.",
            icon: "📦"
        }
    ];

    return (
        <div className="min-h-screen bg-[#fffdfa] text-slate-900 font-['Fredoka'] overflow-x-hidden">

            {/* HEADER / NAVBAR */}
            <header className="fixed top-0 w-full z-50 bg-[#334155]/10 backdrop-blur-lg border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-sky-600 p-2 rounded-[1rem] shadow-lg shadow-sky-200">
                            <Shield className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-slate-900">Vetyon</span>
                    </div>

                    <nav className="hidden md:flex items-center gap-10">
                        <a href="#services" className="text-sm font-semibold hover:text-sky-600 transition-colors">Servicios</a>
                        <a href="#pricing" className="text-sm font-semibold hover:text-sky-600 transition-colors">Accesos</a>
                        <button
                            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                            className="bg-slate-900 text-white px-8 py-3 rounded-full text-sm font-bold hover:scale-105 transition-transform shadow-xl"
                        >
                            Comenzar →
                        </button>
                    </nav>

                    <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </header>

            {/* HERO SECTION - Inspired by CarePaw dark burgundy but using Slate/Sky */}
            <section className="pt-32 pb-20 px-4 md:px-6">
                <div className="max-w-7xl mx-auto bg-slate-900 rounded-[3rem] md:rounded-[4rem] p-10 md:p-24 relative overflow-hidden text-center text-white shadow-2xl">
                    {/* Dot Pattern Overlay */}
                    <div className="absolute inset-0 bg-dot-pattern text-white/5 opacity-40 pointer-events-none" />

                    <div className="relative z-10 flex flex-col items-center">
                        <div className="bg-white/10 border border-white/20 px-6 py-2 rounded-full mb-10 backdrop-blur-sm">
                            <span className="text-sm font-bold tracking-wide">¡Bienvenidos a Vetyon! 🐾</span>
                        </div>

                        <h1 className="text-5xl md:text-8xl font-bold leading-[1.05] mb-8 max-w-4xl">
                            Cuidado Tecnológico para <span className="text-sky-400">Tus Mascotas</span>
                        </h1>

                        <p className="text-lg md:text-xl text-slate-300 max-w-2xl mb-12 leading-relaxed">
                            La plataforma integral que une a veterinarios, administradores y dueños de mascotas en un solo ecosistema digital seguro y moderno.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-5">
                            <button
                                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                                className="bg-sky-500 hover:bg-sky-400 text-white px-10 py-5 rounded-full text-lg font-bold shadow-2xl transition-all hover:scale-105 flex items-center gap-2"
                            >
                                Hacer una Reserva <ArrowRight className="h-5 w-5" />
                            </button>
                            <button
                                onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                                className="bg-transparent border-2 border-white/30 hover:border-white text-white px-10 py-5 rounded-full text-lg font-bold transition-all"
                            >
                                Ver Servicios
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* SERVICES PREVIEW - Overlapping Layout */}
            <section id="services" className="py-20 px-6 bg-[#ffecbc]/30">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="bg-emerald-100 text-emerald-700 px-5 py-2 rounded-full inline-block font-bold text-sm mb-6">
                            ¿Por qué elegirnos? 🐱
                        </div>
                        <h2 className="text-4xl md:text-6xl font-bold mb-8 leading-tight">
                            Emergencias y Cuidado Preventivo en <span className="text-emerald-600">Tiempo Real.</span>
                        </h2>
                        <p className="text-lg text-slate-600 mb-10 leading-relaxed">
                            Nuestro sistema garantiza que cada paciente reciba atención oportuna gracias a la gestión inteligente de agenda y el control estricto de insumos médicos.
                        </p>

                        <div className="space-y-6">
                            {services.map((s, i) => (
                                <div key={i} className="flex items-start gap-5">
                                    <div className="text-3xl bg-white p-4 rounded-2xl shadow-sm border border-slate-100">{s.icon}</div>
                                    <div>
                                        <h4 className="text-xl font-bold mb-1">{s.title}</h4>
                                        <p className="text-slate-500">{s.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative">
                        <div className="bg-white p-6 rounded-[3rem] shadow-2xl border-8 border-[#ffecbc]">
                            <img
                                src="https://images.unsplash.com/photo-1584132967334-10e028bd69f7?q=80&w=2070&auto=format&fit=crop"
                                alt="Veterinaria"
                                className="rounded-[2.5rem] w-full h-[400px] object-cover"
                            />
                        </div>
                        {/* Badge Overlapping */}
                        <div className="absolute -bottom-10 -left-10 bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl hidden md:block max-w-[250px] animate-bounce-slow">
                            <p className="text-3xl font-bold mb-1">100%</p>
                            <p className="text-sm opacity-70">Disponibilidad y seguridad en tus datos clínicos.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* PRICING / ROLES SECTION - The "Cards" style from CarePaw */}
            <section id="pricing" className="py-24 px-6 relative bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-6xl font-bold mb-6">Configuraciones de <span className="text-sky-600">Acceso</span></h2>
                        <p className="text-slate-500 max-w-xl mx-auto">
                            Planes adaptados para cada miembro del equipo y dueños de mascotas.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {roles.map((r) => (
                            <div
                                key={r.id}
                                className="bg-white border-2 border-slate-100 rounded-[3.5rem] p-10 flex flex-col items-center text-center hover:border-sky-200 transition-all group"
                            >
                                <span className="text-4xl font-bold text-slate-800 mb-2">{r.price}</span>
                                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">{r.title}</span>

                                <div className={`${r.color} w-full h-48 rounded-[2.5rem] flex items-center justify-center mb-8 relative overflow-hidden`}>
                                    <div className="absolute inset-0 bg-dot-pattern opacity-10" />
                                    <div className="bg-white/20 p-6 rounded-3xl backdrop-blur-sm">
                                        {React.cloneElement(r.icon, { className: "h-12 w-12 text-white" })}
                                    </div>
                                </div>

                                <div className="space-y-4 mb-10 w-full">
                                    {r.features.map((f, idx) => (
                                        <div key={idx} className="flex items-center gap-3 text-slate-600 justify-center">
                                            <div className="h-2 w-2 rounded-full bg-slate-900" />
                                            <span className="text-sm font-medium">{f}</span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => navigate(r.target)}
                                    className={`w-full py-4 rounded-full border-2 font-bold transition-all flex items-center justify-center gap-2 ${r.buttonColor}`}
                                >
                                    Elegir Plan <ChevronRight className="h-5 w-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FOOTER - Inspired by CarePaw dark footer */}
            <footer className="bg-slate-900 text-white pt-20 pb-10 px-6 mt-10 rounded-t-[4rem]">
                <div className="max-w-7xl mx-auto flex flex-col items-center gap-12">
                    <div className="flex flex-col items-center gap-4">
                        <div className="bg-sky-600 p-3 rounded-2xl">
                            <Shield className="h-8 w-8" />
                        </div>
                        <h2 className="text-4xl font-bold tracking-tighter">Vetyon</h2>
                    </div>

                    <nav className="flex flex-wrap justify-center gap-10 md:gap-20 text-slate-400 font-bold uppercase tracking-widest text-xs">
                        <a href="#" className="hover:text-white transition-colors">Nosotros</a>
                        <a href="#" className="hover:text-white transition-colors">Módulos</a>
                        <a href="#" className="hover:text-white transition-colors">Soporte</a>
                        <a href="#" className="hover:text-white transition-colors">Privacidad</a>
                    </nav>

                    <div className="w-full h-[1px] bg-white/10" />

                    <div className="flex flex-col md:flex-row justify-between w-full items-center gap-6 text-slate-500 text-sm">
                        <p>© 2025 Vetyon. Potenciado por el cuidado a las mascotas.</p>
                        <div className="flex gap-6">
                            <span>LinkedIn</span>
                            <span>GitHub</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
