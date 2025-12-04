import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = 'http://localhost:3001';

function MieiDatiPage() {
    const { user, setUser, loading: authLoading } = useAuth();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Stati per modifica dati personali
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        dateOfBirth: ''
    });
    const [formErrors, setFormErrors] = useState({});
    const [saveLoading, setSaveLoading] = useState(false);
    const [saveMessage, setSaveMessage] = useState({ type: '', text: '' });

    // Stati per modifica immagine
    const [isEditingImage, setIsEditingImage] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageError, setImageError] = useState('');
    const [uploadLoading, setUploadLoading] = useState(false);
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const fileInputRef = useRef(null);

    // Stati per cambio password
    const [isEditingPassword, setIsEditingPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordErrors, setPasswordErrors] = useState({});
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (authLoading) {
            return;
        }

        if (!user) {
            navigate('/login');
            return;
        }

        const fetchData = async () => {
            try {
                const profileRes = await userService.getProfile();
                setProfileData(profileRes.data);

                const profile = profileRes.data;
                setFormData({
                    username: profile.username || '',
                    dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : ''
                });
            } catch (error) {
                console.error("Errore nel caricamento dati:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate, user, authLoading]);

    // Validazione real-time per dati personali
    const validateProfileField = (name, value) => {
        let error = '';
        if (name === 'username') {
            if (!value.trim()) {
                error = 'Username è obbligatorio';
            } else if (value.length < 3) {
                error = 'Username deve essere di almeno 3 caratteri';
            }
        }
        if (name === 'dateOfBirth') {
            if (!value) {
                error = 'Data di nascita è obbligatoria';
            } else {
                const date = new Date(value);
                const today = new Date();
                if (date >= today) {
                    error = 'La data deve essere nel passato';
                }
            }
        }
        return error;
    };

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        const error = validateProfileField(name, value);
        setFormErrors(prev => ({ ...prev, [name]: error }));
    };

    const handleSaveProfile = async () => {
        const errors = {
            username: validateProfileField('username', formData.username),
            dateOfBirth: validateProfileField('dateOfBirth', formData.dateOfBirth)
        };
        setFormErrors(errors);

        if (Object.values(errors).some(e => e)) return;

        setSaveLoading(true);
        setSaveMessage({ type: '', text: '' });

        try {
            const response = await userService.updateProfile({
                username: formData.username,
                dateOfBirth: formData.dateOfBirth
            });

            setProfileData(response.data);
            setUser({ ...user, username: response.data.username });
            setIsEditingProfile(false);
            setSaveMessage({ type: 'success', text: 'Profilo aggiornato con successo!' });
            setTimeout(() => setSaveMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Errore durante il salvataggio';
            setSaveMessage({ type: 'error', text: errorMsg });
        } finally {
            setSaveLoading(false);
        }
    };

    // Gestione immagine profilo
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        setImageError('');

        if (!file) return;

        if (!['image/jpeg', 'image/png'].includes(file.type)) {
            setImageError('Formato non supportato. Usa solo JPG o PNG.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setImageError('Il file è troppo grande. Massimo 5MB.');
            return;
        }

        setSelectedFile(file);
        setImagePreview(URL.createObjectURL(file));
        setIsEditingImage(true);
    };

    const handleUploadAvatar = async () => {
        if (!selectedFile) return;

        setUploadLoading(true);
        try {
            const response = await userService.uploadAvatar(selectedFile);
            setProfileData(response.data);
            setIsEditingImage(false);
            setSelectedFile(null);
            setImagePreview(null);
            setSaveMessage({ type: 'success', text: 'Immagine caricata con successo!' });
            setTimeout(() => setSaveMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Errore durante il caricamento';
            setImageError(errorMsg);
        } finally {
            setUploadLoading(false);
        }
    };

    const handleRemoveAvatar = () => {
        setShowRemoveModal(true);
    };

    const confirmRemoveAvatar = async () => {
        setShowRemoveModal(false);
        setUploadLoading(true);
        try {
            const response = await userService.removeAvatar();
            setProfileData(response.data);
            setSaveMessage({ type: 'success', text: 'Immagine rimossa con successo!' });
            setTimeout(() => setSaveMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Errore durante la rimozione';
            setImageError(errorMsg);
        } finally {
            setUploadLoading(false);
        }
    };

    const cancelImageEdit = () => {
        setIsEditingImage(false);
        setSelectedFile(null);
        setImagePreview(null);
        setImageError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Validazione real-time per password
    const validatePasswordField = (name, value, allData = passwordData) => {
        let error = '';
        if (name === 'currentPassword') {
            if (!value) error = 'Password attuale è obbligatoria';
        }
        if (name === 'newPassword') {
            if (!value) {
                error = 'Nuova password è obbligatoria';
            } else if (value.length < 8) {
                error = 'La password deve essere di almeno 8 caratteri';
            }
        }
        if (name === 'confirmPassword') {
            if (!value) {
                error = 'Conferma password è obbligatoria';
            } else if (value !== allData.newPassword) {
                error = 'Le password non corrispondono';
            }
        }
        return error;
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        const newData = { ...passwordData, [name]: value };
        setPasswordData(newData);

        const error = validatePasswordField(name, value, newData);
        setPasswordErrors(prev => ({ ...prev, [name]: error }));

        if (name === 'newPassword' && passwordData.confirmPassword) {
            const confirmError = validatePasswordField('confirmPassword', passwordData.confirmPassword, newData);
            setPasswordErrors(prev => ({ ...prev, confirmPassword: confirmError }));
        }
    };

    const handleChangePassword = async () => {
        const errors = {
            currentPassword: validatePasswordField('currentPassword', passwordData.currentPassword),
            newPassword: validatePasswordField('newPassword', passwordData.newPassword),
            confirmPassword: validatePasswordField('confirmPassword', passwordData.confirmPassword)
        };
        setPasswordErrors(errors);

        if (Object.values(errors).some(e => e)) return;

        setPasswordLoading(true);
        setPasswordMessage({ type: '', text: '' });

        try {
            await userService.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });

            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setIsEditingPassword(false);
            setPasswordMessage({ type: 'success', text: 'Password cambiata con successo!' });
            setTimeout(() => setPasswordMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Errore durante il cambio password';
            setPasswordMessage({ type: 'error', text: errorMsg });
        } finally {
            setPasswordLoading(false);
        }
    };

    if (authLoading || !user || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#09090b]"></div>
            </div>
        );
    }

    const getProfileImageUrl = () => {
        if (imagePreview) return imagePreview;
        if (profileData?.profilePictureUrl) {
            return `${API_BASE_URL}${profileData.profilePictureUrl}`;
        }
        return null;
    };

    return (
        <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-8">

                <h1 className="text-4xl md:text-5xl font-bold text-[#09090b] tracking-tight text-center">
                    I Miei Dati
                </h1>

                {saveMessage.text && (
                    <div className={`p-4 rounded-xl text-center font-medium ${saveMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                        {saveMessage.text}
                    </div>
                )}

                <div className="bg-white rounded-3xl p-8 md:p-12 border border-gray-100 shadow-sm space-y-8">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-6">
                        <h2 className="text-3xl font-bold text-[#09090b] tracking-tight">
                            Dati Personali
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Colonna Immagine Profilo */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-semibold text-[#09090b]">Immagine Profilo</h3>

                            <div className="flex flex-col items-center space-y-4">
                                <div className="h-40 w-40 rounded-full bg-[#09090b] flex items-center justify-center text-white text-6xl font-bold shadow-xl overflow-hidden">
                                    {getProfileImageUrl() ? (
                                        <img src={getProfileImageUrl()} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        profileData?.username?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase()
                                    )}
                                </div>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    accept="image/jpeg,image/png"
                                    className="hidden"
                                />

                                {imageError && (
                                    <p className="text-red-500 text-sm">{imageError}</p>
                                )}

                                {isEditingImage ? (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleUploadAvatar}
                                            disabled={uploadLoading}
                                            className="px-6 py-2 bg-[#09090b] text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
                                        >
                                            {uploadLoading ? 'Caricamento...' : 'Conferma'}
                                        </button>
                                        <button
                                            onClick={cancelImageEdit}
                                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                                        >
                                            Annulla
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="px-6 py-2 bg-[#09090b] text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
                                        >
                                            {profileData?.profilePictureUrl ? 'Modifica Immagine' : 'Carica Immagine'}
                                        </button>
                                        {profileData?.profilePictureUrl && (
                                            <button
                                                onClick={handleRemoveAvatar}
                                                disabled={uploadLoading}
                                                className="px-6 py-2 border border-red-300 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
                                            >
                                                {uploadLoading ? 'Rimozione...' : 'Rimuovi'}
                                            </button>
                                        )}
                                    </div>
                                )}

                                <p className="text-sm text-gray-500 text-center">
                                    Formati supportati: JPG, PNG (max 5MB)
                                </p>
                            </div>
                        </div>

                        {/* Colonna Dati Personali */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-semibold text-[#09090b]">Informazioni</h3>
                                {!isEditingProfile && (
                                    <button
                                        onClick={() => setIsEditingProfile(true)}
                                        className="px-4 py-2 text-[#09090b] font-semibold hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        Modifica Dati
                                    </button>
                                )}
                            </div>

                            {isEditingProfile ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                        <input
                                            type="text"
                                            name="username"
                                            value={formData.username}
                                            onChange={handleProfileChange}
                                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#09090b] ${formErrors.username ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                        />
                                        {formErrors.username && (
                                            <p className="text-red-500 text-sm mt-1">{formErrors.username}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={profileData?.email || ''}
                                            disabled
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500"
                                        />
                                        <p className="text-gray-400 text-xs mt-1">L'email non può essere modificata</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Data di Nascita</label>
                                        <input
                                            type="date"
                                            name="dateOfBirth"
                                            value={formData.dateOfBirth}
                                            onChange={handleProfileChange}
                                            className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#09090b] ${formErrors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                        />
                                        {formErrors.dateOfBirth && (
                                            <p className="text-red-500 text-sm mt-1">{formErrors.dateOfBirth}</p>
                                        )}
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            onClick={handleSaveProfile}
                                            disabled={saveLoading || Object.values(formErrors).some(e => e)}
                                            className="px-6 py-3 bg-[#09090b] text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
                                        >
                                            {saveLoading ? 'Salvataggio...' : 'Salva'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsEditingProfile(false);
                                                setFormData({
                                                    username: profileData?.username || '',
                                                    dateOfBirth: profileData?.dateOfBirth ? profileData.dateOfBirth.split('T')[0] : ''
                                                });
                                                setFormErrors({});
                                            }}
                                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                                        >
                                            Annulla
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex justify-between py-3 border-b border-gray-100">
                                        <span className="text-gray-500">Username</span>
                                        <span className="font-medium text-[#09090b]">{profileData?.username}</span>
                                    </div>
                                    <div className="flex justify-between py-3 border-b border-gray-100">
                                        <span className="text-gray-500">Email</span>
                                        <span className="font-medium text-[#09090b]">{profileData?.email}</span>
                                    </div>
                                    <div className="flex justify-between py-3 border-b border-gray-100">
                                        <span className="text-gray-500">Data di Nascita</span>
                                        <span className="font-medium text-[#09090b]">
                                            {profileData?.dateOfBirth
                                                ? new Date(profileData.dateOfBirth).toLocaleDateString('it-IT')
                                                : 'Non specificata'}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sezione Cambio Password */}
                    <div className="border-t border-gray-100 pt-8 mt-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-semibold text-[#09090b]">Sicurezza</h3>
                            {!isEditingPassword && (
                                <button
                                    onClick={() => setIsEditingPassword(true)}
                                    className="px-4 py-2 text-[#09090b] font-semibold hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cambia Password
                                </button>
                            )}
                        </div>

                        {passwordMessage.text && (
                            <div className={`p-4 rounded-xl mb-4 font-medium ${passwordMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                {passwordMessage.text}
                            </div>
                        )}

                        {isEditingPassword ? (
                            <div className="max-w-md space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password Attuale</label>
                                    <input
                                        type="password"
                                        name="currentPassword"
                                        value={passwordData.currentPassword}
                                        onChange={handlePasswordChange}
                                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#09090b] ${passwordErrors.currentPassword ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    />
                                    {passwordErrors.currentPassword && (
                                        <p className="text-red-500 text-sm mt-1">{passwordErrors.currentPassword}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nuova Password</label>
                                    <input
                                        type="password"
                                        name="newPassword"
                                        value={passwordData.newPassword}
                                        onChange={handlePasswordChange}
                                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#09090b] ${passwordErrors.newPassword ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    />
                                    {passwordErrors.newPassword && (
                                        <p className="text-red-500 text-sm mt-1">{passwordErrors.newPassword}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Conferma Nuova Password</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={passwordData.confirmPassword}
                                        onChange={handlePasswordChange}
                                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#09090b] ${passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    />
                                    {passwordErrors.confirmPassword && (
                                        <p className="text-red-500 text-sm mt-1">{passwordErrors.confirmPassword}</p>
                                    )}
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={handleChangePassword}
                                        disabled={passwordLoading || Object.values(passwordErrors).some(e => e)}
                                        className="px-6 py-3 bg-[#09090b] text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
                                    >
                                        {passwordLoading ? 'Salvataggio...' : 'Cambia Password'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditingPassword(false);
                                            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                            setPasswordErrors({});
                                        }}
                                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                                    >
                                        Annulla
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500">La tua password è protetta. Clicca su "Cambia Password" per modificarla.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Conferma Rimozione */}
            {showRemoveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 transform transition-all scale-100">
                        <h3 className="text-xl font-bold text-[#09090b] mb-4">Rimuovi Immagine</h3>
                        <p className="text-gray-600 mb-8">
                            Sei sicuro di voler rimuovere la tua immagine profilo? Questa azione non può essere annullata.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowRemoveModal(false)}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Annulla
                            </button>
                            <button
                                onClick={confirmRemoveAvatar}
                                className="px-6 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
                            >
                                Rimuovi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MieiDatiPage;
