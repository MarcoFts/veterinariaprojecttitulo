export default function Footer() {
    return (
      <footer className="py-10 bg-white border-t">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-black/60">© {new Date().getFullYear()} VetCare. Todos los derechos reservados.</p>
          <ul className="flex items-center gap-5 text-sm">
            <li><a className="hover:text-roseA" href="#">Privacidad</a></li>
            <li><a className="hover:text-roseA" href="#">Términos</a></li>
            <li><a className="hover:text-roseA" href="#">Soporte</a></li>
          </ul>
        </div>
      </footer>
    )
  }
  