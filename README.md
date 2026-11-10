# Leads para webs

Busca negocios locales sin página web con la API de Google Places, los califica y prepara una demo y un mensaje
para cada uno. Los mensajes los manda Lucas a mano. Plan completo en [`docs/plan.md`](docs/plan.md).

## Puesta en marcha

1. Crear una API key de Google Places:
   - En [Google Cloud Console](https://console.cloud.google.com/), crear un proyecto y activar la facturación (Places tiene un cupo gratis mensual; revisá los precios vigentes antes de escalar).
   - Activar **Places API (New)**.
   - En *APIs y servicios → Credenciales*, crear una clave y **restringirla** a Places API (New).
2. Dejar la clave en una variable de entorno (nunca en el repo):
   ```bash
   export GOOGLE_PLACES_API_KEY="tu-clave"
   ```
   En Windows (PowerShell): `$env:GOOGLE_PLACES_API_KEY="tu-clave"`
3. Buscar:
   ```bash
   python scripts/buscar.py --rubro veterinaria --zona Caseros --max 30
   ```
   El CSV queda en `output/`. No hace falta instalar nada: usa solo la librería estándar de Python.

Rubros disponibles: `veterinaria`, `dentista`, `taller`, `contador`, `abogado`, `clinica` (editables en
`config/rubros.json`). Zonas: cualquier localidad, o `"zona oeste"` / `"caba"` para recorrer todas las de
`config/zonas.json`.
