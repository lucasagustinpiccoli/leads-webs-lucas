"""Tests offline del generador de demos. Correr con: python -m unittest discover tests"""
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "scripts"))
import demo  # noqa: E402

FILA = {"ranking": "4", "negocio": "Salón <Prueba>", "rubro": "Salón de eventos", "localidad": "Morón",
        "direccion": "Julián Pérez 826, B1708 Morón, Provincia de Buenos Aires, Argentina",
        "telefono": "+54 9 11 2482-9057", "whatsapp": "5491124829057", "rating": "4.6", "fotos": "33",
        "link_maps": "https://www.google.com/maps/place/?q=place_id:X", "web": "https://www.instagram.com/prueba/"}


class TestDemo(unittest.TestCase):
    def test_direccion_corta(self):
        self.assertEqual(demo.direccion_corta(FILA["direccion"]), "Julián Pérez 826, Morón")
        self.assertEqual(demo.direccion_corta("Av. Mitre 4371, B1678AVG Caseros, Provincia de Buenos Aires, Argentina"),
                         "Av. Mitre 4371, Caseros")

    def test_render_completo_y_escapado(self):
        d = demo.armar_datos(FILA)
        self.assertEqual(d["titular"], "Celebrá tu evento en Morón")
        self.assertEqual(d["instagram"], FILA["web"])
        out = demo.render(d)
        self.assertNotIn("{{", out)
        self.assertNotIn("<Prueba>", out)          # el nombre va escapado
        self.assertIn("Salón &lt;Prueba&gt;", out)
        self.assertIn("4,6", out)
        self.assertIn("+30", out)                  # 33 fotos -> "+30"
        self.assertIn("https://wa.me/5491124829057", out)
        self.assertIn('content="noindex, nofollow"', out)

    def test_fotos_propias_reemplazan_placeholders(self):
        d = demo.armar_datos(FILA)
        d["fotos"] = ["a.jpg", "b.jpg"]
        out = demo.render(d)
        self.assertEqual(out.count('<img src="'), 2)
        self.assertEqual(out.count('class="ph"'), 3)


if __name__ == "__main__":
    unittest.main()
