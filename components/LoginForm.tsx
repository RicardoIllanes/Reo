import React, { useState } from 'react';
import { LogIn, User as UserIcon, Lock } from 'lucide-react';
import { User } from '../types';

interface LoginFormProps {
    onLogin: (user: User) => void;
}

const BRASS_RED = '#d32f2f';

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Simulación de autenticación (puedes reemplazar con llamada a API real)
        setTimeout(() => {
            // Credenciales de ejemplo - CAMBIAR EN PRODUCCIÓN
            if (username === 'admin' && password === 'admin123') {
                onLogin({
                    name: 'Administrador',
                    role: 'admin',
                    email: 'admin@brass.cl'
                });
            } else if (username === 'usuario' && password === 'usuario123') {
                onLogin({
                    name: 'Usuario',
                    role: 'user',
                    email: 'usuario@brass.cl'
                });
            } else {
                setError('Usuario o contraseña incorrectos');
                setIsLoading(false);
            }
        }, 800);
    };

    return (
        <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-md-5 col-lg-4">
                        <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
                            {/* Header */}
                            <div className="card-header text-white text-center py-4 border-0" style={{ background: BRASS_RED }}>
                                <div className="mb-3">
                                    <LogIn size={48} className="mx-auto" />
                                </div>
                                <h4 className="fw-bold mb-1">BRASS Chile S.A.</h4>
                                <p className="small mb-0 opacity-90">Sistema de Repositorio Reológico</p>
                            </div>

                            {/* Body */}
                            <div className="card-body p-4">
                                <form onSubmit={handleSubmit}>
                                    {/* Username */}
                                    <div className="mb-3">
                                        <label htmlFor="username" className="form-label fw-bold small text-muted">
                                            <UserIcon size={14} className="me-1" />
                                            Usuario
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control form-control-lg"
                                            id="username"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="Ingrese su usuario"
                                            required
                                            disabled={isLoading}
                                            autoFocus
                                        />
                                    </div>

                                    {/* Password */}
                                    <div className="mb-4">
                                        <label htmlFor="password" className="form-label fw-bold small text-muted">
                                            <Lock size={14} className="me-1" />
                                            Contraseña
                                        </label>
                                        <input
                                            type="password"
                                            className="form-control form-control-lg"
                                            id="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Ingrese su contraseña"
                                            required
                                            disabled={isLoading}
                                        />
                                    </div>

                                    {/* Error Message */}
                                    {error && (
                                        <div className="alert alert-danger py-2 small mb-3" role="alert">
                                            <strong>Error:</strong> {error}
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        className="btn btn-lg w-100 text-white fw-bold"
                                        style={{ backgroundColor: BRASS_RED }}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Iniciando sesión...
                                            </>
                                        ) : (
                                            <>
                                                <LogIn size={18} className="me-2" />
                                                INICIAR SESIÓN
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>

                            {/* Footer */}
                            <div className="card-footer bg-light border-0 py-3">
                                <div className="small text-muted text-center">
                                    <p className="mb-2"><strong>Credenciales de prueba:</strong></p>
                                    <p className="mb-1">👤 Admin: <code>admin / admin123</code></p>
                                    <p className="mb-0">👤 Usuario: <code>usuario / usuario123</code></p>
                                </div>
                            </div>
                        </div>

                        {/* Additional Info */}
                        <div className="text-center mt-4 text-white">
                            <p className="small opacity-75 mb-0">
                                © 2026 BRASS Chile S.A. • Todos los derechos reservados
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;
