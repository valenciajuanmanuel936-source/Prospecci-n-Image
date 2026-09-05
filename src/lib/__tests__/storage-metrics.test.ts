import { describe, expect, it } from "vitest";
import { exportarJSON, prospectosACSV, validarImportacion } from "../storage";
import { datosIniciales } from "../seed";
import { calcularMetricas, RangoFechas } from "../metrics";
import { Prospecto } from "../types";

function prospecto(over: Partial<Prospecto>): Prospecto {
  return {
    id: over.id ?? "p",
    nombre: "P",
    usuarioInstagram: "@p",
    urlInstagram: "",
    ciudad: "Bogotá",
    tipoProspecto: "seguidor_reciente",
    cercania: "cercana",
    fase: "apertura",
    temperatura: "frio",
    estado: "nuevo",
    seguimientosRealizados: 0,
    historial: [],
    creadoEn: "2024-05-01T00:00:00.000Z",
    ...over,
  };
}

describe("11. Persistir los datos (export/import round-trip)", () => {
  it("exporta e importa sin perder prospectos", () => {
    const data = datosIniciales(true);
    const json = exportarJSON(data);
    const res = validarImportacion(json);
    expect(res.ok).toBe(true);
    expect(res.data?.prospectos.length).toBe(data.prospectos.length);
  });
});

describe("12. Calcular métricas desde datos reales", () => {
  it("cuenta contactos y cierres correctamente", () => {
    const rango: RangoFechas = { desde: "2024-05-01", hasta: "2024-05-31" };
    const ps = [
      prospecto({ id: "a", estado: "cerrado_ganado", problema: "x", dineroCobrado: 100, facturacionContratada: 300 }),
      prospecto({ id: "b", estado: "discovery", problema: "y" }),
      prospecto({ id: "c", estado: "nuevo" }),
    ];
    const m = calcularMetricas(ps, [], rango);
    expect(m.contactos).toBe(3);
    expect(m.cierres).toBe(1);
    expect(m.problemasValidados).toBe(2);
  });
});

describe("13. Diferenciar facturación y dinero cobrado", () => {
  it("suma por separado facturación contratada y dinero cobrado", () => {
    const rango: RangoFechas = { desde: "2024-05-01", hasta: "2024-05-31" };
    const ps = [
      prospecto({ id: "a", estado: "cerrado_ganado", facturacionContratada: 500, dineroCobrado: 200 }),
      prospecto({ id: "b", estado: "cerrado_ganado", facturacionContratada: 300, dineroCobrado: 300 }),
    ];
    const m = calcularMetricas(ps, [], rango);
    expect(m.facturacionContratada).toBe(800);
    expect(m.dineroCobrado).toBe(500);
    expect(m.facturacionContratada).not.toBe(m.dineroCobrado);
  });
  it("el CSV incluye ambas columnas", () => {
    const csv = prospectosACSV([prospecto({ facturacionContratada: 1, dineroCobrado: 2 })]);
    expect(csv).toContain("facturacionContratada");
    expect(csv).toContain("dineroCobrado");
  });
});

describe("14 y 15. Almacenamiento independiente de IMAGE", () => {
  it("los datos iniciales están marcados como IMAGE", () => {
    expect(datosIniciales(true).marca).toBe("IMAGE");
  });
  it("rechaza importar datos de otra marca", () => {
    const otra = JSON.stringify({ marca: "OTRA_MARCA", config: {}, prospectos: [] });
    const res = validarImportacion(otra);
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/otra marca/i);
  });
  it("el export declara la marca IMAGE", () => {
    expect(exportarJSON(datosIniciales(false))).toContain('"marca": "IMAGE"');
  });
});
