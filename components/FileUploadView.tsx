import React, { useState, useRef } from 'react';
import { Upload, FileText, X, Check, AlertCircle, Cloud } from 'lucide-react';

interface FileUploadViewProps {
    onFileSelect: (file: File) => void;
    onCancel?: () => void;
    acceptedFormats?: string[];
    maxSizeMB?: number;
}

const BRASS_RED = '#d32f2f';
const BRASS_BLUE = '#1976d2';

export const FileUploadView: React.FC<FileUploadViewProps> = ({
    onFileSelect,
    onCancel,
    acceptedFormats = ['.xlsx', '.xls'],
    maxSizeMB = 10
}) => {
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const validateFile = (file: File): boolean => {
        setError('');

        // Validar extensión
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!acceptedFormats.includes(extension)) {
            setError(`Formato no válido. Solo se aceptan: ${acceptedFormats.join(', ')}`);
            return false;
        }

        // Validar tamaño
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > maxSizeMB) {
            setError(`El archivo es demasiado grande. Máximo ${maxSizeMB}MB`);
            return false;
        }

        return true;
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (validateFile(file)) {
                setSelectedFile(file);
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (validateFile(file)) {
                setSelectedFile(file);
            }
        }
    };

    const handleSubmit = () => {
        if (selectedFile) {
            onFileSelect(selectedFile);
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
            <div className="bg-white rounded-4 shadow-lg" style={{ width: '90%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' }}>
                {/* Header */}
                <div className="p-4 border-bottom d-flex justify-content-between align-items-center" style={{ backgroundColor: BRASS_BLUE }}>
                    <div className="d-flex align-items-center gap-2 text-white">
                        <Upload size={24} />
                        <h5 className="mb-0 fw-bold">Subir archivo</h5>
                    </div>
                    {onCancel && (
                        <button onClick={onCancel} className="btn btn-light btn-sm rounded-circle" style={{ width: '32px', height: '32px', padding: 0 }}>
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="p-5">
                    {!selectedFile ? (
                        <>
                            {/* Vista 1: Seleccionar archivo */}
                            <div className="text-center mb-4">
                                <h6 className="fw-bold mb-3">Seleccionar archivo</h6>
                            </div>

                            {/* Drag & Drop Area */}
                            <div
                                className={`border-2 border-dashed rounded-4 p-5 text-center mb-4 ${dragActive ? 'border-primary bg-light' : 'border-secondary'}`}
                                style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Cloud size={64} className="text-muted mb-3" />
                                <p className="fw-bold mb-2">Seleccione y arrastre los archivos o</p>
                                <button className="btn btn-outline-primary btn-sm mb-3">
                                    haga clic para cargar
                                </button>
                                <p className="text-muted small mb-0">
                                    Formatos admitidos: {acceptedFormats.join(', ')}
                                </p>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept={acceptedFormats.join(',')}
                                onChange={handleChange}
                                style={{ display: 'none' }}
                            />

                            {/* Información adicional */}
                            <div className="bg-light rounded-3 p-3">
                                <p className="small mb-2 fw-bold">Vídeos predeterminados de subida</p>
                                <div className="form-check mb-1">
                                    <input className="form-check-input" type="radio" name="uploadOption" id="option1" defaultChecked />
                                    <label className="form-check-label small" htmlFor="option1">
                                        Ir a mi unidad
                                    </label>
                                </div>
                                <div className="form-check mb-1">
                                    <input className="form-check-input" type="radio" name="uploadOption" id="option2" />
                                    <label className="form-check-label small" htmlFor="option2">
                                        No cargar
                                    </label>
                                </div>
                                <div className="form-check mb-1">
                                    <input className="form-check-input" type="radio" name="uploadOption" id="option3" />
                                    <label className="form-check-label small" htmlFor="option3">
                                        Acceder a carpeta
                                    </label>
                                </div>
                                <div className="form-check">
                                    <input className="form-check-input" type="radio" name="uploadOption" id="option4" />
                                    <label className="form-check-label small" htmlFor="option4">
                                        Acceder a una subcarpeta
                                    </label>
                                </div>
                            </div>

                            {error && (
                                <div className="alert alert-danger d-flex align-items-center mt-3" role="alert">
                                    <AlertCircle size={20} className="me-2" />
                                    {error}
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {/* Vista 2: Archivo seleccionado */}
                            <div className="text-center mb-4">
                                <h6 className="fw-bold mb-3">Mi selección</h6>
                                <p className="text-muted small">Carpetas/Archivos (todos.pdf)</p>
                            </div>

                            {/* Archivo seleccionado */}
                            <div className="border rounded-3 p-3 mb-4">
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <div className="d-flex align-items-center gap-2">
                                        <FileText size={24} className="text-primary" />
                                        <div>
                                            <p className="mb-0 fw-bold small">{selectedFile.name}</p>
                                            <p className="mb-0 text-muted x-small">
                                                {(selectedFile.size / 1024).toFixed(2)} KB
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleRemoveFile}
                                        className="btn btn-sm btn-outline-danger"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                <div className="form-check mb-2">
                                    <input className="form-check-input" type="checkbox" id="convertPDF" />
                                    <label className="form-check-label small" htmlFor="convertPDF">
                                        Convertir archivos en formato PDF
                                    </label>
                                </div>
                                <div className="form-check mb-2">
                                    <input className="form-check-input" type="checkbox" id="organizeFolder" defaultChecked />
                                    <label className="form-check-label small" htmlFor="organizeFolder">
                                        Organizar por carpeta
                                    </label>
                                </div>
                                <div className="form-check mb-2">
                                    <input className="form-check-input" type="checkbox" id="accessSubfolder" />
                                    <label className="form-check-label small" htmlFor="accessSubfolder">
                                        Acceder a una subcarpeta
                                    </label>
                                </div>
                                <div className="form-check">
                                    <input className="form-check-input" type="checkbox" id="uploadVideo" />
                                    <label className="form-check-label small" htmlFor="uploadVideo">
                                        Subir vídeo
                                    </label>
                                </div>
                            </div>

                            {/* Versiones */}
                            <div className="mb-4">
                                <p className="small fw-bold mb-2">Versiones</p>
                                <div className="list-group">
                                    <div className="list-group-item d-flex justify-content-between align-items-center">
                                        <span className="small">Análisis.pdf</span>
                                        <div className="d-flex gap-2">
                                            <button className="btn btn-sm btn-outline-secondary">
                                                <Check size={14} />
                                            </button>
                                            <button className="btn btn-sm btn-outline-secondary">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="list-group-item d-flex justify-content-between align-items-center">
                                        <span className="small">Digitalizar un nuevo archivo.pdf</span>
                                        <div className="d-flex gap-2">
                                            <button className="btn btn-sm btn-outline-secondary">
                                                <Check size={14} />
                                            </button>
                                            <button className="btn btn-sm btn-outline-secondary">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="list-group-item d-flex justify-content-between align-items-center">
                                        <span className="small">Solicitud Permiso.pdf</span>
                                        <div className="d-flex gap-2">
                                            <button className="btn btn-sm btn-outline-secondary">
                                                <Check size={14} />
                                            </button>
                                            <button className="btn btn-sm btn-outline-secondary">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="list-group-item d-flex justify-content-between align-items-center">
                                        <span className="small">Tema de Firma Electrónica y Lógica Notarial.pdf</span>
                                        <div className="d-flex gap-2">
                                            <button className="btn btn-sm btn-outline-secondary">
                                                <Check size={14} />
                                            </button>
                                            <button className="btn btn-sm btn-outline-secondary">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Botones de acción */}
                            <div className="d-flex gap-2 justify-content-end">
                                <button
                                    onClick={handleRemoveFile}
                                    className="btn btn-outline-secondary"
                                >
                                    Cancelar selección
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    className="btn text-white"
                                    style={{ backgroundColor: BRASS_BLUE }}
                                >
                                    Subir
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <style>{`
        .x-small { font-size: 10px; }
      `}</style>
        </div>
    );
};

export default FileUploadView;
