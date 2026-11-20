import os
import re
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "scripts"))
import mensajes  # noqa: E402

FILA = {"ranking": "9", "negocio": "Sellaro Abogados. Ramos Mejía", "rubro": "Estudio jurídico", "localidad": "Ramos Mejía",
        "rating": "4.9", "presencia": "Sin web", "whatsapp": "5491122365377", "web": "", "demo": "Sí", "notas": ""}


class TestMensajes(unittest.TestCase):
    def test_nombre_corto(self):
        self.assertEqual(mensajes.nombre_corto("Sellaro Abogados. Ramos Mejía", None, "Ramos Mejía"), "Sellaro Abogados")
        self.assertEqual(mensajes.nombre_corto("Verse Bien Ramos Mejia", None, "Ramos Mejía"), "Verse Bien")
        self.assertEqual(mensajes.nombre_corto("Casa Ramón - Eventos Boutique"), "Casa Ramón")
        self.assertEqual(mensajes.nombre_corto("E.S. Estética Dental", None, "Ramos Mejía"), "E.S. Estética Dental")
        self.assertEqual(mensajes.nombre_corto("X largo", {"nombre_corto": "X"}), "X")

    def test_mensaje_con_demo_lleva_el_link_y_datos_reales(self):
        d0, d3, d7, ig = mensajes.mensajes(FILA, "https://x.pages.dev/demos/09/", True, "Sellaro Abogados")
        self.assertIn("https://x.pages.dev/demos/09/", d0)
        self.assertIn("4,9 en Google Maps", d0)
        self.assertIn("https://x.pages.dev/demos/09/", d3)
        self.assertIn("USD 180", d7)
        self.assertNotIn("¿hablo con", ig)

    def test_sin_demo_lleva_el_ejemplo(self):
        d0, d3, _, _ = mensajes.mensajes(FILA, mensajes.EJEMPLO, False, "Sellaro Abogados")
        self.assertIn(mensajes.EJEMPLO, d0)
        self.assertNotIn("Te armé una demo", d0)

    def test_sin_rating_no_inventa_calificacion(self):
        d0, _, _, _ = mensajes.mensajes({**FILA, "rating": ""}, "https://x/", True, "Sellaro")
        self.assertNotIn("en Google Maps", d0)

    def test_sin_guiones_largos(self):
        for demo in (True, False):
            for m in mensajes.mensajes({**FILA, "presencia": "Solo Instagram"}, "https://x/", demo, "Sellaro"):
                self.assertFalse(re.search("[\u2014\u2013]", m))


if __name__ == "__main__":
    unittest.main()
