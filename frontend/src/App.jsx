import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Logos from './components/Logos'
import Features from './components/Features'
import Plans from './components/Plans'       // <— nuevo
import News from './components/News'         // <— nuevo
import CTA from './components/CTA'
import Footer from './components/Footer'
import WhatsAppFloat from './components/WhatsAppFloat'

export default function App() {
  return (
    <>
      <div className="min-h-screen">
        <Navbar />
        <Hero />
        <Logos />
        <Features />
        <Plans />      {/* ancla #planes */}
        <News />       {/* ancla #novedades */}
        <CTA />
        <Footer />
      </div>
      <WhatsAppFloat phone="+56912345678" />
    </>
  )
}
