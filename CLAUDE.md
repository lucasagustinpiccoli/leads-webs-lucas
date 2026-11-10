# Leads para webs — instrucciones para Claude

Proyecto de Lucas: conseguir clientes que necesiten una página web. Se buscan negocios locales sin sitio propio,
se les arma una demo con sus datos reales y Lucas los contacta a mano. El plan completo (meta, precios, estrategia,
métricas) está en @docs/plan.md.

Es una adaptación de la herramienta de Sol (`lucasagustinpiccoli/search-leads-sol`), con dos cambios de fondo:
los datos salen de la **API oficial de Google Places (New)** en vez de scrapear Maps con el navegador, y el
objetivo son negocios **sin web**, no cuentas para community management.

## Reglas

- Solo datos públicos comerciales del negocio (nombre, teléfono, dirección, reseñas, horarios). Nada de datos personales de los dueños.
- **No mandes mensajes de ningún tipo.** Claude redacta; Lucas envía a mano, en volumen bajo.
- No scrapees Google Maps ni Instagram: los datos de Maps vienen solo de la API de Places.
- Hacé solo lo que se pide en cada paso y confirmá con Lucas antes de pasar al siguiente.
- Los archivos generados van a `output/` (está en `.gitignore`: tiene teléfonos y no se sube).

## Herramientas

- `python scripts/buscar.py --rubro {clave} --zona {localidad | "zona oeste" | "caba"} [--max 60]`
  Llama a Places Text Search (hasta 60 resultados por consulta), deduplica por `place_id` y escribe
  `output/{rubro}-{zona}-{fecha}.csv`. Guarda la respuesta cruda en `output/raw/` para re-procesar con
  `--desde-raw` sin volver a pagar. Necesita `GOOGLE_PLACES_API_KEY`.
- Rubros y términos de búsqueda: `config/rubros.json`. Zonas: `config/zonas.json`.
- Tests offline: `python -m unittest discover tests`.

## Columnas del CSV

`place_id, negocio, rubro, categoria, direccion, localidad, telefono, whatsapp, nota_telefono, rating, resenas,
fotos, horarios, link_maps, web, estado_negocio, busqueda`

- `fotos` sale de la API con tope de 10: leelo como 0 / pocas / 10+.
- `whatsapp` va normalizado para `wa.me` (`549` + área + número). Los fijos de AMBA llevan
  `nota_telefono = Fijo: puede no tener WA`.
- `web` es el `websiteUri` de Google tal cual: puede ser web propia, Instagram, Facebook o un agregador de links.

## Avance del plan (prompt inicial de docs/plan.md)

1. ✅ Revisión de la herramienta de Sol.
2. ✅ Extracción por rubro y zona con Places → CSV.
3. ⏳ Filtro de negocios con web propia.
4. ⏳ Puntaje de prospecto.
5. ⏳ Plantilla de landing alimentada por JSON.
6. ⏳ Mensajes de contacto.
7. ⏳ Planilla de seguimiento.
