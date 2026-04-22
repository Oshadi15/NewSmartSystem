package com.campus.backend.controller;

import com.campus.backend.dto.BookingDTO;
import com.campus.backend.dto.CreateBookingRequest;
import com.campus.backend.exception.UnauthorizedException;
import com.campus.backend.model.BookingStatus;
import com.campus.backend.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for the Booking module.
 *
 * <h3>Role-Based Access</h3>
 * <ul>
 *   <li>POST   /api/bookings              — USER &amp; ADMIN (create booking)</li>
 *   <li>GET    /api/bookings/user/{id}    — USER (own bookings) or ADMIN</li>
 *   <li>GET    /api/bookings              — ADMIN only (all bookings)</li>
 *   <li>PUT    /{id}/approve              — ADMIN only</li>
 *   <li>PUT    /{id}/reject               — ADMIN only</li>
 *   <li>PUT    /{id}/cancel               — USER (own booking only)</li>
 * </ul>
 */
@Slf4j
@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    /** USER or ADMIN can create a booking. */
    @PostMapping
    public ResponseEntity<BookingDTO> createBooking(
            @Valid @RequestBody CreateBookingRequest request,
            @RequestAttribute("userId") String requestUserId) {
        // Ensure userId in body matches the authenticated user (prevents booking on behalf of others)
        request.setUserId(requestUserId);
        BookingDTO created = bookingService.createBooking(request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    /** Users may only view their own bookings. ADMIN can view any user's. */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<BookingDTO>> getUserBookings(
            @PathVariable String userId,
            @RequestAttribute("userId")   String requestUserId,
            @RequestAttribute("userRole") String userRole) {

        // Non-admin users can only access their own booking list
        if (!"ADMIN".equalsIgnoreCase(userRole) && !userId.equals(requestUserId)) {
            throw new UnauthorizedException("You may only view your own bookings.");
        }
        return ResponseEntity.ok(bookingService.getUserBookings(userId));
    }

    /** ADMIN only — view all bookings with optional filters. */
    @GetMapping
    public ResponseEntity<List<BookingDTO>> getAllBookings(
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(required = false) String resourceId,
            @RequestAttribute("userRole") String userRole) {

        if (!"ADMIN".equalsIgnoreCase(userRole)) {
            throw new UnauthorizedException("Only ADMIN can view all bookings.");
        }
        return ResponseEntity.ok(bookingService.getAllBookings(status, resourceId));
    }

    /** ADMIN only — approve a PENDING booking. */
    @PutMapping("/{id}/approve")
    public ResponseEntity<BookingDTO> approveBooking(
            @PathVariable String id,
            @RequestAttribute("userRole") String userRole) {

        if (!"ADMIN".equalsIgnoreCase(userRole)) {
            throw new UnauthorizedException("Only ADMIN can approve bookings.");
        }
        return ResponseEntity.ok(bookingService.approveBooking(id));
    }

    /** ADMIN only — reject a PENDING booking with a reason. */
    @PutMapping("/{id}/reject")
    public ResponseEntity<BookingDTO> rejectBooking(
            @PathVariable String id,
            @RequestParam String reason,
            @RequestAttribute("userRole") String userRole) {

        if (!"ADMIN".equalsIgnoreCase(userRole)) {
            throw new UnauthorizedException("Only ADMIN can reject bookings.");
        }
        return ResponseEntity.ok(bookingService.rejectBooking(id, reason));
    }

    /** USER — cancel their own booking. ADMIN can also cancel any booking. */
    @PutMapping("/{id}/cancel")
    public ResponseEntity<BookingDTO> cancelBooking(
            @PathVariable String id,
            @RequestAttribute("userId") String requestUserId,
            @RequestAttribute("userRole") String userRole) {

        // ADMIN can cancel any booking; USER can only cancel their own
        String userIdForCancel = requestUserId;
        return ResponseEntity.ok(bookingService.cancelBooking(id, userIdForCancel));
    }
}
