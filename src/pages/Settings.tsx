import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Channel } from '../types';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';

export function Settings() {
    const [channels, setChannels] = useState<Channel[]>([]);
    const [newChannelUrl, setNewChannelUrl] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'channels'), (snapshot) => {
            const channelsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }) as Channel);
            setChannels(channelsData);
        });

        return () => unsubscribe();
    }, []);

    const getChannelId = async (url: string): Promise<string> => {
        const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
        
        try {
            // Extrair possíveis IDs ou handles
            const patterns = [
                // Formato channel ID
                /youtube\.com\/channel\/([a-zA-Z0-9_-]{24})/,
                // Formato custom URL
                /youtube\.com\/c\/([a-zA-Z0-9_-]+)/,
                // Formato user
                /youtube\.com\/user\/([a-zA-Z0-9_-]+)/,
                // Formato handle moderno
                /youtube\.com\/@([a-zA-Z0-9_-]+)/,
                // Apenas handle
                /^@?([a-zA-Z0-9_-]+)$/
            ];

            // Tentar encontrar match nos padrões
            for (const pattern of patterns) {
                const match = url.match(pattern);
                if (match && match[1]) {
                    const candidate = match[1];
                    
                    // Verificar se é um ID válido
                    if (/^UC[\w-]{22}$/.test(candidate)) {
                        return candidate;
                    }

                    // Tentar buscar via forHandle
                    const handleResponse = await fetch(
                        `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${candidate}&key=AIzaSyAed6Gwm1MdihckCKGtvjv4nzsZNZpSZnE`
                    );
                    
                    const handleData = await handleResponse.json();
                    if (handleData.items?.length > 0) {
                        return handleData.items[0].id;
                    }
                }
            }

            const searchResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(url)}&key=AIzaSyAed6Gwm1MdihckCKGtvjv4nzsZNZpSZnE`
            );

            const searchData = await searchResponse.json();
            
            if (!searchData.items || searchData.items.length === 0) {
                throw new Error('Canal não encontrado na pesquisa geral');
            }

            return searchData.items[0].id.channelId;

        } catch (err) {
            console.error('Erro ao obter ID do canal:', err);
            throw new Error('Não foi possível identificar o canal. Verifique a URL e tente novamente.');
        }
    };

    const handleAddChannel = async () => {
        if (!newChannelUrl.trim()) {
            setError('Por favor, insira a URL do canal');
            return;
        }

        setLoading(true);
        setError('');
        
        try {
            const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
            const channelId = await getChannelId(newChannelUrl.trim());

            // Buscar dados completos do canal
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=AIzaSyAed6Gwm1MdihckCKGtvjv4nzsZNZpSZnE`
            );

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error.message || 'Erro na API do YouTube');
            }

            if (!data.items || data.items.length === 0) {
                throw new Error('Nenhum dado encontrado para este canal');
            }

            const channel = data.items[0];
            const thumbnails = channel.snippet.thumbnails;

            const channelData = {
                name: channel.snippet.title,
                avatar: thumbnails.high?.url || thumbnails.medium?.url || thumbnails.default.url,
                subscriberCount: Number(channel.statistics.subscriberCount),
                url: `https://youtube.com/channel/${channelId}`,
                youtubeId: channelId,
                addedAt: new Date().toISOString(),
            };

            // Adicionar ao Firestore
            await addDoc(collection(db, 'channels'), channelData);

            setNewChannelUrl('');

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido ao adicionar canal');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveChannel = async (channelId: string) => {
        try {
            await deleteDoc(doc(db, 'channels', channelId));
        } catch (err) {
            setError('Erro ao remover canal');
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <Link
                        to="/"
                        className="inline-flex items-center text-gray-600 hover:text-red-600 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Voltar ao Dashboard
                    </Link>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6">Configurações dos Canais</h1>

                    <div className="mb-8">
                        <h2 className="text-lg font-semibold text-gray-700 mb-4">Adicionar Novo Canal</h2>
                        <div className="flex gap-4">
                            <input
                                type="text"
                                value={newChannelUrl}
                                onChange={(e) => setNewChannelUrl(e.target.value)}
                                placeholder="Ex: https://youtube.com/@MeuCanal ou @MeuCanal"
                                className="flex-1 px-4 py-2 bg-gray-100 rounded-full border-none focus:outline-none focus:ring-2 focus:ring-red-500 hover:bg-gray-200 transition-colors"
                            />
                            <button
                                onClick={handleAddChannel}
                                disabled={loading}
                                className={`inline-flex items-center px-6 py-2 ${
                                    loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                                } text-white rounded-full focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors`}
                            >
                                {loading ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processando...
                                    </span>
                                ) : (
                                    <>
                                        <Plus className="w-5 h-5 mr-2" />
                                        Adicionar Canal
                                    </>
                                )}
                            </button>
                        </div>
                        {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold text-gray-700 mb-4">Canais Gerenciados</h2>
                        <div className="space-y-4">
                            {channels.length === 0 ? (
                                <p className="text-gray-500 italic">Nenhum canal adicionado ainda</p>
                            ) : (
                                channels.map(channel => (
                                    <div
                                        key={channel.id}
                                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        <div className="flex items-center">
                                            <img
                                                src={channel.avatar}
                                                alt={channel.name}
                                                className="w-12 h-12 rounded-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = '/default-avatar.png';
                                                }}
                                            />
                                            <div className="ml-4">
                                                <h3 className="font-medium text-gray-900">{channel.name}</h3>
                                                <div className="text-sm text-gray-500">
                                                    <p>{new Intl.NumberFormat('pt-BR').format(channel.subscriberCount)} inscritos</p>
                                                    <p>Adicionado em {channel.addedAt ? new Date(channel.addedAt).toLocaleDateString('pt-BR') : 'Data desconhecida'}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveChannel(channel.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 focus:outline-none transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}