
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  LogOut, Layers, BarChart2,
  Archive, Upload,
  Cpu, Loader2, Sparkles,
  GitCompare, Database
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { User, ReologyData, ElementoType, MaterialType, SitioType } from '../types';
import { MOCK_DATA } from '../data/mockData';
// ✅ Importa BrassLogo desde LandingPage (export nombrado)
import { BrassLogo } from './LandingPage';
import { GoogleGenAI } from "@google/genai";

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const BRASS_RED = '#d32f2f';
const COLORS = [BRASS_RED, '#2c3e50', '#e67e22', '#27ae60'];

// Celdas que estás usando del Excel (las mismas que en handleExcelUpload)
const CELL_KEYS = ['B7', 'B65', 'B122', 'T7', 'T65', 'T122', 'AL7', 'AL65', 'AL122', 'BC7', 'BC65', 'BC122'];

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  // Estado para subida de Excel
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [hojasExcel, setHojasExcel] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado para los datos del gráfico extraídos del Excel (modo Reograma)
  const [excelChartData, setExcelChartData] = useState<any[]>([]);
  const [excelSeries, setExcelSeries] = useState<string[]>([]);
  // Guardamos el objeto completo de valores por hoja para recalcular vistas
  const [valoresCeldasPorHoja, setValoresCeldasPorHoja] = useState<any>({});

  // NUEVO: Modo de gráfico y celda seleccionada para vista "Por proyecto"
  const [chartMode, setChartMode] = useState<'reograma' | 'proyecto'>('proyecto');
  const [selectedCell, setSelectedCell] = useState<string>('B7');

  // Estado para campañas reales de la base de datos
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);
  const [campaignDetails, setCampaignDetails] = useState<any | null>(null);

  // Cargar campañas al montar el componente
  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    setLoadingCampaigns(true);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    try {
      const res = await fetch(`${API_URL}/api/campaigns`);
      const data = await res.json();

      if (data.ok) {
        setCampaigns(data.campaigns);
        if (data.campaigns.length > 0) {
          setSelectedCampaign(data.campaigns[0]);
          loadCampaignDetails(data.campaigns[0].id_campana);
        }
      }
    } catch (err) {
      console.error('Error al cargar campañas:', err);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const loadCampaignDetails = async (id_campana: number) => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    try {
      const res = await fetch(`${API_URL}/api/campaign/${id_campana}`);
      const data = await res.json();

      if (data.ok) {
        setCampaignDetails(data);
      }
    } catch (err) {
      console.error('Error al cargar detalles de campaña:', err);
    }
  };

  const handleExcelUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploadMsg(null);
    setUploading(true);
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setUploadMsg('Selecciona un archivo Excel.');
      setUploading(false);
      return;
    }
    const formData = new FormData();
    formData.append('file', file);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    try {
      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.ok) {
        setUploadMsg('Archivo subido y datos guardados correctamente.');
        setHojasExcel(data.hojas); // Guardar todas las hojas recibidas

        if (data.valoresCeldasPorHoja) {
          // Guardamos para recalcular vistas con distintos modos/celdas
          setValoresCeldasPorHoja(data.valoresCeldasPorHoja);

          // Series = nombres de hoja (normalmente, nombres de proyecto)
          const seriesNames: string[] = Object.keys(data.valoresCeldasPorHoja);
          setExcelSeries(seriesNames);

          // ---- Vista "Reograma": filas = celda (B7, T7, etc.), columnas = hoja (proyecto)
          const chartData = CELL_KEYS.map(celda => {
            const punto: any = { celda };
            seriesNames.forEach(hoja => {
              punto[hoja] = data.valoresCeldasPorHoja[hoja][celda] ?? null;
            });
            return punto;
          });
          setExcelChartData(chartData);
        }

        // Recargar campañas después de subir
        loadCampaigns();
      } else {
        setUploadMsg('Error al guardar los datos.');
      }
    } catch (err) {
      setUploadMsg('Error al conectar con el servidor.');
    }
    setUploading(false);
  };

  // Dataset para vista "Por proyecto": X=Proyecto (hoja), Y=valor en la celda seleccionada
  const excelProjectChartData = useMemo(() => {
    if (!valoresCeldasPorHoja || !excelSeries || excelSeries.length === 0) return [];
    return excelSeries.map((hoja: string) => ({
      proyecto: hoja,
      valor: valoresCeldasPorHoja?.[hoja]?.[selectedCell] ?? null
    }));
  }, [valoresCeldasPorHoja, excelSeries, selectedCell]);

  // Navigation Hierarchy (mantenemos para compatibilidad, pero no se usa)
  const [selElemento, setSelElemento] = useState<ElementoType>('Cu');
  const [selTipo, setSelTipo] = useState<MaterialType>('Conc');
  const [selSitio, setSelSitio] = useState<SitioType>('MLP');
  const [selUnidad, setSelUnidad] = useState<string>('STC');

  const [activeTab, setActiveTab] = useState<'general' | 'comparacion' | 'analisis'>('general');
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const handleToggleComparison = (id_campana: string) => {
    setSelectedForComparison(prev =>
      prev.includes(id_campana) ? prev.filter(x => x !== id_campana) : [...prev, id_campana]
    );
  };

  const handleSelectCampaign = (campaign: any) => {
    setSelectedCampaign(campaign);
    loadCampaignDetails(campaign.id_campana);
  };

  return (
    <div className="min-vh-100 bg-[#f4f7f9] d-flex flex-column text-dark" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* NAVBAR */}
      <nav className="bg-white border-bottom px-4 py-2 d-flex align-items-center justify-content-between sticky-top shadow-sm">
        <div className="d-flex align-items-center gap-4">
          <BrassLogo />
          <div className="h-50 border-start ps-3 d-none d-md-block">
            <span className="fw-bold text-muted small text-uppercase tracking-widest">Repositorio Reológico</span>
          </div>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="text-end d-none d-sm-block">
            <div className="fw-bold small">{user.name}</div>
            <div className="text-muted" style={{ fontSize: '10px' }}>{user.role.toUpperCase()}</div>
          </div>
          <button onClick={onLogout} className="btn btn-sm border-2 fw-bold px-3" style={{ borderColor: BRASS_RED, color: BRASS_RED }}>
            <LogOut size={14} className="me-2" /> SALIR
          </button>
        </div>
      </nav>

      <div className="container-fluid py-4 px-lg-5">
        <div className="row g-4 flex-grow-1" style={{ minHeight: 'calc(100vh - 120px)', overflow: 'auto' }}>

          {/* LEFT SIDEBAR */}
          <div className="col-lg-3 col-xl-2">
            <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
              <div className="bg-dark text-white p-3 d-flex align-items-center gap-2">
                <Database size={16} />
                <span className="fw-black small text-uppercase">Navegador</span>
              </div>
              <div className="p-3">
                <label className="text-muted fw-bold x-small text-uppercase mb-2 d-block">Elemento</label>
                <div className="d-flex gap-2 mb-4">
                  {['Cu', 'Fe'].map(e => (
                    <button key={e} onClick={() => setSelElemento(e as ElementoType)} className={`btn btn-sm flex-fill fw-bold ${selElemento === e ? '' : 'btn-light'}`} style={selElemento === e ? { backgroundColor: BRASS_RED, color: 'white' } : {}}>{e}</button>
                  ))}
                </div>

                <label className="text-muted fw-bold x-small text-uppercase mb-2 d-block">Tipo</label>
                <div className="list-group list-group-flush mb-4">
                  {['Conc', 'Relave'].map(t => (
                    <button key={t} onClick={() => setSelTipo(t as MaterialType)} className={`list-group-item list-group-item-action border-0 rounded-2 py-2 mb-1 fw-bold small`} style={selTipo === t ? { backgroundColor: BRASS_RED, color: 'white' } : {}}>
                      {t === 'Conc' ? 'Concentrado' : 'Relave'}
                    </button>
                  ))}
                </div>

                <label className="text-muted fw-bold x-small text-uppercase mb-2 d-block">Sitio</label>
                <div className="list-group list-group-flush mb-4">
                  {['MLP', 'CMDIC', 'Teck'].map(s => (
                    <button key={s} onClick={() => setSelSitio(s as SitioType)} className={`list-group-item list-group-item-action border-0 rounded-2 py-2 mb-1 fw-bold small ${selSitio === s ? 'bg-dark text-white' : ''}`}>
                      {s}
                    </button>
                  ))}
                </div>

                <label className="text-muted fw-bold x-small text-uppercase mb-2 d-block">Unidad / Línea</label>
                <div className="d-grid gap-1">
                  {['STC', '7"', '8"', 'CTS'].map(u => (
                    <button key={u} onClick={() => setSelUnidad(u)} className={`btn btn-sm text-start fw-bold ${selUnidad === u ? '' : 'btn-light'}`} style={selUnidad === u ? { backgroundColor: BRASS_RED, color: 'white', borderColor: BRASS_RED } : {}}>
                      {u}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="col-lg-9 col-xl-10">
            {selectedCampaign ? (
              <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                {/* HEADER */}
                <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden border-top border-5" style={{ borderColor: BRASS_RED }}>
                  <div className="card-body p-4 bg-white">
                    <div className="d-flex flex-wrap justify-content-between align-items-start gap-4">
                      <div>
                        <div className="d-flex align-items-center gap-2 fw-black h2 mb-1 tracking-tighter" style={{ color: BRASS_RED }}>
                          {selectedCampaign.nombre}
                          <div className="bg-light text-dark px-3 py-1 rounded-pill fw-bold h6 mb-0 ms-3 border">
                            {activeTab === 'analisis' ? 'Análisis Activo' : 'Visualización'}
                          </div>
                        </div>
                        <div className="h4 fw-bold text-muted opacity-75">ID: {selectedCampaign.id_campana}</div>
                        <div className="mt-3 d-flex gap-3">
                          <span className="badge bg-dark px-3 py-2 fw-bold uppercase">Eta: {selectedCampaign.eta_promedio?.toFixed(3) || 'N/A'}</span>
                          <span className="badge bg-secondary px-3 py-2 fw-bold uppercase">Tau: {selectedCampaign.tau_promedio?.toFixed(2) || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="bg-light p-3 rounded-4 d-flex gap-4 border shadow-sm">
                        <div className="text-center px-3 border-end">
                          <div className="text-muted x-small fw-black uppercase">Concentración</div>
                          <div className="h4 fw-black mb-0">Cp {selectedCampaign.cp}%</div>
                        </div>
                        <div className="text-center px-3 border-end">
                          <div className="text-muted x-small fw-black uppercase">Campañas</div>
                          <div className="h4 fw-black mb-0">{campaigns.length}</div>
                        </div>
                        <div className="text-center px-3">
                          <div className="text-muted x-small fw-black uppercase">Mediciones</div>
                          <div className="h4 fw-black mb-0">{campaignDetails?.mediciones?.length || 0}</div>
                        </div>
                      </div>
                    </div>

                    <hr className="my-4 opacity-10" />

                    {/* TABS */}
                    <div className="d-flex gap-2">
                      <button onClick={() => setActiveTab('general')} className={`btn fw-bold px-4 py-2 rounded-pill ${activeTab === 'general' ? '' : 'btn-light'}`} style={activeTab === 'general' ? { backgroundColor: BRASS_RED, color: 'white' } : {}}>
                        <BarChart2 size={16} className="me-2" /> DATOS
                      </button>
                      <button onClick={() => setActiveTab('analisis')} className={`btn fw-bold px-4 py-2 rounded-pill ${activeTab === 'analisis' ? '' : 'btn-light'}`} style={activeTab === 'analisis' ? { backgroundColor: BRASS_RED, color: 'white' } : {}}>
                        <Cpu size={16} className="me-2" /> ANÁLISIS IA
                      </button>
                      <button onClick={() => setActiveTab('comparacion')} className={`btn fw-bold px-4 py-2 rounded-pill ${activeTab === 'comparacion' ? '' : 'btn-light'}`} style={activeTab === 'comparacion' ? { backgroundColor: BRASS_RED, color: 'white' } : {}}>
                        <GitCompare size={16} className="me-2" /> COMPARACIÓN
                      </button>
                    </div>
                  </div>
                </div>

                {/* CONTENT */}
                {activeTab === 'general' && (
                  <div className="row g-4 animate-in fade-in duration-700">
                    <div className="col-lg-8">
                      {/* Formulario de subida de Excel */}
                      <div className="mb-4">
                        <form onSubmit={handleExcelUpload} className="d-flex flex-column align-items-start gap-3 bg-white p-3 rounded shadow-sm border" style={{ maxWidth: 600 }}>
                          <input type="file" accept=".xlsx,.xls" ref={fileInputRef} className="form-control mb-4" required disabled={uploading} style={{ maxWidth: '100%' }} />
                          <button type="submit" className="btn" style={{ backgroundColor: BRASS_RED, color: 'white', fontWeight: 'bold', alignSelf: 'flex-end', minWidth: 140, fontSize: 16, padding: '10px 0' }} disabled={uploading}>
                            {uploading ? 'Subiendo...' : 'Subir Excel'}
                          </button>
                          {uploadMsg && <span className="mt-2 small fw-bold" style={{ color: BRASS_RED, fontWeight: 'bold' }}>{uploadMsg}</span>}
                        </form>
                      </div>

                      {/* Card principal con el gráfico */}
                      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 h-100 bg-white">
                        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                          <h6 className="fw-black text-muted uppercase mb-0 tracking-widest">Reograma Dinámico</h6>

                          {/* Controles de modo y celda */}
                          <div className="d-flex align-items-center gap-2">
                            <div className="btn-group" role="group" aria-label="chart-mode">
                              <button
                                className={`btn btn-sm ${chartMode === 'reograma' ? '' : 'btn-light'} fw-bold`}
                                style={chartMode === 'reograma' ? { backgroundColor: BRASS_RED, color: 'white' } : {}}
                                onClick={() => setChartMode('reograma')}
                              >
                                Curva
                              </button>
                              <button
                                className={`btn btn-sm ${chartMode === 'proyecto' ? '' : 'btn-light'} fw-bold`}
                                style={chartMode === 'proyecto' ? { backgroundColor: BRASS_RED, color: 'white' } : {}}
                                onClick={() => setChartMode('proyecto')}
                              >
                                Por proyecto
                              </button>
                            </div>
                            {chartMode === 'proyecto' && excelSeries.length > 0 && (
                              <select
                                className="form-select form-select-sm fw-bold"
                                value={selectedCell}
                                onChange={(e) => setSelectedCell(e.target.value)}
                              >
                                {CELL_KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                              </select>
                            )}
                          </div>
                        </div>

                        <div style={{ height: '450px', minWidth: '300px' }}>
                          <ResponsiveContainer width="100%" height={400} minWidth={300}>
                            {/* --- Si hay Excel cargado --- */}
                            {excelChartData.length > 0 ? (
                              chartMode === 'reograma' ? (
                                <LineChart data={excelChartData}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                  <XAxis
                                    dataKey="celda"
                                    label={{ value: 'Celda', position: 'insideBottom', offset: -5, fontSize: 10 }}
                                    fontSize={10}
                                  />
                                  <YAxis label={{ value: 'Valor', angle: -90, position: 'insideLeft', fontSize: 10 }} fontSize={10} />
                                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                  <Legend />
                                  {excelSeries.map((serie, idx) => (
                                    <Line
                                      key={serie}
                                      type="monotone"
                                      dataKey={serie}
                                      stroke={COLORS[idx % COLORS.length]}
                                      strokeWidth={3}
                                      dot={{ r: 4, fill: COLORS[idx % COLORS.length] }}
                                      activeDot={{ r: 8 }}
                                      name={serie}
                                    />
                                  ))}
                                </LineChart>
                              ) : (
                                // Vista por proyecto: X = nombre de proyecto (hoja), Y = valor de la celda seleccionada
                                <LineChart data={excelProjectChartData}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                  <XAxis
                                    dataKey="proyecto"
                                    label={{ value: 'Proyecto', position: 'insideBottom', offset: -5, fontSize: 10 }}
                                    fontSize={10}
                                    interval={0}
                                    tick={{ fontSize: 10 }}
                                  />
                                  <YAxis label={{ value: 'Valor', angle: -90, position: 'insideLeft', fontSize: 10 }} fontSize={10} />
                                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                  <Legend />
                                  <Line
                                    type="monotone"
                                    dataKey="valor"
                                    stroke={BRASS_RED}
                                    strokeWidth={4}
                                    dot={{ r: 4, fill: BRASS_RED }}
                                    activeDot={{ r: 8 }}
                                    name={`Celda ${selectedCell}`}
                                  />
                                </LineChart>
                              )
                            ) : (
                              // --- Sin Excel: usa mediciones de la campaña seleccionada ---
                              <LineChart data={campaignDetails?.mediciones || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                <XAxis
                                  dataKey="sr"
                                  label={{ value: 'Shear Rate (1/s)', position: 'insideBottom', offset: -5, fontSize: 10 }}
                                  fontSize={10}
                                />
                                <YAxis
                                  label={{ value: 'Shear Stress (Pa)', angle: -90, position: 'insideLeft', fontSize: 10 }}
                                  fontSize={10}
                                />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Legend />
                                <Line type="monotone" dataKey="shear_stress" stroke={BRASS_RED} strokeWidth={4} dot={{ r: 4, fill: BRASS_RED }} activeDot={{ r: 8 }} name={selectedCampaign?.nombre} />
                              </LineChart>
                            )}
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    <div className="col-lg-4">
                      {/* COMPONENT SELECTOR */}
                      <div className="card border-0 shadow-sm rounded-4 mb-4 bg-white overflow-hidden">
                        <div className="bg-dark text-white p-3 d-flex align-items-center gap-2">
                          <Layers size={16} />
                          <span className="fw-black small text-uppercase">Campaña / Muestras</span>
                        </div>
                        <div className="p-0">
                          <div className="list-group list-group-flush">
                            {campaigns.map((campaign, idx) => {
                              const isSelected = selectedForComparison.includes(String(campaign.id_campana));
                              const isCurrent = selectedCampaign?.id_campana === campaign.id_campana;
                              return (
                                <div
                                  key={idx}
                                  className={`list-group-item p-3 d-flex align-items-center justify-content-between border-bottom ${isCurrent ? 'bg-light' : ''}`}
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => handleSelectCampaign(campaign)}
                                >
                                  <div>
                                    <div className="fw-bold mb-0">{campaign.nombre}</div>
                                    <div className="text-muted x-small">ID: {campaign.id_campana} • Cp: {campaign.cp}%</div>
                                  </div>
                                  <div className="form-check">
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        handleToggleComparison(String(campaign.id_campana));
                                      }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        {selectedForComparison.length >= 2 && (
                          <div className="p-3 bg-light text-center border-top">
                            <button className="btn btn-dark w-100 fw-bold" onClick={() => setActiveTab('comparacion')}>
                              COMPARAR SELECCIONADOS
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
                        <h6 className="fw-black text-muted uppercase mb-3 small">Parámetros Bingham</h6>
                        <table className="table table-sm table-bordered text-center align-middle mb-0" style={{ fontSize: '13px' }}>
                          <thead className="bg-light">
                            <tr>
                              <th>Parámetro</th>
                              <th>Valor</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="text-start ps-3 fw-bold">Eta (Pa*s)</td>
                              <td className="fw-black" style={{ color: BRASS_RED }}>{selectedCampaign.eta_promedio?.toFixed(3) || 'N/A'}</td>
                            </tr>
                            <tr>
                              <td className="text-start ps-3 fw-bold">Tau (Pa)</td>
                              <td className="fw-black" style={{ color: BRASS_RED }}>{selectedCampaign.tau_promedio?.toFixed(2) || 'N/A'}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'comparacion' && (
                  <div className="animate-in slide-in-from-bottom-5 duration-500">
                    <div className="card border-0 shadow-sm rounded-4 p-5 bg-white text-center">
                      <GitCompare size={48} className="text-muted mb-3 mx-auto" />
                      <h4 className="fw-black uppercase">Vista Comparativa Multivariable</h4>
                      <p className="text-muted">Análisis de superposición de curvas para las {selectedForComparison.length} muestras seleccionadas.</p>
                      <div className="alert alert-warning d-inline-block border-2 mx-auto">
                        <strong>Próxima Actualización:</strong> Motor de comparación multivariante en desarrollo.
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'analisis' && (
                  <div className="animate-in fade-in duration-500">
                    <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
                      <div className="card-header bg-dark text-white py-3 px-4 d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2">
                          <Sparkles size={18} className="text-warning" />
                          <span className="fw-black text-uppercase tracking-wider small">Asistente Técnico IA</span>
                        </div>
                      </div>
                      <div className="card-body p-4" style={{ minHeight: '400px' }}>
                        <div className="row g-4 align-items-center">
                          <div className="col-md-5 text-center p-5 border-end">
                            <Upload size={64} className="text-muted mb-3" />
                            <h5 className="fw-black uppercase">Validar con Gemini</h5>
                            <p className="small text-muted mb-4">Sube un archivo técnico para comparar resultados históricos vs actuales.</p>
                            <button className="btn btn-dark fw-bold px-4 py-3 rounded-pill" onClick={() => setIsAnalyzing(true)}>
                              INICIAR ANÁLISIS DE DATOS
                            </button>
                          </div>
                          <div className="col-md-7 p-4">
                            {isAnalyzing ? (
                              <div className="text-center py-5">
                                <Loader2 size={40} className="animate-spin mb-3 mx-auto" style={{ color: BRASS_RED }} />
                                <h6 className="fw-bold">Generando reporte de validez...</h6>
                              </div>
                            ) : (
                              <div className="p-4 bg-light rounded-4 border-start border-4" style={{ borderColor: BRASS_RED }}>
                                <h6 className="fw-black small text-uppercase mb-2" style={{ color: BRASS_RED }}>Reporte MLP-STC Actual</h6>
                                <p className="small mb-0 opacity-75">
                                  Reología estable bajo modelo Bingham. Se observa viscosidad dentro de rangos operacionales para Cp=70%. Sin desviaciones críticas detectadas en el histórico BPI.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-100 d-flex flex-column align-items-center justify-content-center py-5">
                <Archive size={64} className="text-muted opacity-20 mb-4" />
                <h4 className="fw-bold text-muted">No hay datos para la selección actual</h4>
                <p className="text-muted">Ajuste los filtros del navegador izquierdo.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="mt-auto bg-dark text-white text-opacity-50 py-4 border-top border-4" style={{ borderColor: BRASS_RED }}>
        <div className="container-fluid px-5 d-flex justify-content-between align-items-center">
          <div className="scale-75 origin-left"><BrassLogo light={true} /></div>
          <div className="text-end small" style={{ fontSize: '10px' }}>
            BRASS &copy; 2026 • INTEGRACIÓN DEPARTAMENTAL I+D / HIDRÁULICA • DATA ENG.
          </div>
        </div>
      </footer>

      <style>{`
        .x-small { font-size: 10px; }
        .fw-black { font-weight: 800; }
        .tracking-tighter { letter-spacing: -0.05em; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Dashboard;
