import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8081/api',
});

const readUserContext = () => {
    try {
        const raw = localStorage.getItem('user');
        if (!raw) {
            return { userId: 'USER_123', role: 'USER' };
        }
        const parsed = JSON.parse(raw);
        return {
            userId: parsed.userId || parsed.id || 'USER_123',
            role: parsed.role || (parsed.isAdmin ? 'ADMIN' : 'USER'),
        };
    } catch (_err) {
        return { userId: 'USER_123', role: 'USER' };
    }
};

api.interceptors.request.use((config) => {
    const { userId, role } = readUserContext();
    config.headers['X-User-Id'] = userId;
    config.headers['X-User-Role'] = role;
    return config;
});

export const apiService = {
    getResources: () => api.get('/resources'),
    createTicket: (data) => api.post('/tickets', data),
    getUserTickets: (userId) => api.get(`/tickets/user/${userId}`),
    getAllTickets: () => api.get('/tickets'),
    getTicket: (id) => api.get(`/tickets/${id}`),
    assignTicket: (id, adminId) => api.put(`/tickets/${id}/assign`, null, { params: { adminId } }),
    updateTicketStatus: (id, status, reason) =>
        api.put(`/tickets/${id}/status`, null, { params: reason ? { status, reason } : { status } }),
    resolveTicket: (id, notes) =>
        api.put(`/tickets/${id}/resolve`, null, { params: notes ? { notes } : {} }),
    addTicketComment: (id, _ignored, content) => api.post(`/tickets/${id}/comments`, { content }),
    editTicketComment: (id, commentId, content) =>
        api.put(`/tickets/${id}/comments/${commentId}`, { content }),
    deleteTicketComment: (id, commentId) => api.delete(`/tickets/${id}/comments/${commentId}`),
    uploadTicketAttachment: (id, file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/tickets/${id}/attachments`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
};
