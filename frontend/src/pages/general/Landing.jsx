import React from "react";
import { useNavigate } from "react-router-dom";
import {
    User,
    Stethoscope,
    Shield,
    Heart,
    Calendar,
    Package,
    CheckCircle2,
    ChevronRight,
    Menu,
    X
} from "lucide-react";

export default function Landing() {
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    // Colores corporativos
    const colors = {
        primary: "sky",
        secondary: "emerald",
        accent: "blue",
        neutral: "slate"
    };

    const roles = [
        {
            id: "cliente",
            title: "Clínica Pet",
            description: "Gestiona las citas de tus mascotas y revisa su historial desde cualquier lugar.",
            icon: <User className="h-6 w-6" />,
            color: "bg-sky-500",
            lightColor: "bg-sky-50",
            textColor: "text-sky-600",
            target: "/login/cliente"
        },
        {
            id: "veterinario",
            title: "Portal Veterinario",
            description: "Toma el control de tu agenda, pacientes y fichas clínicas con herramientas avanzadas.",
            icon: <Stethoscope className="h-6 w-6" />,
            color: "bg-emerald-500",
            lightColor: "bg-emerald-50",
            textColor: "text-emerald-600",
            target: "/login/veterinario"
        },
        {
            id: "admin",
            title: "Administración Total",
            description: "Control centralizado de inventario, usuarios y movimientos del sistema.",
            icon: <Shield className="h-6 w-6" />,
            color: "bg-slate-800",
            lightColor: "bg-slate-100",
            textColor: "text-slate-800",
            target: "/login/admin"
        }
    ];

    const features = [
        {
            title: "Agenda Inteligente",
            desc: "Optimiza tus tiempos con un calendario profesional y bloqueo de colisiones.",
            icon: <Calendar className="h-8 w-8 text-sky-500" />
        },
        {
            title: "Inventario en Tiempo Real",
            desc: "Alertas automáticas de stock bajo y control total de insumos médicos.",
            icon: <Package className="h-8 w-8 text-emerald-500" />
        },
        {
            title: "Ficha Médica Segura",
            desc: "Historial completo y seguro para cada paciente, siempre accesible.",
            icon: <Heart className="h-8 w-8 text-rose-500" />
        }
    ];

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-['Outfit']">

            {/* NAVBAR */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-sky-600 p-2 rounded-xl">
                            <Shield className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-slate-900">Vetyon</span>
                    </div>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#inicio" className="text-sm font-medium text-slate-600 hover:text-sky-600 transition-colors">Inicio</a>
                        <a href="#servicios" className="text-sm font-medium text-slate-600 hover:text-sky-600 transition-colors">Servicios</a>
                        <a href="#roles" className="text-sm font-medium text-slate-600 hover:text-sky-600 transition-colors">Accesos</a>
                        <button
                            onClick={() => document.getElementById('roles')?.scrollIntoView({ behavior: 'smooth' })}
                            className="bg-slate-900 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                        >
                            Comenzar ahora
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button className="md:hidden p-2 text-slate-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden bg-white border-b border-slate-200 p-6 flex flex-col gap-4 animate-fadeScale">
                        <a href="#inicio" className="text-lg font-medium" onClick={() => setIsMenuOpen(false)}>Inicio</a>
                        <a href="#servicios" className="text-lg font-medium" onClick={() => setIsMenuOpen(false)}>Servicios</a>
                        <a href="#roles" className="text-lg font-medium" onClick={() => setIsMenuOpen(false)}>Accesos</a>
                        <button
                            onClick={() => {
                                setIsMenuOpen(false);
                                document.getElementById('roles')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="bg-sky-600 text-white px-6 py-3 rounded-xl font-semibold"
                        >
                            Comenzar ahora
                        </button>
                    </div>
                )}
            </nav>

            {/* HERO SECTION */}
            <section id="inicio" className="pt-40 pb-20 px-6 relative overflow-hidden">
                {/* Decorative Blobs */}
                <div className="absolute top-20 -left-20 w-72 h-72 bg-sky-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />
                <div className="absolute top-40 -right-20 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" />

                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 bg-sky-50 border border-sky-100 rounded-full px-4 py-1.5 mb-8 animate-fadeScale">
                        <CheckCircle2 className="h-4 w-4 text-sky-600" />
                        <span className="text-sm font-semibold text-sky-700">Plataforma Veterinaria 2025</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.1]">
                        El Futuro de la <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-emerald-600">Gestión Veterinaria</span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-600 mb-10 leading-relaxed">
                        Optimiza tu clínica con Vetyon. Agenda citas con precisión, gestiona tu inventario en tiempo real y ofrece la mejor atención a tus pacientes.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={() => document.getElementById('roles')?.scrollIntoView({ behavior: 'smooth' })}
                            className="w-full sm:w-auto bg-sky-600 text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-sky-700 transition-all shadow-xl shadow-sky-200 flex items-center justify-center gap-2 group"
                        >
                            Ingresar al sistema
                            <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button
                            onClick={() => document.getElementById('servicios')?.scrollIntoView({ behavior: 'smooth' })}
                            className="w-full sm:w-auto bg-white text-slate-900 px-8 py-4 rounded-full text-lg font-bold border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                        >
                            Ver características
                        </button>
                    </div>

                    {/* Trusted Badges */}
                    <div className="mt-20 pt-10 border-t border-slate-200/60 max-w-4xl mx-auto">
                        <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-8">Tecnología de Vanguardia</p>
                        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                            <span className="text-xl font-bold">Django REST</span>
                            <span className="text-xl font-bold">React Vite</span>
                            <span className="text-xl font-bold">PostgreSQL</span>
                            <span className="text-xl font-bold">Tailwind CSS</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURES SECTION */}
            <section id="servicios" className="py-24 px-6 bg-white relative">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">Herramientas Pro para tu Clínica</h2>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                            Diseñado específicamente para las necesidades de hoy, unificando todos tus procesos en un solo lugar.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {features.map((f, i) => (
                            <div key={i} className="p-10 rounded-3xl border border-slate-100 bg-[#fbfcfd] hover:shadow-2xl hover:shadow-sky-100 transition-all duration-300 group">
                                <div className="mb-6 bg-white p-4 inline-block rounded-2xl shadow-sm border border-slate-50 group-hover:scale-110 transition-transform">
                                    {f.icon}
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
                                <p className="text-slate-500 leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ROLES / ACCESS SECTION */}
            <section id="roles" className="py-24 px-6 bg-gradient-to-b from-white to-slate-50 relative">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-slate-900 rounded-[3rem] p-8 md:p-20 relative overflow-hidden shadow-2xl">
                        {/* Background pattern */}
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,#0ea5e9,transparent_70%)]" />

                        <div className="relative z-10 text-center mb-16">
                            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Elige tu puerta de entrada</h2>
                            <p className="text-lg text-slate-400 max-w-xl mx-auto">
                                Selecciona tu perfil de usuario para acceder a las herramientas correspondientes.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
                            {roles.map((r) => (
                                <div
                                    key={r.id}
                                    className="bg-white/5 backdrop-blur-sm border border-white/10 p-8 rounded-[2rem] hover:bg-white/10 transition-all group flex flex-col justify-between"
                                >
                                    <div>
                                        <div className={`${r.color} h-12 w-12 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-black/20`}>
                                            {r.icon}
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-3">{r.title}</h3>
                                        <p className="text-slate-400 text-sm leading-relaxed mb-8">
                                            {r.description}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => navigate(r.target)}
                                        className="w-full bg-white text-slate-900 py-4 rounded-2xl font-bold hover:bg-sky-50 transition-colors flex items-center justify-center gap-2 group/btn"
                                    >
                                        Ingresar
                                        <ChevronRight className="h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="py-12 px-6 border-t border-slate-200 bg-white">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-sky-600" />
                        <span className="text-lg font-bold text-slate-900">Vetyon</span>
                    </div>
                    <p className="text-sm text-slate-500">
                        &copy; 2025 Vetyon Plataforma Veterinaria. Todos los derechos reservados.
                    </p>
                    <div className="flex gap-6">
                        <a href="#" className="text-sm text-slate-400 hover:text-slate-900 transition-colors">Privacidad</a>
                        <a href="#" className="text-sm text-slate-400 hover:text-slate-900 transition-colors">Soporte</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
