import axios from 'axios';
import { authStorage } from './authStorage';





export const apiService = {
    // ── Tickets ────────────────────────────────────────────────────────────────
    createTicket: (data) => api.post('/tickets', data),
    getUserTickets: (userId) => api.get(`/tickets/user/${userId}`),
    getAllTickets: () => api.get('/tickets'),
    getTicket: (id) => api.get(`/tickets/${id}`),
    assignTicket: (id, adminId) => api.put(`/tickets/${id}/assign`, null, { params: { adminId } }),
    updateTicketStatus: (id, status, reason) =>
        api.put(`/tickets/${id}/status`, null, { params: reason ? { status, reason } : { status } }),
    resolveTicket: (id, notes) =>
        api.put(`/tickets/${id}/resolve`, null, { params: notes ? { notes } : {} }),
    addTicketComment: (id, _ignored, content) =>
        api.post(`/tickets/${id}/comments`, content, { headers: { 'Content-Type': 'text/plain' } }),
    editTicketComment: (id, commentId, content) =>
        api.put(`/tickets/${id}/comments/${commentId}`, content, { headers: { 'Content-Type': 'text/plain' } }),
    deleteTicketComment: (id, commentId) => api.delete(`/tickets/${id}/comments/${commentId}`),
    uploadTicketAttachment: (id, file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/tickets/${id}/attachments`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },







};