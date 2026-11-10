# Leads para webs

Busca negocios locales sin página web con la API de Google Places, los califica y prepara una demo y un mensaje
para cada uno. Los mensajes los manda Lucas a mano. Plan completo en [`docs/plan.md`](docs/plan.md).

## Puesta en marcha

1. Crear una API key de Google Places:
   - En [Google Cloud Console](https://console.cloud.google.com/), crear un proyecto y activar la facturación (Places tiene un cupo gratis mensual; revisá los precios vigentes antes de escalar).
   - Activar **Places API (New)**.
   - En *APIs y servicios → Credenciales*, crear una clave y **restringirla** a Places API (New).
   - **Para no pagar nada**, en *APIs y servicios → Places API (New) → Cuotas*, bajá
     *Text Search requests per day* a **30**. Es un tope duro de Google: pasado ese número la API rechaza las
     llamadas en vez de cobrarlas. 30 por día son unas 900 por mes, por debajo de las 1.000 gratis del nivel
     Enterprise. Sumá también una alerta de presupuesto de USD 1 en *Facturación → Presupuestos y alertas*.
   - El script además trae un freno propio de 500 llamadas por mes (`output/uso-api.json`, se cambia con
     `PLACES_LIMITE_MENSUAL`). Cuenta por máquina, así que el tope que de verdad te protege es la cuota de Google.
   - Una búsqueda de 30 negocios usa entre 2 y 6 llamadas.
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
