"""Tests offline del filtro y el puntaje. Correr con: python -m unittest discover tests"""
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "scripts"))
import rankear  # noqa: E402


def lugar(**kw):
    base = {"place_id": "A", "nombre": "Vete Uno", "categoria": "Veterinario", "direccion": "Calle 1, Caseros",
            "localidad_maps": "Caseros", "telefono": "+54 9 11 5555-1234", "rating": 4.8, "fotos": 30, "web": "",
            "horario_hoy": "9–18", "cerrado": False, "rubro_clave": "veterinaria", "localidad": "Caseros"}
    base.update(kw)
    return base


class TestRankear(unittest.TestCase):
    def test_presencia(self):
        self.assertEqual(rankear.presencia(""), "Sin web")
        self.assertEqual(rankear.presencia("http://instagram.com/x"), "Solo Instagram")
        self.assertEqual(rankear.presencia("https://www.facebook.com/x"), "Solo Facebook")
        self.assertEqual(rankear.presencia("https://linktr.ee/x"), "Agregador / WhatsApp")
        self.assertEqual(rankear.presencia("https://x.wixsite.com/site"), "Web gratuita o caída")
        self.assertEqual(rankear.presencia("https://www.veterinariacaseros.com.ar/"), "Web propia")

    def test_filtro_y_orden(self):
        rubros = rankear.cargar("rubros.json")
        lugares = {
            "A": lugar(),
            "B": lugar(place_id="B", nombre="Con Web", web="https://vete.com.ar", telefono="+54 11 4444-0001"),
            "C": lugar(place_id="C", nombre="Cerrada", cerrado=True, telefono="+54 11 4444-0002"),
            "D": lugar(place_id="D", nombre="Hospital Veterinario", telefono="+54 11 4444-0003"),
            "E": lugar(place_id="E", nombre="Floja", rating=3.5, fotos=0, telefono=""),
            "F": lugar(place_id="F", nombre="Duplicada", rating=4.0),  # mismo teléfono que A
        }
        out, desc = rankear.preparar(lugares, rubros, ["hospital"])
        self.assertEqual([n["negocio"] for n in out], ["Vete Uno", "Floja"])
        self.assertEqual(desc, {"tiene web propia": 1, "cerrado": 1, "cadena / institución": 1, "teléfono repetido": 1})
        self.assertGreater(out[0]["puntaje"], out[1]["puntaje"])
        self.assertEqual(out[0]["whatsapp"], "5491155551234")

    def test_cinco_estrellas_pesa_menos_que_cuatro_ocho(self):
        n = {"rating": 4.8, "fotos": 10, "telefono": "", "presencia": "Sin web", "rubro_clave": "taller", "fuera_de_zona": False}
        self.assertGreater(rankear.puntuar(n)[0], rankear.puntuar({**n, "rating": 5})[0])


if __name__ == "__main__":
    unittest.main()
