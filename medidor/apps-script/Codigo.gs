/* Halo Vista · receptor v1. Va dentro de la planilla de Google de cada cliente (Extensiones > Apps Script).
   Recibe los eventos de medidor.js y los guarda, una fila por evento, en la hoja "eventos".
   Pasos: pegar este archivo, ejecutar preparar() una vez con la clave elegida, e Implementar > Aplicación web. */

var HOJA = "eventos";
var TIPOS = ["visita", "whatsapp", "llamada", "email", "formulario"];

// Ejecutar UNA vez desde el editor. Cambiá la clave antes de correrlo.
function preparar() {
  var CLAVE = "cambiar-esta-clave";
  PropertiesService.getScriptProperties().setProperty("CLAVE", CLAVE);
  var libro = SpreadsheetApp.getActive();
  var h = libro.getSheetByName(HOJA) || libro.insertSheet(HOJA);
  if (h.getLastRow() === 0) {
    h.appendRow(["fecha", "sitio", "tipo", "ruta", "origen", "dispositivo", "detalle"]);
    h.setFrozenRows(1);
  }
  var r = libro.getSheetByName("resumen") || libro.insertSheet("resumen");
  r.clear();
  var d30 = 'eventos!A2:A,">"&(TODAY()-30)';
  r.getRange("A1:B1").setValues([["Últimos 30 días", "Total"]]).setFontWeight("bold");
  r.getRange("A2:A7").setValues([["Visitas"], ["Clics a WhatsApp"], ["Llamadas"], ["Emails"], ["Formularios"], ["Contactos"]]);
  var tipos = ["visita", "whatsapp", "llamada", "email", "formulario"];
  for (var i = 0; i < tipos.length; i++) r.getRange(2 + i, 2).setFormula('=COUNTIFS(eventos!C2:C,"' + tipos[i] + '",' + d30 + ')');
  r.getRange("B7").setFormula("=SUM(B3:B6)");
  r.getRange("A8").setValue("Visitas que contactan");
  r.getRange("B8").setFormula("=IFERROR(B7/B2,0)").setNumberFormat("0.0%");
  r.getRange("A10").setValue("Visitas por origen (30 días)").setFontWeight("bold");
  r.getRange("A11").setFormula('=IFERROR(QUERY(eventos!A2:G,"select E, count(E) where C=\'visita\' and A > date \'"&TEXT(TODAY()-30,"yyyy-mm-dd")&"\' group by E order by count(E) desc label E \'Origen\', count(E) \'Visitas\'",0),"sin datos")');
  Logger.log("Listo. Ahora: Implementar > Nueva implementación > Aplicación web (ejecutar como: yo; acceso: cualquier usuario).");
}

function doGet() { return ContentService.createTextOutput("Halo Vista activo"); }

function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    if (d.clave !== PropertiesService.getScriptProperties().getProperty("CLAVE")) return salida("clave");
    if (TIPOS.indexOf(d.tipo) < 0) return salida("tipo");
    var lock = LockService.getScriptLock();
    lock.waitLock(8000);
    try {
      SpreadsheetApp.getActive().getSheetByName(HOJA).appendRow([new Date(), limpiar(d.sitio, 60), d.tipo, limpiar(d.ruta, 120), limpiar(d.origen, 40), limpiar(d.dispositivo, 20), limpiar(d.detalle, 80)]);
    } finally { lock.releaseLock(); }
    return salida("ok");
  } catch (err) { return salida("error"); }
}

function salida(t) { return ContentService.createTextOutput(t); }
// evita que un texto que empiece con = + - @ se ejecute como fórmula en la planilla
function limpiar(v, n) { v = String(v == null ? "" : v).slice(0, n); return /^[=+\-@]/.test(v) ? "'" + v : v; }
