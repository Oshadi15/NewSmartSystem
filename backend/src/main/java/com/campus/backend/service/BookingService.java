package com.campus.backend.service;

import com.campus.backend.dto.BookingDTO;
import com.campus.backend.dto.CreateBookingRequest;
import com.campus.backend.exception.ConflictException;
import com.campus.backend.exception.ResourceNotFoundException;
import com.campus.backend.exception.ValidationException;
import com.campus.backend.model.Booking;
import com.campus.backend.model.BookingStatus;
import com.campus.backend.model.Resource;
import com.campus.backend.model.ResourceAvailability;
import com.campus.backend.model.ResourceStatus;
import com.campus.backend.repository.BookingRepository;
import com.campus.backend.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;

    public BookingDTO createBooking(CreateBookingRequest request) {
        log.info("Creating booking: userId={}, resourceId={}", request.getUserId(), request.getResourceId());

        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new ValidationException("Start time must be before end time");
        }

        Resource resource = resourceRepository.findById(request.getResourceId())
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id: " + request.getResourceId()));

        if (!ResourceStatus.ACTIVE.equals(resource.getStatus())) {
            throw new ValidationException("This resource is not available for booking (status: " + resource.getStatus() + ").");
        }

        // Attendees: only validate against capacity when capacity exists (non-equipment)
        if (resource.getCapacity() != null && request.getAttendees() != null && request.getAttendees() > resource.getCapacity()) {
            throw new ValidationException("Attendees exceed resource capacity of " + resource.getCapacity() + ".");
        }

        // Availability window: enforce booking inside daily window when configured
        validateWithinAvailability(resource.getAvailability(), request);

        List<Booking> conflicts = bookingRepository.findConflictingBookings(
                request.getResourceId(),
                request.getStartTime(),
                request.getEndTime()
        );

        if (!conflicts.isEmpty()) {
            throw new ConflictException("The resource is already booked for the requested time period.");
        }

        Booking booking = Booking.builder()
                .userId(request.getUserId())
                .resourceId(request.getResourceId())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .purpose(request.getPurpose())
                .attendees(request.getAttendees())
                .status(BookingStatus.PENDING)
                .build();

        Booking saved = bookingRepository.save(booking);
        log.info("Booking created: id={}, status=PENDING", saved.getId());

        return mapToDTO(saved, resource.getName());
    }

    public List<BookingDTO> getUserBookings(String userId) {
        log.debug("Fetching bookings for userId={}", userId);
        return bookingRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::mapToDTOWithoutResourceService)
                .collect(Collectors.toList());
    }

    public List<BookingDTO> getAllBookings(BookingStatus status, String resourceId) {
        log.debug("Admin: fetching all bookings status={}, resourceId={}", status, resourceId);

        List<Booking> bookings;
        if (status != null && resourceId != null) {
            bookings = bookingRepository.findByStatusAndResourceId(status, resourceId);
        } else if (status != null) {
            bookings = bookingRepository.findByStatus(status);
        } else if (resourceId != null) {
            bookings = bookingRepository.findByResourceId(resourceId);
        } else {
            bookings = bookingRepository.findAllByOrderByCreatedAtDesc();
        }

        return bookings.stream()
                .map(this::mapToDTOWithoutResourceService)
                .collect(Collectors.toList());
    }

    public BookingDTO approveBooking(String id) {
        log.info("Admin approving booking id={}", id);
        Booking booking = fetchBooking(id);

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new ValidationException("Only PENDING bookings can be approved. Current status: " + booking.getStatus());
        }

        // Safety: ensure no conflicts exist at approval-time (guards against data drift/manual edits).
        List<Booking> conflicts = bookingRepository.findConflictingBookingsExcludingId(
                booking.getResourceId(),
                booking.getId(),
                booking.getStartTime(),
                booking.getEndTime()
        );
        if (!conflicts.isEmpty()) {
            throw new ConflictException("Cannot approve: the resource has a conflicting booking in the same time range.");
        }

        booking.setStatus(BookingStatus.APPROVED);
        Booking updated = bookingRepository.save(booking);

        return mapToDTOWithoutResourceService(updated);
    }

    public BookingDTO rejectBooking(String id, String reason) {
        log.info("Admin rejecting booking id={} reason='{}'", id, reason);
        Booking booking = fetchBooking(id);

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new ValidationException("Only PENDING bookings can be rejected. Current status: " + booking.getStatus());
        }

        if (reason == null || reason.isBlank()) {
            throw new ValidationException("Rejection reason is required.");
        }

        booking.setStatus(BookingStatus.REJECTED);
        booking.setRejectionReason(reason);
        Booking updated = bookingRepository.save(booking);

        return mapToDTOWithoutResourceService(updated);
    }

    public BookingDTO cancelBooking(String id, String userId, String userRole) {
        log.info("Cancelling booking id={} by userId={} role={}", id, userId, userRole);
        Booking booking = fetchBooking(id);

        boolean isAdmin = "ADMIN".equalsIgnoreCase(Optional.ofNullable(userRole).orElse(""));
        if (!isAdmin && !booking.getUserId().equals(userId)) {
            throw new ValidationException("You can only cancel your own bookings.");
        }

        // Spec: Approved bookings can later be CANCELLED.
        if (booking.getStatus() == BookingStatus.APPROVED) {
            booking.setStatus(BookingStatus.CANCELLED);
            Booking updated = bookingRepository.save(booking);
            return mapToDTOWithoutResourceService(updated);
        } else {
            throw new ValidationException("Only APPROVED bookings can be cancelled. Current status: " + booking.getStatus());
        }
    }

    protected Booking fetchBooking(String id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));
    }

    private BookingDTO mapToDTOWithoutResourceService(Booking booking) {
        String resourceName = resourceRepository.findById(booking.getResourceId())
                .map(Resource::getName)
                .orElse(booking.getResourceId());
        return mapToDTO(booking, resourceName);
    }

    private BookingDTO mapToDTO(Booking booking, String resourceName) {
        BookingDTO dto = new BookingDTO();
        dto.setId(booking.getId());
        dto.setUserId(booking.getUserId());
        dto.setResourceId(booking.getResourceId());
        dto.setResourceName(resourceName);
        dto.setStartTime(booking.getStartTime());
        dto.setEndTime(booking.getEndTime());
        dto.setPurpose(booking.getPurpose());
        dto.setAttendees(booking.getAttendees());
        dto.setStatus(booking.getStatus());
        dto.setRejectionReason(booking.getRejectionReason());
        dto.setCreatedAt(booking.getCreatedAt());
        dto.setUpdatedAt(booking.getUpdatedAt());
        return dto;
    }

    private void validateWithinAvailability(ResourceAvailability availability, CreateBookingRequest request) {
        if (availability == null) return;
        if (availability.getStartTime() == null || availability.getEndTime() == null) return;

        // This system treats the availability window as a daily time window.
        if (!request.getStartTime().toLocalDate().equals(request.getEndTime().toLocalDate())) {
            throw new ValidationException("Bookings must start and end on the same day.");
        }

        if (request.getStartTime().toLocalTime().isBefore(availability.getStartTime())
                || request.getEndTime().toLocalTime().isAfter(availability.getEndTime())) {
            throw new ValidationException(
                    "Booking time must be within resource availability (" +
                            availability.getStartTime() + " - " + availability.getEndTime() + ")."
            );
        }
    }
}