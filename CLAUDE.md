# Leads para webs — instrucciones para Claude

Proyecto de Lucas: conseguir clientes que necesiten una página web. Se buscan negocios locales sin sitio propio,
se les arma una demo con sus datos reales y Lucas los contacta a mano. El plan completo (meta, precios, estrategia,
métricas) está en @docs/plan.md.

Es una adaptación de la herramienta de Sol (`lucasagustinpiccoli/search-leads-sol`): mismo método de búsqueda en
Google Maps (sin API ni tarjeta), pero el objetivo son negocios **sin web**, no cuentas para community management.
Se trabaja en **tandas de 100 prospectos** rankeados, con los mejores marcados para demo.

## Reglas

- Solo datos públicos comerciales del negocio (nombre, teléfono, dirección, reseñas, horarios). Nada de datos personales de los dueños.
- **No mandes mensajes de ningún tipo.** Claude redacta; Lucas envía a mano, en volumen bajo.
- Google Maps se lee solo con `scripts/scrape_maps.js`, en volumen bajo (pausas entre consultas, una tanda por vez).
  Va contra los términos de Google: si aparece un CAPTCHA, se frena y no se intenta esquivarlo. No scrapees Instagram.
- Hacé solo lo que se pide en cada paso y confirmá con Lucas antes de pasar al siguiente.
- Los archivos generados van a `output/` (está en `.gitignore`: tiene teléfonos y no se sube).

## Flujo de una tanda

1. `node scripts/scrape_maps.js --localidades "Caseros,Ramos Mejía" [--rubros veterinaria,dentista] [--terminos 1]`
   (o `--zona "zona oeste"`). Guarda `output/raw/maps-{fecha}.json`. Cada consulta trae hasta 20 negocios:
   6 rubros × 4 localidades ≈ 400 negocios ≈ 270 sin web propia.
2. `python scripts/rankear.py [--tamano 100] [--demos 15] [--demos-por-rubro 5]`
   Junta todos los raw, saca los ya entregados (`output/entregados.json`), filtra los que tienen web propia,
   cerrados, cadenas e instituciones (`config/excluir.json`) y teléfonos repetidos, puntúa y escribe
   `output/tanda-NN-{fecha}.csv`. Lo que sobra queda para la próxima tanda. `--no-marcar` para probar.

### Puntaje (0–100)

- Rating: ≥4,7 → 30; 5,0 exacto → 26 (sin cantidad de reseñas, un 5,0 suele ser de pocas opiniones); ≥4,4 → 24; ≥4 → 14.
- Fotos en Maps: ≥20 → 20; ≥5 → 13; ≥1 → 6. También son material para la demo.
- Teléfono: celular (+54 9) → 20; fijo → 12.
- Presencia: solo Instagram 20; solo Facebook / agregador / WhatsApp 17; web gratuita o caída 15; sin nada 14.
  Quien ya invierte en redes entiende el valor de estar online y es más fácil de convencer.
- Rubro: dentista, clínica, abogado 10; contador, veterinaria 9; taller 7.
- −10 si la dirección no coincide con la localidad buscada.

**Límite conocido:** sin login, Google Maps está en "vista limitada" y no da la cantidad de reseñas.

## Otras herramientas

- `python scripts/buscar.py --rubro {clave} --zona {localidad | "zona oeste" | "caba"} [--max 60]`
  Llama a Places Text Search (hasta 60 resultados por consulta), deduplica por `place_id` y escribe
  `output/{rubro}-{zona}-{fecha}.csv`. Guarda la respuesta cruda en `output/raw/` para re-procesar con
  `--desde-raw` sin volver a pagar. Necesita `GOOGLE_PLACES_API_KEY` (tarjeta en Google Cloud). Queda como
  alternativa oficial si se escala; hoy no se usa.
- Rubros y términos de búsqueda: `config/rubros.json`. Zonas: `config/zonas.json`.
- Tests offline: `python -m unittest discover tests`.

## Columnas del CSV de una tanda

`ranking, puntaje, demo, motivo, negocio, rubro, categoria, localidad, direccion, telefono, whatsapp, rating, fotos,
presencia, web, horario_hoy, link_maps, notas, place_id`

## Columnas del CSV de buscar.py (Places)

`place_id, negocio, rubro, categoria, direccion, localidad, telefono, whatsapp, nota_telefono, rating, resenas,
fotos, horarios, link_maps, web, estado_negocio, busqueda`

- `fotos` sale de la API con tope de 10: leelo como 0 / pocas / 10+.
- `whatsapp` va normalizado para `wa.me` (`549` + área + número). Los fijos de AMBA llevan
  `nota_telefono = Fijo: puede no tener WA`.
- `web` es el `websiteUri` de Google tal cual: puede ser web propia, Instagram, Facebook o un agregador de links.

## Avance del plan (prompt inicial de docs/plan.md)

1. ✅ Revisión de la herramienta de Sol.
2. ✅ Extracción por rubro y zona (scrape_maps.js; buscar.py con Places como alternativa).
3. ✅ Filtro de negocios con web propia (rankear.py).
4. ✅ Puntaje de prospecto y selección de demos (rankear.py). Tanda 01: Caseros, Ramos Mejía, Morón, Castelar.
5. ⏳ Plantilla de landing alimentada por JSON.
6. ⏳ Mensajes de contacto.
7. ⏳ Planilla de seguimiento.
