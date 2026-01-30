
export type UserRole = 'admin' | 'supervisor' | 'cliente';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface ModelValue {
  eta: number; // Pa*s
  tau: number; // Pa
}

export type ElementoType = 'Cu' | 'Fe';
export type MaterialType = 'Conc' | 'Relave';
export type SitioType = 'MLP' | 'CMDIC' | 'Teck';

export interface ReologyData {
  id: number;
  fecha: string;
  nombreProyecto: string; 
  codigoBPI: string; // Nuevo: Código de pizarra ej BPI24011
  
  // Jerarquía Pizarra
  elemento: ElementoType;
  tipoMaterial: MaterialType;
  sitio: SitioType;
  unidad: string; // STC, 7", 8", CTS
  
  // Parámetros de Cabecera
  temp: number;
  densidadMezcla: number;
  densidadSolido: number;
  pH: number;
  cp: number; 
  cv: number; 
  
  // Datos de Tabla
  tss: number; 
  ss: number;  
  vis: number; 
  rpm: number; 
  
  // Metadatos
  fechaMedicion: string;
  medicion: string;
  muestra: string;
  
  // Modelos
  m1: ModelValue;
  m2: ModelValue;
  m3: ModelValue;
  promedio: ModelValue;
}

export interface Granulometria {
  malla: string;
  micrones: number;
  pasante: number;
}
