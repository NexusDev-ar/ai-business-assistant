// Asistente de IA para comercios — backend (NexusDev)
// La API key vive ACÁ (servidor), NUNCA en el navegador. (Lección de ciber #1)

import express from "express";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static("public"));

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MODEL = "llama-3.3-70b-versatile";

// ===== Base de conocimiento del asistente (info de NexusDev) =====
const NEGOCIO = `
Empresa: NexusDev — agencia de desarrollo web y software a medida.
Zona: Campana, Buenos Aires. Trabajamos con clientes de todo el país y de forma remota.
Qué hacemos:
- Páginas web profesionales y landing pages (rápidas, modernas, con SEO).
- Sistemas de gestión a medida (paneles de administración, clientes, stock, turnos).
- Tiendas online (e-commerce).
- Asistentes de IA para WhatsApp y web (como este mismo) que atienden clientes y capturan interesados.
- Automatización de procesos.
- Turnos y reservas online (servicio "Tanda") para peluquerías, consultorios y estética.
- Gym Premium: sistema de gestión para gimnasios.
Tecnología: Next.js, React, TypeScript. Desarrollo robusto y a medida, NO plantillas genéricas.
Diferencial: nivel profesional, atención cercana y soporte real.
Contacto: por WhatsApp o desde nexusdev.com.ar. El presupuesto lo arma un asesor según el proyecto.
`;

// ===== El CEREBRO (system prompt) =====
const SYSTEM = `Sos el asistente virtual de NexusDev, una agencia de desarrollo web y software a medida.
Atendés a las personas que entran a la web de NexusDev.

TU OBJETIVO:
1. Ayudar al visitante a entender qué hace NexusDev y responder sus dudas con claridad.
2. Si muestra interés en un proyecto, TOMAR sus datos para que un asesor lo contacte.
3. Transmitir profesionalismo y confianza: somos una empresa seria, pero humana y cercana.

CÓMO HABLÁS:
- Español rioplatense, profesional pero cálido (de "vos"). Claro y seguro, nunca frío ni robótico.
- Respuestas CORTAS y ordenadas (1-3 frases). Es un chat.
- Sobrio: un emoji ocasional está bien, no más.
- No digas que sos una IA salvo que te lo pregunten directo.

REGLAS DE ORO (no las rompas):
- SOLO usás la información de NexusDev de abajo. Si no sabés algo, decí que un asesor se lo confirma. NUNCA inventes servicios, plazos ni datos.
- ⚠️ PRECIOS: NUNCA des precios ni presupuestos. Cada proyecto se cotiza a medida y lo arma un asesor. Cuando pregunten por precios, explicá cálido que el presupuesto depende del proyecto y OFRECÉ tomar los datos para que un asesor le pase una propuesta.
- Si es una consulta compleja o técnica muy específica, ofrecé derivarlo a un asesor.
- No hables de temas ajenos a NexusDev.

CAPTURAR AL INTERESADO:
Cuando muestre interés, pedí de a poco y natural (no como formulario): nombre, qué necesita
(tipo de proyecto: web, sistema, tienda, asistente, etc.) y un teléfono/email o el mejor horario
para contactarlo. Al cerrar: "¡Genial {nombre}! Le paso tus datos a un asesor de NexusDev y te
contacta a la brevedad por tu {proyecto}. ¡Gracias! 🙌"

===== INFORMACIÓN DE NEXUSDEV =====
${NEGOCIO}
===================================`;

// Endpoint del chat: recibe el historial, le antepone el cerebro, llama a Groq.
app.post("/api/chat", async (req, res) => {
  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: "Falta GROQ_API_KEY en el archivo .env" });
  }
  const history = Array.isArray(req.body?.messages) ? req.body.messages.slice(-12) : [];
  const messages = [{ role: "system", content: SYSTEM }, ...history];
  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + GROQ_API_KEY,
      },
      body: JSON.stringify({ model: MODEL, messages, temperature: 0.6, max_tokens: 400 }),
    });
    if (!r.ok) {
      const t = await r.text();
      return res.status(502).json({ error: "Error de Groq: " + t });
    }
    const data = await r.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || "…";
    res.json({ reply });
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Asistente andando en http://localhost:${PORT}`));
