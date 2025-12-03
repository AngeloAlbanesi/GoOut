import React, { useEffect, useState } from 'react';
import { userService } from '../services/api';

function UserSearchPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    function parseApiError(err) {
        const data = err?.response?.data;
        if (!data) return err?.message || String(err);
        const parts = [];
        if (data.message) parts.push(data.message);
        if (data.error) parts.push(data.error);
        if (data.errore) parts.push(data.errore);
        if (data.detail) parts.push(data.detail);
        return parts.join(' — ') || JSON.stringify(data);
    }

    useEffect(() => {
        let cancelled = false;

        const fetchUsers = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await userService.searchUsers(query);
                if (!cancelled) {
                    setResults(res.data || []);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(parseApiError(err));
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        const timeoutId = setTimeout(fetchUsers, 300); // debounce

        return () => {
            cancelled = true;
            clearTimeout(timeoutId);
        };
    }, [query]);

    return (
        <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-10">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-[#09090b] tracking-tight mb-3">Cerca utenti</h1>
                    <p className="text-sm text-gray-600 max-w-xl mx-auto font-light">
                        Trova altre persone su GoOut cercando per username o email.
                    </p>
                </div>

                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-8">
                    <div className="mb-6">
                        <label htmlFor="user-search" className="block text-sm font-semibold text-[#09090b] mb-2">
                            Cerca
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="text-gray-400">🔍</span>
                            </div>
                            <input
                                id="user-search"
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Inserisci username o email..."
                                className="appearance-none block w-full pl-11 px-4 py-3.5 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#09090b] focus:border-transparent bg-gray-50 text-[#09090b] transition-all text-base hover:bg-gray-100 focus:bg-white"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 p-4 rounded-xl">
                            <p className="text-sm text-red-700 font-medium">{error}</p>
                        </div>
                    )}

                    {loading && (
                        <div className="flex items-center justify-center py-6">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#09090b]"></div>
                        </div>
                    )}

                    {!loading && !error && results.length === 0 && (
                        <div className="py-6 text-center text-sm text-gray-500">
                            Nessun utente trovato.
                        </div>
                    )}

                    {!loading && !error && results.length > 0 && (
                        <ul className="divide-y divide-gray-100 mt-2">
                            {results.map((user) => (
                                <li key={user.id} className="py-4 flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-[#09090b] flex items-center justify-center text-white text-lg font-bold">
                                        {user.username?.charAt(0)?.toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-[#09090b] truncate">{user.username}</p>
                                        {user.bio && (
                                            <p className="text-xs text-gray-500 truncate">{user.bio}</p>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}

export default UserSearchPage;
