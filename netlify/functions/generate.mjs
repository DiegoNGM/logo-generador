const MODEL_NAME = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2.5-flare";
const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8" },
});

const INDUSTRIES = {
  biotechnology: "biotecnología y ciencias de la vida",
  technology: "tecnología y software",
  wellness: "bienestar y salud cotidiana",
  food: "alimentos y bebidas",
  finance: "servicios financieros",
  sustainability: "sostenibilidad y medio ambiente",
  design: "estudio creativo y diseño",
  general: "empresa general",
};
const STYLES = {
  minimalist: "minimalista, simple y con espacio negativo",
  geometric: "geométrico, con formas definidas y equilibradas",
  organic: "orgánico, inspirado en formas naturales y curvas suaves",
  technical: "técnico, preciso y moderno",
  premium: "elegante, refinado y premium",
  playful: "amigable, dinámico y divertido",
};
const PALETTES = {
  forest: "verde bosque (#183b32), verde lima suave (#a8d979) y blanco cálido",
  ocean: "azul profundo (#123c59), turquesa (#54b9b0) y blanco frío",
  mono: "negro carbón (#171a19), gris y blanco; monocromático",
  sunset: "vino oscuro (#612d37), naranja cálido (#edaa68) y crema",
};
const SYMBOLS = {
  dna: "una hélice de ADN estilizada",
  leaf: "una hoja estilizada",
  orbit: "una órbita con un núcleo",
  spark: "un destello geométrico",
  wave: "ondas fluidas",
  hex: "un hexágono geométrico",
  pulse: "una línea de pulso o señal",
  flower: "una flor geométrica",
};
const LAYOUTS = {
  auto: "elige una composición clara que funcione bien para una marca",
  horizontal: "símbolo a la izquierda y nombre de marca a la derecha",
  stacked: "símbolo centrado encima del nombre de marca",
  badge: "emblema o sello compacto",
};

function cleanText(value, fallback = "", maxLength = 60) {
  if (typeof value !== "string") return fallback;
  return value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, maxLength);
}
function choice(value, allowed, fallback) {
  return typeof value === "string" && Object.hasOwn(allowed, value) ? value : fallback;
}
function makePrompt(brief) {
  const brandName = cleanText(brief.name, "Mi marca", 60) || "Mi marca";
  const tagline = cleanText(brief.tagline, "", 120);
  const industry = choice(brief.industry, INDUSTRIES, "general");
  const style = choice(brief.style, STYLES, "minimalist");
  const palette = choice(brief.palette, PALETTES, "forest");
  const symbol = choice(brief.symbol, SYMBOLS, "dna");
  const layout = choice(brief.layout, LAYOUTS, "auto");
  const taglineRule = tagline
    ? `Incluye también el eslogan exactamente así: "${tagline}".`
    : "No añadas eslogan ni texto secundario.";

  return `Diseña UNA propuesta de logotipo profesional para una empresa. La instrucción está en español.\n\n` +
    `DATOS DE MARCA\n- Nombre exacto: "${brandName}"\n` +
    `- Eslogan: ${tagline ? `"${tagline}"` : "ninguno"}\n` +
    `- Industria: ${INDUSTRIES[industry]}\n- Estilo visual: ${STYLES[style]}\n` +
    `- Paleta obligatoria: ${PALETTES[palette]}\n- Símbolo principal: ${SYMBOLS[symbol]}\n` +
    `- Composición: ${LAYOUTS[layout]}\n\n` +
    `INSTRUCCIONES DE DISEÑO\nCrea una imagen de logotipo centrada, limpia y profesional sobre un fondo blanco o crema liso. ` +
    `Usa formas legibles, una silueta memorable, buen contraste, pocos elementos y jerarquía visual clara. ` +
    `Debe parecer un logotipo real, no una fotografía ni una escena. Usa principalmente colores planos; ` +
    `evita texturas complejas, brillos 3D, mockups, papelería, letreros, fondos decorativos, marcas de agua ` +
    `y ejemplos múltiples en una misma imagen. No imites logotipos de empresas existentes ni personajes reconocibles. ` +
    `Respeta la paleta y el símbolo indicados. El nombre de marca debe escribirse exactamente como se especifica, ` +
    `sin añadir palabras, letras o caracteres. ${taglineRule} No añadas texto que no se haya solicitado. ` +
    `Prioriza la calidad visual del símbolo sobre los adornos. La salida debe contener solo el diseño final, en formato cuadrado.`;
}

export default async function generate(request) {
  if (request.method !== "POST") {
    return json({ detail: "Método no permitido." }, 405);
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return json({ detail: "Falta configurar OPENAI_API_KEY en las variables de entorno de Netlify." }, 503);
  }

  let brief;
  try {
    brief = await request.json();
  } catch {
    return json({ detail: "El cuerpo de la solicitud no contiene JSON válido." }, 400);
  }
  if (!brief || typeof brief !== "object" || Array.isArray(brief)) {
    return json({ detail: "Los criterios de diseño no son válidos." }, 400);
  }

  const prompt = makePrompt(brief);
  const count = Math.max(1, Math.min(3, Number.isInteger(brief.count) ? brief.count : 3));

  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        prompt,
        n: count,
        size: "1024x1024",
        quality: "medium",
        background: "opaque",
        output_format: "png",
      }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      // Log status only; don't expose provider diagnostics or any secrets to visitors.
      console.error("Image API request failed with status", response.status);
      const message = response.status === 401 || response.status === 403
        ? "La clave API no es válida o la cuenta no tiene acceso al modelo. Revisa la configuración de OpenAI."
        : response.status === 429
          ? "Se alcanzó un límite de solicitudes o de uso de la API. Inténtalo más tarde o revisa tu cuenta."
          : "No se pudieron generar las imágenes. Revisa el acceso al modelo y la configuración de la API.";
      return json({ detail: message }, 502);
    }

    const images = Array.isArray(result.data)
      ? result.data.map((item) => item?.b64_json).filter((item) => typeof item === "string" && item.length > 0)
      : [];
    if (images.length === 0) {
      return json({ detail: "El modelo no devolvió imágenes. Inténtalo de nuevo." }, 502);
    }
    return json({ images, model: MODEL_NAME });
  } catch (error) {
    console.error("Image generation function failed:", error?.name || "UnknownError");
    return json({ detail: "No se pudo conectar con el servicio de generación de imágenes." }, 502);
  }
}
