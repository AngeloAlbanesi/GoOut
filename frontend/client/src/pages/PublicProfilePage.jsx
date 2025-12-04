import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { userService } from '../services/api';

const API_BASE_URL = 'http://localhost:3001';

function PublicProfilePage() {
    const { id } = useParams();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await userService.getPublicProfile(id);
                setProfileData(res.data);
            } catch (err) {
                console.error("Errore nel recupero profilo pubblico:", err);
                setError("Impossibile caricare il profilo.");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProfile();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#09090b]"></div>
            </div>
        );
    }

    if (error || !profileData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900">Utente non trovato</h2>
                    <Link to="/utenti" className="text-[#09090b] hover:underline mt-4 block">Torna alla ricerca</Link>
                </div>
            </div>
        );
    }

    const getProfileImageUrl = () => {
        if (profileData?.profilePictureUrl) {
            return `${API_BASE_URL}${profileData.profilePictureUrl}`;
        }
        return null;
    };

    return (
        <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-16">

                {/* Header Profilo Pubblico */}
                <div className="bg-white rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center md:items-start gap-10 border border-gray-100 shadow-sm">
                    <div className="h-32 w-32 rounded-full bg-[#09090b] flex items-center justify-center text-white text-5xl font-bold shadow-xl shrink-0 overflow-hidden">
                        {getProfileImageUrl() ? (
                            <img src={getProfileImageUrl()} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            profileData.username?.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div className="flex-1 text-center md:text-left space-y-4">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-[#09090b] tracking-tight mb-2">
                                {profileData.username}
                            </h2>
                            {profileData.bio && (
                                <p className="text-gray-500 text-lg max-w-2xl font-light">
                                    {profileData.bio}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-wrap justify-center md:justify-start gap-8 pt-2">
                            <div className="flex flex-col">
                                <span className="text-3xl font-bold text-[#09090b]">{profileData.createdEvents?.length || 0}</span>
                                <span className="text-sm text-gray-500 font-medium">Eventi Creati</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Eventi Creati Section */}
                <div className="space-y-8">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-6">
                        <h2 className="text-3xl font-bold text-[#09090b] tracking-tight">
                            Eventi Creati da {profileData.username}
                        </h2>
                    </div>

                    {!profileData.createdEvents || profileData.createdEvents.length === 0 ? (
                        <div className="bg-gray-50 rounded-3xl p-16 text-center border border-gray-100">
                            <p className="text-gray-500 text-xl font-light">Nessun evento creato.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {profileData.createdEvents.map(event => (
                                <div key={event.id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col group overflow-hidden">
                                    <div className="p-8 flex-1 space-y-6">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-2xl font-bold text-[#09090b] line-clamp-2 group-hover:text-gray-700 transition-colors">{event.title}</h3>
                                        </div>
                                        <div className="space-y-3 text-sm text-gray-600">
                                            <div className="flex items-center">
                                                <span className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-[#09090b] mr-3 text-lg">📅</span>
                                                <span className="font-medium text-gray-900">
                                                    {new Date(event.date).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'long' })}
                                                </span>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-[#09090b] mr-3 text-lg">📍</span>
                                                <span className="line-clamp-1 font-medium text-gray-900">{event.location}</span>
                                            </div>
                                            <div className="pt-2 text-xs text-gray-500 line-clamp-3">
                                                {event.description}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PublicProfilePage;
