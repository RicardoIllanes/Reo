import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Edit2, Trash2, X, Save, Shield, User as UserIcon } from 'lucide-react';

interface Usuario {
    id: number;
    username: string;
    nombre_completo: string;
    email: string;
    rol: 'admin' | 'usuario';
    activo: boolean;
    created_at: string;
}

interface AdminPanelProps {
    onClose: () => void;
}

const BRASS_RED = '#d32f2f';

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState<Usuario | null>(null);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        nombreCompleto: '',
        email: '',
        rol: 'usuario' as 'admin' | 'usuario'
    });
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

    useEffect(() => {
        loadUsuarios();
    }, []);

    const loadUsuarios = async () => {
        try {
            const response = await fetch(`${API_URL}/api/users`, {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.ok) {
                setUsuarios(data.usuarios);
            }
        } catch (err) {
            console.error('Error cargando usuarios:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        try {
            const url = editingUser
                ? `${API_URL}/api/users/${editingUser.id}`
                : `${API_URL}/api/users`;

            const method = editingUser ? 'PUT' : 'POST';

            const body: any = {
                nombreCompleto: formData.nombreCompleto,
                email: formData.email,
                rol: formData.rol
            };

            if (!editingUser) {
                body.username = formData.username;
                body.password = formData.password;
            } else if (formData.password) {
                body.password = formData.password;
            }

            if (editingUser) {
                body.activo = true; // Mantener activo por defecto
            }

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (data.ok) {
                setMessage({ type: 'success', text: editingUser ? 'Usuario actualizado' : 'Usuario creado' });
                loadUsuarios();
                resetForm();
                setTimeout(() => setShowForm(false), 1500);
            } else {
                setMessage({ type: 'error', text: data.error || 'Error al guardar usuario' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Error de conexión' });
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar este usuario?')) return;

        try {
            const response = await fetch(`${API_URL}/api/users/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            const data = await response.json();

            if (data.ok) {
                setMessage({ type: 'success', text: 'Usuario eliminado' });
                loadUsuarios();
            } else {
                setMessage({ type: 'error', text: data.error || 'Error al eliminar' });
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'Error de conexión' });
        }
    };

    const resetForm = () => {
        setFormData({
            username: '',
            password: '',
            nombreCompleto: '',
            email: '',
            rol: 'usuario'
        });
        setEditingUser(null);
    };

    const startEdit = (user: Usuario) => {
        setEditingUser(user);
        setFormData({
            username: user.username,
            password: '',
            nombreCompleto: user.nombre_completo,
            email: user.email,
            rol: user.rol
        });
        setShowForm(true);
    };

    return (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
            <div className="bg-white rounded-4 shadow-lg" style={{ width: '90%', maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }}>
                {/* Header */}
                <div className="p-4 border-bottom d-flex justify-content-between align-items-center" style={{ backgroundColor: BRASS_RED }}>
                    <div className="d-flex align-items-center gap-2 text-white">
                        <Users size={24} />
                        <h4 className="mb-0 fw-bold">Administración de Usuarios</h4>
                    </div>
                    <button onClick={onClose} className="btn btn-light btn-sm rounded-circle" style={{ width: '32px', height: '32px', padding: 0 }}>
                        <X size={18} />
                    </button>
                </div>

                {/* Message */}
                {message && (
                    <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} m-3 mb-0`} role="alert">
                        {message.text}
                    </div>
                )}

                {/* Content */}
                <div className="p-4">
                    {/* Add User Button */}
                    {!showForm && (
                        <button
                            onClick={() => { resetForm(); setShowForm(true); }}
                            className="btn text-white fw-bold mb-3"
                            style={{ backgroundColor: BRASS_RED }}
                        >
                            <UserPlus size={18} className="me-2" />
                            Agregar Usuario
                        </button>
                    )}

                    {/* Form */}
                    {showForm && (
                        <div className="card mb-4 border-2" style={{ borderColor: BRASS_RED }}>
                            <div className="card-body">
                                <h5 className="card-title mb-3">{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h5>
                                <form onSubmit={handleSubmit}>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label fw-bold">Usuario *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.username}
                                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                                required
                                                disabled={!!editingUser}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label fw-bold">Contraseña {!editingUser && '*'}</label>
                                            <input
                                                type="password"
                                                className="form-control"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                required={!editingUser}
                                                placeholder={editingUser ? 'Dejar vacío para no cambiar' : ''}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label fw-bold">Nombre Completo</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={formData.nombreCompleto}
                                                onChange={(e) => setFormData({ ...formData, nombreCompleto: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label fw-bold">Email</label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label fw-bold">Rol *</label>
                                            <select
                                                className="form-select"
                                                value={formData.rol}
                                                onChange={(e) => setFormData({ ...formData, rol: e.target.value as 'admin' | 'usuario' })}
                                                required
                                            >
                                                <option value="usuario">Usuario</option>
                                                <option value="admin">Administrador</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="d-flex gap-2">
                                        <button type="submit" className="btn text-white" style={{ backgroundColor: BRASS_RED }}>
                                            <Save size={18} className="me-2" />
                                            Guardar
                                        </button>
                                        <button type="button" onClick={() => { resetForm(); setShowForm(false); }} className="btn btn-secondary">
                                            Cancelar
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Users Table */}
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border" style={{ color: BRASS_RED }} role="status">
                                <span className="visually-hidden">Cargando...</span>
                            </div>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead style={{ backgroundColor: '#f8f9fa' }}>
                                    <tr>
                                        <th>Usuario</th>
                                        <th>Nombre</th>
                                        <th>Email</th>
                                        <th>Rol</th>
                                        <th>Estado</th>
                                        <th>Creado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usuarios.map((user) => (
                                        <tr key={user.id}>
                                            <td className="fw-bold">{user.username}</td>
                                            <td>{user.nombre_completo || '-'}</td>
                                            <td>{user.email || '-'}</td>
                                            <td>
                                                {user.rol === 'admin' ? (
                                                    <span className="badge bg-danger">
                                                        <Shield size={14} className="me-1" />
                                                        Admin
                                                    </span>
                                                ) : (
                                                    <span className="badge bg-secondary">
                                                        <UserIcon size={14} className="me-1" />
                                                        Usuario
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`badge ${user.activo ? 'bg-success' : 'bg-secondary'}`}>
                                                    {user.activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <button
                                                        onClick={() => startEdit(user)}
                                                        className="btn btn-sm btn-outline-primary"
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user.id)}
                                                        className="btn btn-sm btn-outline-danger"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {usuarios.length === 0 && (
                                <div className="text-center text-muted py-4">
                                    No hay usuarios registrados
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
