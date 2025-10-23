import { useState } from "react";
import axios from "axios";

export default function RegistrarMascota() {
  const [pet, setPet] = useState({
    nombre: "",
    especie: "",
    raza: "",
    sexo: "",
    fecha_nacimiento: "",
    peso_kg: "",
    esterilizado: false,
    microchip: "",
    notas_salud: "",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPet({ ...pet, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("access");

    if (!token) {
      alert("Debes iniciar sesión primero.");
      return;
    }

    try {
      await axios.post("http://127.0.0.1:8000/api/mascotas/", pet, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      alert("Mascota registrada correctamente 🐾");
      setPet({
        nombre: "",
        especie: "",
        raza: "",
        sexo: "",
        fecha_nacimiento: "",
        peso_kg: "",
        esterilizado: false,
        microchip: "",
        notas_salud: "",
      });
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert("Error al registrar la mascota");
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl p-8 shadow-lg mt-8">
      <h2 className="text-2xl font-bold text-center mb-6">Registrar Mascota 🐶</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        <input
          className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-emerald-500 col-span-2"
          name="nombre"
          placeholder="Nombre"
          value={pet.nombre}
          onChange={handleChange}
          required
        />
        <select
          className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-emerald-500"
          name="especie"
          value={pet.especie}
          onChange={handleChange}
          required
        >
          <option value="">Seleccionar especie</option>
          <option value="Perro">Perro</option>
          <option value="Gato">Gato</option>
          <option value="Otro">Otro</option>
        </select>
        <input
          className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-emerald-500"
          name="raza"
          placeholder="Raza"
          value={pet.raza}
          onChange={handleChange}
        />
        <select
          className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-emerald-500"
          name="sexo"
          value={pet.sexo}
          onChange={handleChange}
        >
          <option value="">Sexo</option>
          <option value="Macho">Macho</option>
          <option value="Hembra">Hembra</option>
          <option value="No informado">No informado</option>
        </select>
        <input
          type="date"
          className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-emerald-500"
          name="fecha_nacimiento"
          value={pet.fecha_nacimiento}
          onChange={handleChange}
        />
        <input
          type="number"
          className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-emerald-500"
          name="peso_kg"
          placeholder="Peso (kg)"
          value={pet.peso_kg}
          onChange={handleChange}
        />
        <label className="col-span-2 flex items-center gap-2">
          <input
            type="checkbox"
            name="esterilizado"
            checked={pet.esterilizado}
            onChange={handleChange}
          />
          Esterilizado
        </label>
        <input
          className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-emerald-500 col-span-2"
          name="microchip"
          placeholder="Microchip (opcional)"
          value={pet.microchip}
          onChange={handleChange}
        />
        <textarea
          className="border rounded-lg p-2 w-full focus:ring-2 focus:ring-emerald-500 col-span-2"
          name="notas_salud"
          placeholder="Notas o comentarios de salud"
          value={pet.notas_salud}
          onChange={handleChange}
        />
        <button
          type="submit"
          className="col-span-2 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700"
        >
          Guardar Mascota
        </button>
      </form>
    </div>
  );
}
