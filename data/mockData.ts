
import { ReologyData, ElementoType, MaterialType, SitioType } from '../types';

const PARAMS_BASE = {
  70: { m1: { eta: 0.015, tau: 4.16 }, promedio: { eta: 0.015, tau: 4.19 } },
  65: { m1: { eta: 0.009, tau: 1.76 }, promedio: { eta: 0.009, tau: 1.76 } }
};

const sr_base = [1, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];

const generateSS = (params: {eta: number, tau: number}, sr: number[]) => {
  return sr.map(val => parseFloat((params.tau + params.eta * val + (Math.random() * 0.5)).toFixed(2)));
};

const CAMPANA_FECHAS = ["2024-03-04", "2024-04-14", "2024-05-12"];

export const MOCK_DATA: ReologyData[] = CAMPANA_FECHAS.flatMap((fecha, fIdx) => {
  const sitios: SitioType[] = ['MLP', 'CMDIC', 'Teck'];
  const unidades = ['STC', '7"', '8"', 'CTS'];
  
  return sitios.flatMap(sitio => {
    return unidades.flatMap(unidad => {
      const cp = 70;
      const muestraNum = 1;
      const params = PARAMS_BASE[70];
      const ssData = generateSS(params.promedio, sr_base);
      
      return sr_base.map((tss, i) => ({
        id: Math.random(),
        fecha,
        nombreProyecto: `${sitio}-${unidad} Reometría`,
        codigoBPI: `BPI240${10 + fIdx}-${fecha.split('-')[0]}`,
        elemento: sitio === 'Teck' ? 'Fe' : 'Cu',
        tipoMaterial: 'Conc',
        sitio,
        unidad,
        temp: 38,
        densidadMezcla: 1445.22,
        densidadSolido: 3.149,
        pH: 1.82,
        cp,
        cv: 43.4,
        tss,
        ss: ssData[i],
        vis: ssData[i] / tss,
        rpm: Math.round(tss * 1.1),
        fechaMedicion: fecha,
        medicion: "Reometría de Cilindros",
        muestra: `${muestraNum}`,
        m1: params.m1,
        m2: params.m1,
        m3: params.m1,
        promedio: params.promedio
      }));
    });
  });
});
