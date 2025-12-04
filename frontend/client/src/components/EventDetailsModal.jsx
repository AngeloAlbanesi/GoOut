import React from 'react';

function EventDetailsModal({ event, onClose }) {
    if (!event) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-[#09090b] px-8 py-6 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">{event.title}</h2>
                        <p className="text-gray-400 text-sm">Dettagli Evento</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Data e Ora</span>
                            <div className="flex items-center text-[#09090b] font-medium text-lg">
                                <span className="mr-2">📅</span>
                                {new Date(event.date).toLocaleDateString('it-IT', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Luogo</span>
                            <div className="flex items-center text-[#09090b] font-medium text-lg">
                                <span className="mr-2">📍</span>
                                {event.location}
                            </div>
                        </div>
                    </div>

                    <div className="mb-8 space-y-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Descrizione</span>
                        <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                            {event.description}
                        </p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-[#09090b]">Partecipanti</span>
                            <span className="text-sm font-medium text-gray-600">
                                {event.participantsCount} <span className="text-gray-400">/</span> {event.maxParticipants}
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <div 
                                className="bg-[#09090b] h-2.5 rounded-full transition-all duration-500" 
                                style={{ width: `${Math.min((event.participantsCount / event.maxParticipants) * 100, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:text-[#09090b] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#09090b]"
                    >
                        Chiudi
                    </button>
                </div>
            </div>
        </div>
    );
}

export default EventDetailsModal;
