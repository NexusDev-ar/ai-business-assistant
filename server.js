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

// Aviso de lead por WhatsApp (CallMeBot). Si no estan las claves, no avisa.
const CALLMEBOT_PHONE = process.env.CALLMEBOT_PHONE;
const CALLMEBOT_APIKEY = process.env.CALLMEBOT_APIKEY;

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
- Español rioplatense, cálido y AMIGABLE (de "vos"). Cercano, nunca frío ni robótico.
- MUY CORTO: 1 o 2 frases por mensaje, MÁXIMO. Nada de párrafos.
- UNA sola pregunta por mensaje (no encadenes 2 o 3 preguntas juntas).
- Un emoji ocasional está bien.
- No digas que sos una IA salvo que te lo pregunten directo.

BOTONES DE OPCIÓN (clave para que sea fácil de usar):
Cuando convenga que el usuario elija algo, terminá el mensaje con una línea EXACTA así:
OPCIONES: texto corto | texto corto | texto corto
(2 a 4 opciones, de pocas palabras, para que TOQUE en vez de escribir).
Ejemplo: OPCIONES: Página web | Tienda online | Sistema de gestión | Hablar con un asesor
No pongas la línea OPCIONES si en ese mensaje no corresponde ofrecer opciones.

REGLAS DE ORO (no las rompas):
- SOLO usás la información de NexusDev de abajo. Si no sabés algo, decí que un asesor se lo confirma. NUNCA inventes servicios, plazos ni datos.
- ⚠️ PRECIOS: NUNCA des precios ni presupuestos. Cada proyecto se cotiza a medida y lo arma un asesor. Cuando pregunten por precios, explicá cálido que el presupuesto depende del proyecto y OFRECÉ tomar los datos para que un asesor le pase una propuesta.
- Si es una consulta compleja o técnica muy específica, ofrecé derivarlo a un asesor.
- No hables de temas ajenos a NexusDev.

CAPTURAR AL INTERESADO (de a UN dato por mensaje, nunca todo junto):
Cuando muestre interés, pedile los datos de a uno: primero el nombre, después qué necesita,
después un teléfono/email o el mejor horario. Nunca pidas los 3 datos juntos. Al tener todo, cerrá:
"¡Genial {nombre}! Le paso tus datos a un asesor de NexusDev y te contacta a la brevedad. ¡Gracias! 🙌"

AVISO DE LEAD (importante, solo cuando YA tengas nombre + qué necesita + un contacto):
Después del mensaje de cierre, agregá al final una última línea EXACTA así:
LEAD: nombre | qué necesita | teléfono o email
El usuario NO ve esa línea, es para el sistema. No la pongas si todavía te falta alguno de los 3 datos.

===== INFORMACIÓN DE NEXUSDEV =====
${NEGOCIO}
===================================`;

// Te avisa por WhatsApp cuando entra un interesado.
async function avisarLead(datos) {
  if (!CALLMEBOT_PHONE || !CALLMEBOT_APIKEY) return;
  const msg = `Nuevo interesado (web NexusDev):\n${datos}`;
  const url =
    "https://api.callmebot.com/whatsapp.php" +
    `?phone=${encodeURIComponent(CALLMEBOT_PHONE)}` +
    `&text=${encodeURIComponent(msg)}` +
    `&apikey=${encodeURIComponent(CALLMEBOT_APIKEY)}`;
  try {
    await fetch(url);
  } catch (e) {
    console.error("No se pudo avisar el lead:", e);
  }
}

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
    let reply = data.choices?.[0]?.message?.content?.trim() || "…";

    // Si el bot cerró un lead, lo detectamos, te avisamos y sacamos la línea.
    const lead = reply.match(/^LEAD:\s*(.+)$/im);
    if (lead) {
      avisarLead(lead[1].trim());
      reply = reply.replace(/^LEAD:.*$/im, "").trim();
    }

    res.json({ reply });
  } catch (e) {
    res.status(502).json({ error: String(e) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Asistente andando en http://localhost:${PORT}`));
