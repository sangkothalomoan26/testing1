import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Store } from 'lucide-react';

export const Login: React.FC = () => {
    const [isRegistering, setIsRegistering] = useState(false);
    
    // Form state
    const [identifier, setIdentifier] = useState(''); // For login (email or username)
    const [email, setEmail] = useState(''); // For registration
    const [username, setUsername] = useState(''); // For registration
    const [password, setPassword] = useState('');

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, signUp } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isRegistering) {
                await signUp(email, username, password);
            } else {
                await login(identifier, password);
            }
        } catch (err: any) {
            let errorMessage = 'Terjadi kesalahan. Silakan coba lagi.';
            if (err.message.includes("Invalid username or password")) {
                errorMessage = 'Email/Username atau password salah.';
            } else if (err.message.includes("Username is already taken")) {
                errorMessage = 'Username ini sudah digunakan.';
            } else if (err.code === 'auth/email-already-in-use') {
                 errorMessage = 'Alamat email ini sudah terdaftar.';
            } else if (err.code === 'auth/invalid-email') {
                errorMessage = 'Format email tidak valid.';
            } else if (err.code === 'auth/weak-password') {
                errorMessage = 'Password terlalu lemah. Minimal 6 karakter.';
            } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                 errorMessage = 'Email/Username atau password salah.';
            }
            setError(errorMessage);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const toggleForm = () => {
        setIsRegistering(!isRegistering);
        setError('');
        setIdentifier('');
        setEmail('');
        setUsername('');
        setPassword('');
    };
    
    return (
        <div className="flex items-center justify-center min-h-screen bg-light-bg dark:bg-dark-bg">
            <div className="w-full max-w-md p-8 space-y-8 bg-light-card dark:bg-dark-card rounded-xl shadow-2xl border border-white/10">
                <div className="text-center">
                    <div className="flex justify-center items-center gap-3 mb-4">
                        <Store size={40} className="text-gold-500" />
                        <div>
                            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-navy-800 to-navy-700 dark:from-gold-400 dark:to-gold-500">
                                UNI BRILINK
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Voucher Management</p>
                        </div>
                    </div>
                    <h2 className="text-xl text-gray-800 dark:text-gray-200">{isRegistering ? 'Daftar Akun Baru' : 'Silakan Login'}</h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        {isRegistering ? (
                            <>
                                <input name="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-navy-700 placeholder-gray-500 text-gray-900 dark:text-white bg-gray-50 dark:bg-navy-800 rounded-t-md focus:outline-none focus:ring-gold-500 focus:border-gold-500 focus:z-10 sm:text-sm" placeholder="Alamat Email"/>
                                <input name="username" type="text" autoComplete="username" required value={username} onChange={e => setUsername(e.target.value)} className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-navy-700 placeholder-gray-500 text-gray-900 dark:text-white bg-gray-50 dark:bg-navy-800 focus:outline-none focus:ring-gold-500 focus:border-gold-500 focus:z-10 sm:text-sm" placeholder="Username (unik)"/>
                            </>
                        ) : (
                            <input name="identifier" type="text" required value={identifier} onChange={e => setIdentifier(e.target.value)} className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-navy-700 placeholder-gray-500 text-gray-900 dark:text-white bg-gray-50 dark:bg-navy-800 rounded-t-md focus:outline-none focus:ring-gold-500 focus:border-gold-500 focus:z-10 sm:text-sm" placeholder="Email atau Username"/>
                        )}
                        <input name="password" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 dark:border-navy-700 placeholder-gray-500 text-gray-900 dark:text-white bg-gray-50 dark:bg-navy-800 rounded-b-md focus:outline-none focus:ring-gold-500 focus:border-gold-500 focus:z-10 sm:text-sm" placeholder="Password"/>
                    </div>
                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                    <div>
                        <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-navy-900 bg-gold-500 hover:bg-gold-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 disabled:opacity-50">
                            {loading ? 'Memproses...' : (isRegistering ? 'Daftar' : 'Login')}
                        </button>
                    </div>
                </form>
                <div className="text-center">
                    <button onClick={toggleForm} className="text-sm text-gold-500 hover:underline">
                        {isRegistering ? 'Sudah punya akun? Login di sini' : 'Belum punya akun? Daftar sekarang'}
                    </button>
                </div>
            </div>
        </div>
    );
};