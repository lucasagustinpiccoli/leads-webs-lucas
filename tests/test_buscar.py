"""Tests offline (no llaman a la API). Correr con: python -m unittest discover tests"""
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "scripts"))
import buscar  # noqa: E402

# Forma de la respuesta de places:searchText con el FIELD_MASK del script (datos inventados).
PLACE_IG = {
    "id": "ChIJ_test_1",
    "displayName": {"text": "Veterinaria Ejemplo", "languageCode": "es"},
    "primaryTypeDisplayName": {"text": "Veterinario", "languageCode": "es"},
    "formattedAddress": "Av. Falsa 123, B1678 Caseros, Provincia de Buenos Aires, Argentina",
    "nationalPhoneNumber": "011 15-5555-1234",
    "internationalPhoneNumber": "+54 9 11 5555-1234",
    "rating": 4.8,
    "userRatingCount": 210,
    "photos": [{"name": f"places/x/photos/{i}"} for i in range(10)],
    "regularOpeningHours": {"weekdayDescriptions": ["lunes: 9:00–20:00", "martes: 9:00–20:00"]},
    "googleMapsUri": "https://maps.google.com/?cid=1",
    "websiteUri": "https://www.instagram.com/vete.ejemplo/",
    "businessStatus": "OPERATIONAL",
}
PLACE_FIJO = {
    "id": "ChIJ_test_2",
    "displayName": {"text": "Clínica Sin Web"},
    "internationalPhoneNumber": "+54 11 4444-5555",
    "googleMapsUri": "https://maps.google.com/?cid=2",
    "businessStatus": "OPERATIONAL",
}


class TestBuscar(unittest.TestCase):
    def test_whatsapp(self):
        self.assertEqual(buscar.whatsapp("+54 9 11 5555-1234"), ("5491155551234", ""))
        self.assertEqual(buscar.whatsapp("+54 11 4444-5555"), ("5491144445555", "Fijo: puede no tener WA"))
        self.assertEqual(buscar.whatsapp("+54 220 444-5566"), ("5492204445566", ""))
        self.assertEqual(buscar.whatsapp(""), ("", ""))

    def test_procesar_deduplica_y_mapea(self):
        raw = {"rubro": "Veterinaria", "consultas": [
            {"localidad": "Caseros", "query": "veterinaria en Caseros, Buenos Aires", "places": [PLACE_IG, PLACE_FIJO]},
            {"localidad": "Caseros", "query": "clínica veterinaria en Caseros, Buenos Aires", "places": [PLACE_IG]},
        ]}
        filas = buscar.procesar(raw)
        self.assertEqual(len(filas), 2)
        a, b = filas
        self.assertEqual(a["negocio"], "Veterinaria Ejemplo")
        self.assertEqual(a["fotos"], 10)
        self.assertEqual(a["resenas"], 210)
        self.assertEqual(a["whatsapp"], "5491155551234")
        self.assertIn("lunes", a["horarios"])
        self.assertEqual(a["web"], "https://www.instagram.com/vete.ejemplo/")
        self.assertEqual(b["fotos"], 0)
        self.assertEqual(b["web"], "")
        self.assertEqual(b["nota_telefono"], "Fijo: puede no tener WA")
        self.assertEqual(list(a), buscar.COLUMNAS)

    def test_localidades(self):
        zonas = buscar.cargar("zonas.json")
        self.assertIn("Caseros", buscar.localidades("Zona Oeste", zonas))
        self.assertEqual(buscar.localidades("Caseros", zonas), ["Caseros"])


if __name__ == "__main__":
    unittest.main()
