package com.campus.backend.service;

import com.campus.backend.dto.CreateTicketRequest;
import com.campus.backend.dto.TicketDTO;
import com.campus.backend.exception.ResourceNotFoundException;
import com.campus.backend.exception.UnauthorizedException;
import com.campus.backend.exception.ValidationException;
import com.campus.backend.model.Ticket;
import com.campus.backend.model.TicketComment;
import com.campus.backend.model.TicketStatus;
import com.campus.backend.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TicketService {

    private final TicketRepository ticketRepository;

    /**
     * Valid status transitions.
     * OPEN → IN_PROGRESS or CLOSED(rejected before assignment)
     * IN_PROGRESS → RESOLVED or REJECTED
     * RESOLVED → CLOSED
     * CLOSED and REJECTED are terminal states.
     */
    private static final Map<TicketStatus, Set<TicketStatus>> VALID_TRANSITIONS = Map.of(
            TicketStatus.OPEN,        Set.of(TicketStatus.IN_PROGRESS, TicketStatus.REJECTED),
            TicketStatus.IN_PROGRESS, Set.of(TicketStatus.RESOLVED, TicketStatus.REJECTED),
            TicketStatus.RESOLVED,    Set.of(TicketStatus.CLOSED),
            TicketStatus.CLOSED,      Set.of(),
            TicketStatus.REJECTED,    Set.of()
    );

    public TicketDTO createTicket(CreateTicketRequest request) {
        log.info("Creating ticket: reporterId={}, category={}", request.getReporterId(), request.getCategory());

        if (request.getAttachments() != null && request.getAttachments().size() > 3) {
            throw new ValidationException("Maximum 3 attachments allowed per ticket.");
        }

        Ticket ticket = Ticket.builder()
                .reporterId(request.getReporterId())
                .resourceId(request.getResourceId())
                .category(request.getCategory())
                .description(request.getDescription())
                .priority(request.getPriority())
                .status(TicketStatus.OPEN)
                .attachments(request.getAttachments() != null ? request.getAttachments() : new ArrayList<>())
                .build();

        Ticket saved = ticketRepository.save(ticket);
        log.info("Ticket created: id={}", saved.getId());
        return mapToDTO(saved);
    }

    public List<TicketDTO> getAllTickets() {
        return ticketRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public List<TicketDTO> getUserTickets(String userId) {
        return ticketRepository.findByReporterIdOrderByCreatedAtDesc(userId)
                .stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public TicketDTO getTicket(String id) {
        return mapToDTO(fetchTicket(id));
    }

    public TicketDTO assignTicket(String id, String adminId) {
        log.info("Assigning ticket id={} to adminId={}", id, adminId);
        Ticket ticket = fetchTicket(id);
        ticket.setAssignedTo(adminId);
        if (ticket.getStatus() == TicketStatus.OPEN) {
            ticket.setStatus(TicketStatus.IN_PROGRESS);
        }
        return mapToDTO(ticketRepository.save(ticket));
    }

    public TicketDTO updateStatus(String id, TicketStatus newStatus, String reason) {
        log.info("Updating ticket id={} to status={}", id, newStatus);
        Ticket ticket = fetchTicket(id);
        TicketStatus current = ticket.getStatus();

        // Validate transition
        Set<TicketStatus> allowed = VALID_TRANSITIONS.getOrDefault(current, Set.of());
        if (!allowed.contains(newStatus)) {
            throw new ValidationException(
                "Cannot transition ticket from " + current + " to " + newStatus +
                ". Allowed: " + allowed
            );
        }

        if (newStatus == TicketStatus.REJECTED && (reason == null || reason.trim().isEmpty())) {
            throw new ValidationException("Rejection reason is required when rejecting a ticket.");
        }
        if (newStatus == TicketStatus.REJECTED) {
            ticket.setRejectionReason(reason);
        }

        ticket.setStatus(newStatus);
        return mapToDTO(ticketRepository.save(ticket));
    }

    public TicketDTO addComment(String id, String authorId, String content) {
        if (content == null || content.isBlank()) {
            throw new ValidationException("Comment content cannot be empty.");
        }
        Ticket ticket = fetchTicket(id);

        TicketComment comment = TicketComment.builder()
                .id(UUID.randomUUID().toString())
                .authorId(authorId)
                .content(content.trim())
                .createdAt(LocalDateTime.now())
                .build();

        ticket.getComments().add(comment);
        Ticket updated = ticketRepository.save(ticket);

        return mapToDTO(updated);
    }

    public TicketDTO deleteComment(String id, String commentId, String requestUserId, String requestUserRole) {
        Ticket ticket = fetchTicket(id);

        TicketComment target = ticket.getComments().stream()
                .filter(c -> c.getId().equals(commentId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));

        boolean isAdmin = "ADMIN".equalsIgnoreCase(requestUserRole);
        boolean isOwner = target.getAuthorId().equals(requestUserId);
        if (!isOwner && !isAdmin) {
            throw new UnauthorizedException("Only comment owner or ADMIN can delete this comment.");
        }

        ticket.getComments().remove(target);
        return mapToDTO(ticketRepository.save(ticket));
    }

    /** Edit an existing comment — only the original author can edit. */
    public TicketDTO editComment(String ticketId, String commentId, String requestUserId, String newContent) {
        if (newContent == null || newContent.isBlank()) {
            throw new ValidationException("Comment content cannot be empty.");
        }
        Ticket ticket = fetchTicket(ticketId);

        TicketComment target = ticket.getComments().stream()
                .filter(c -> c.getId().equals(commentId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));

        if (!target.getAuthorId().equals(requestUserId)) {
            throw new ValidationException("You can only edit your own comments.");
        }
        target.setContent(newContent.trim());
        target.setUpdatedAt(LocalDateTime.now());
        return mapToDTO(ticketRepository.save(ticket));
    }

    /** Add an attachment URL/path to a ticket (max 3 total). */
    public TicketDTO addAttachment(String id, String attachmentUrl, String requestUserId) {
        Ticket ticket = fetchTicket(id);
        if (!ticket.getReporterId().equals(requestUserId)) {
            throw new ValidationException("Only the ticket reporter can add attachments.");
        }
        if (ticket.getAttachments().size() >= 3) {
            throw new ValidationException("Maximum 3 attachments allowed per ticket.");
        }
        ticket.getAttachments().add(attachmentUrl);
        return mapToDTO(ticketRepository.save(ticket));
    }

    /** Admin resolves a ticket and optionally stores resolution notes. */
    public TicketDTO resolveWithNotes(String id, String notes) {
        Ticket ticket = fetchTicket(id);
        if (ticket.getStatus() != TicketStatus.IN_PROGRESS) {
            throw new ValidationException("Only IN_PROGRESS tickets can be resolved.");
        }
        ticket.setStatus(TicketStatus.RESOLVED);
        if (notes != null && !notes.isBlank()) {
            ticket.setResolutionNotes(notes.trim());
        }
        return mapToDTO(ticketRepository.save(ticket));
    }

    protected Ticket fetchTicket(String id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with id: " + id));
    }

    private TicketDTO mapToDTO(Ticket ticket) {
        TicketDTO dto = new TicketDTO();
        dto.setId(ticket.getId());
        dto.setResourceId(ticket.getResourceId());
        dto.setResourceName(ticket.getResourceId());
        dto.setReporterId(ticket.getReporterId());
        dto.setCategory(ticket.getCategory());
        dto.setDescription(ticket.getDescription());
        dto.setPriority(ticket.getPriority());
        dto.setStatus(ticket.getStatus());
        dto.setAssignedTo(ticket.getAssignedTo());
        dto.setComments(ticket.getComments());
        dto.setAttachments(ticket.getAttachments());
        dto.setRejectionReason(ticket.getRejectionReason());
        dto.setResolutionNotes(ticket.getResolutionNotes());
        dto.setCreatedAt(ticket.getCreatedAt());
        dto.setUpdatedAt(ticket.getUpdatedAt());
        return dto;
    }
}
