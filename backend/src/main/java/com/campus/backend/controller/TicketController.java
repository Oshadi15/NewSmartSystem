package com.campus.backend.controller;

import com.campus.backend.dto.CreateTicketRequest;
import com.campus.backend.dto.TicketCommentRequest;
import com.campus.backend.dto.TicketDTO;
import com.campus.backend.exception.UnauthorizedException;
import com.campus.backend.exception.ValidationException;
import com.campus.backend.model.TicketStatus;
import com.campus.backend.service.TicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

/**
 * REST controller for the Ticket module.
 *
 * <h3>Role-Based Access</h3>
 * <ul>
 *   <li>POST   /api/tickets                    — USER &amp; ADMIN (create ticket)</li>
 *   <li>GET    /api/tickets                    — ADMIN only (all tickets)</li>
 *   <li>GET    /api/tickets/{id}               — USER (own ticket) or ADMIN</li>
 *   <li>GET    /api/tickets/user/{id}          — USER (own) or ADMIN</li>
 *   <li>PUT    /{id}/assign                    — ADMIN only</li>
 *   <li>PUT    /{id}/status                    — ADMIN only</li>
 *   <li>PUT    /{id}/resolve                   — ADMIN only (with resolution notes)</li>
 *   <li>POST   /{id}/comments                  — USER &amp; ADMIN</li>
 *   <li>PUT    /{id}/comments/{cId}            — comment owner only</li>
 *   <li>DELETE /{id}/comments/{cId}            — owner or ADMIN</li>
 *   <li>POST   /{id}/attachments               — ticket reporter only (multipart)</li>
 * </ul>
 */
@Slf4j
@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    // Upload directory inside the running directory
    private static final String UPLOAD_DIR = "uploads/tickets/";

    /** USER or ADMIN can create a ticket. */
    @PostMapping
    public ResponseEntity<TicketDTO> createTicket(
            @Valid @RequestBody CreateTicketRequest request,
            @RequestHeader("X-User-Id") String requestUserId) {
        // Force the reporterId to match the authenticated user
        request.setReporterId(requestUserId);
        TicketDTO created = ticketService.createTicket(request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    /** ADMIN only — view all tickets. */
    @GetMapping
    public ResponseEntity<List<TicketDTO>> getAllTickets(
            @RequestHeader(value = "X-User-Role", defaultValue = "USER") String userRole) {
        if (!"ADMIN".equalsIgnoreCase(userRole)) {
            throw new UnauthorizedException("Only ADMIN can view all tickets.");
        }
        return ResponseEntity.ok(ticketService.getAllTickets());
    }

    /** USER (own ticket) or ADMIN. */
    @GetMapping("/{id}")
    public ResponseEntity<TicketDTO> getTicket(
            @PathVariable String id,
            @RequestHeader("X-User-Id") String requestUserId,
            @RequestHeader(value = "X-User-Role", defaultValue = "USER") String userRole) {
        TicketDTO ticket = ticketService.getTicket(id);
        boolean isAdmin = "ADMIN".equalsIgnoreCase(userRole);
        if (!isAdmin && !requestUserId.equals(ticket.getReporterId())) {
            throw new UnauthorizedException("You may only view your own tickets.");
        }
        return ResponseEntity.ok(ticket);
    }

    /** USER (own tickets) or ADMIN. Non-admin is restricted to their own userId. */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<TicketDTO>> getUserTickets(
            @PathVariable String userId,
            @RequestHeader("X-User-Id") String requestUserId,
            @RequestHeader(value = "X-User-Role", defaultValue = "USER") String userRole) {

        if (!"ADMIN".equalsIgnoreCase(userRole) && !userId.equals(requestUserId)) {
            throw new UnauthorizedException("You may only view your own tickets.");
        }
        return ResponseEntity.ok(ticketService.getUserTickets(userId));
    }

    /** ADMIN only — assign a ticket to an admin/technician. */
    @PutMapping("/{id}/assign")
    public ResponseEntity<TicketDTO> assignTicket(
            @PathVariable String id,
            @RequestParam String adminId,
            @RequestHeader(value = "X-User-Role", defaultValue = "USER") String userRole) {

        if (!"ADMIN".equalsIgnoreCase(userRole)) {
            throw new UnauthorizedException("Only ADMIN can assign tickets.");
        }
        return ResponseEntity.ok(ticketService.assignTicket(id, adminId));
    }

    /** ADMIN only — advance ticket status. */
    @PutMapping("/{id}/status")
    public ResponseEntity<TicketDTO> updateStatus(
            @PathVariable String id,
            @RequestParam TicketStatus status,
            @RequestParam(required = false) String reason,
            @RequestHeader(value = "X-User-Role", defaultValue = "USER") String userRole) {

        if (!"ADMIN".equalsIgnoreCase(userRole)) {
            throw new UnauthorizedException("Only ADMIN can update ticket status.");
        }
        return ResponseEntity.ok(ticketService.updateStatus(id, status, reason));
    }

    /** ADMIN only — resolve ticket with optional resolution notes. */
    @PutMapping("/{id}/resolve")
    public ResponseEntity<TicketDTO> resolveTicket(
            @PathVariable String id,
            @RequestParam(required = false) String notes,
            @RequestHeader(value = "X-User-Role", defaultValue = "USER") String userRole) {

        if (!"ADMIN".equalsIgnoreCase(userRole)) {
            throw new UnauthorizedException("Only ADMIN can resolve tickets.");
        }
        return ResponseEntity.ok(ticketService.resolveWithNotes(id, notes));
    }

    /** USER and ADMIN can add comments. authorId is taken from auth attribute. */
    @PostMapping("/{id}/comments")
    public ResponseEntity<TicketDTO> addComment(
            @PathVariable String id,
            @Valid @RequestBody TicketCommentRequest commentRequest,
            @RequestHeader("X-User-Id") String requestUserId) {
        return ResponseEntity.ok(ticketService.addComment(id, requestUserId, commentRequest.getContent()));
    }

    /** Comment owner can edit their own comment. */
    @PutMapping("/{id}/comments/{commentId}")
    public ResponseEntity<TicketDTO> editComment(
            @PathVariable String id,
            @PathVariable String commentId,
            @Valid @RequestBody TicketCommentRequest commentRequest,
            @RequestHeader("X-User-Id") String requestUserId) {
        return ResponseEntity.ok(ticketService.editComment(id, commentId, requestUserId, commentRequest.getContent()));
    }

    /** Comment owner or ADMIN can delete a comment. */
    @DeleteMapping("/{id}/comments/{commentId}")
    public ResponseEntity<TicketDTO> deleteComment(
            @PathVariable String id,
            @PathVariable String commentId,
            @RequestHeader("X-User-Id") String requestUserId,
            @RequestHeader(value = "X-User-Role", defaultValue = "USER") String userRole) {
        return ResponseEntity.ok(ticketService.deleteComment(id, commentId, requestUserId, userRole));
    }

    /**
     * Upload an image attachment for a ticket.
     * Reporter only. Max 3 attachments per ticket.
     * Accepts multipart file; saves to disk and stores the path.
     */
    @PostMapping("/{id}/attachments")
    public ResponseEntity<TicketDTO> uploadAttachment(
            @PathVariable String id,
            @RequestParam("file") MultipartFile file,
            @RequestHeader("X-User-Id") String requestUserId) throws IOException {

        if (file.isEmpty()) {
            throw new ValidationException("File must not be empty.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new ValidationException("Only image files (jpg, png, gif, webp) are allowed.");
        }
        if (file.getSize() > 5 * 1024 * 1024) { // 5 MB limit
            throw new ValidationException("File size must not exceed 5 MB.");
        }

        // Save file
        Path uploadPath = Paths.get(UPLOAD_DIR);
        Files.createDirectories(uploadPath);
        String originalFilename = file.getOriginalFilename() != null
                ? Paths.get(file.getOriginalFilename()).getFileName().toString()
                : "attachment";
        String filename = UUID.randomUUID() + "_" + originalFilename;
        Path filePath = uploadPath.resolve(filename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        String relativeUrl = "/uploads/tickets/" + filename;
        log.info("Saved attachment for ticket {} to {}", id, relativeUrl);

        return ResponseEntity.ok(ticketService.addAttachment(id, relativeUrl, requestUserId));
    }
}
