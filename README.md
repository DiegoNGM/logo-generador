# Forma — versión lista para Netlify

Esta versión mantiene el sitio en español y sustituye el servidor FastAPI/Python por dos Netlify Functions de JavaScript. No requiere fine-tuning y llama a la API de generación de imágenes desde el servidor, sin exponer la clave API al navegador.

## Publicar la versión funcional (recomendado: con GitHub)

1. Descomprime este proyecto.
2. Sube el contenido de la carpeta `forma_netlify_ready` a un repositorio de GitHub.
3. Entra a https://app.netlify.com/ y elige **Add new project / Import an existing project**.
4. Conecta GitHub y selecciona ese repositorio.
5. En la configuración de build usa:
   - **Build command:** déjalo vacío.
   - **Publish directory:** `public`.
   - El archivo `netlify.toml` ya configura el directorio de funciones `netlify/functions` y los endpoints `/api/health` y `/api/generate`.
6. Antes de generar imágenes, abre la configuración del proyecto en Netlify y añade la variable de entorno `OPENAI_API_KEY` con tu clave de API. Asegúrate de que su alcance incluya **Functions**.
7. Opcionalmente, define `OPENAI_IMAGE_MODEL` como `gpt-image-2.5-flare`. Si no la defines, se usa ese modelo por defecto.
8. Vuelve a desplegar (redeploy) el proyecto después de guardar las variables.
9. Abre la URL de Netlify y prueba **Generar propuestas**.

Documentación oficial:
- Deploy de proyectos: https://docs.netlify.com/manage/projects/add-new-project/
- Netlify Functions: https://docs.netlify.com/build/functions/get-started/
- Variables de entorno para Functions: https://docs.netlify.com/build/functions/environment-variables/
- API de generación de imágenes: https://developers.openai.com/api/docs/guides/image-generation

## Alternativa con Netlify CLI

Desde la carpeta del proyecto, con Node.js instalado:

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --build --prod
```

Después configura `OPENAI_API_KEY` en la configuración de entorno de Netlify y vuelve a desplegar.

## Importante sobre seguridad y costos

- Nunca pongas `OPENAI_API_KEY` en `index.html`, en código de navegador ni en un repositorio Git.
- Cualquier persona que pueda usar el sitio publicado puede intentar llamar al endpoint de generación y generar consumo de API. Para un sitio público, añade autenticación o límites de uso/rate limiting antes de compartirlo ampliamente y vigila el gasto de API.
- La generación de imágenes puede tener costo y requiere que la cuenta de API tenga acceso al modelo y facturación configurada.
- El modelo devuelve PNG; la exportación SVG editable no está implementada en esta versión.

## Estructura

```text
public/
  index.html
netlify/
  functions/
    generate.mjs
    health.mjs
netlify.toml
README.md
```
