"""Tests offline del generador de demos. Correr con: python -m unittest discover tests"""
import os
import re
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
        self.assertEqual(d["eyebrow"], "Salón de eventos en Morón")
        self.assertEqual(d["instagram"], FILA["web"])
        out = demo.render(d)
        self.assertNotIn("{{", out)
        self.assertNotIn("<Prueba>", out)          # el nombre va escapado
        self.assertIn("Salón &lt;Prueba&gt;", out)
        self.assertIn("4,6", out)
        self.assertIn("+30", out)                  # 33 fotos en Google -> "+30"
        self.assertIn("@prueba", out)
        self.assertIn("https://wa.me/5491124829057", out)
        self.assertIn('content="noindex, nofollow"', out)
        self.assertNotIn("\u2014", out)            # sin em-dash
        self.assertEqual(out.count("<figure>"), 5)  # galería: 5 celdas exactas
        self.assertNotIn("class=\"rating", out)    # sin estrellas en el hero
        self.assertNotIn("*", re.sub(r"<(style|script)[\s\S]*?</\1>", "", out))  # el *énfasis* nunca queda con asteriscos

    def test_direccion_con_prefijo_basura(self):
        self.assertEqual(demo.direccion_corta("END Ramos Mejía Buenos Aires AR, Av. Gaona 2009, B1704 Ramos Mejía, Provincia de Buenos Aires, Argentina"),
                         "Av. Gaona 2009, Ramos Mejía")

    def test_titular_con_enfasis(self):
        self.assertEqual(demo.titular_html("Tu fiesta, como la *imaginaste*."), "Tu fiesta, como la <em>imaginaste</em>.")
        self.assertEqual(demo.titular_html("<b>*x*</b>"), "&lt;b&gt;<em>x</em>&lt;/b&gt;")

    def test_modo_turno_usa_opciones_para_tocar(self):
        html = demo.formulario({"modo": "turno", "tipo_label": "Motivo", "tipos": ["Control", "Urgencia"],
                                "franjas": ["Mañana", "Tarde"], "extra_label": "Comentario", "boton": "Pedir turno"})
        self.assertIn('data-dias="1,2,3,4,5,6"', html)
        self.assertEqual(html.count('class="chip"'), 4)
        self.assertNotIn('type="date"', html)

    def test_instagram_con_parametros(self):
        d = demo.armar_datos({**FILA, "web": "https://www.instagram.com/ga_eventos1/?hl=es-la"})
        self.assertIn("@ga_eventos1", demo.render(d))

    def test_fotos_propias_reemplazan_stock(self):
        d = demo.armar_datos(FILA)
        d["fotos"] = ["a.jpg", "b.jpg"]
        hero, gal, _ = demo.imagenes(d)
        self.assertEqual(hero, "a.jpg")
        self.assertEqual(gal[0], "b.jpg")
        self.assertEqual(len(gal), 5)
        self.assertTrue(all(g.startswith("img/") for g in gal[1:]))

    def test_demos_de_una_tanda_no_repiten_tema_y_foto(self):
        vistos = set()
        for n in range(1, 4):
            d = demo.armar_datos({**FILA, "ranking": str(n)})
            vistos.add((d["tema"]["nombre"], d["hero_stock"]))
        self.assertEqual(len(vistos), 3)

    def test_nombre_gigante_largo_y_nombre_corto(self):
        d = demo.armar_datos({**FILA, "negocio": "Radiografia panoramica en Caseros"})
        self.assertIn("clamp(20px,", demo.render(d))     # nombre largo: mínimo más chico para que entre en el celular
        self.assertIn("clamp(48px,", demo.render(demo.armar_datos({**FILA, "negocio": "Moka Eventos"})))  # nombres cortos, igual que antes
        d["nombre_corto"] = "Panorámica"
        self.assertIn(">Panorámica</span>", demo.render(d))

    def test_rubro_dentista_turno(self):
        d = demo.armar_datos({**FILA, "rubro": "Dentista", "negocio": "Consultorio X"})
        self.assertEqual(d["form"]["modo"], "turno")
        self.assertIn("Pedí turno", demo.render(d))
        carpeta = os.path.join(demo.ROOT, "templates", "assets", "dentista")
        for n in {d["hero_stock"], *d["galeria_stock"], *(t["imagen"] for t in d["tipos"])}:
            self.assertTrue(os.path.exists(os.path.join(carpeta, n)), n)

    def test_stock_existe(self):
        d = demo.armar_datos(FILA)
        carpeta = os.path.join(demo.ROOT, "templates", "assets", d["rubro"])
        for n in {d["hero_stock"], *d["galeria_stock"], *(t["imagen"] for t in d["tipos"])}:
            self.assertTrue(os.path.exists(os.path.join(carpeta, n)), n)


if __name__ == "__main__":
    unittest.main()
