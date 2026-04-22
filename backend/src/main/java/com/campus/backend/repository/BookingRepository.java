package com.campus.backend.repository;

import com.campus.backend.model.Booking;
import com.campus.backend.model.BookingStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface BookingRepository extends MongoRepository<Booking, String> {

    List<Booking> findByUserIdOrderByCreatedAtDesc(String userId);

    List<Booking> findAllByOrderByCreatedAtDesc();

    List<Booking> findByStatus(BookingStatus status);

    List<Booking> findByResourceId(String resourceId);

    List<Booking> findByStatusAndResourceId(BookingStatus status, String resourceId);

    /**
     * Conflict detection: finds active bookings that overlap with the requested period.
     * Excludes CANCELLED and REJECTED bookings.
     * Overlap condition: existing.start < requested.end AND existing.end > requested.start
     */
    @Query("{ 'resourceId': ?0, " +
           "'status': { $nin: ['CANCELLED', 'REJECTED'] }, " +
           "$and: [ { 'startTime': { $lt: ?2 } }, { 'endTime': { $gt: ?1 } } ] }")
    List<Booking> findConflictingBookings(String resourceId, LocalDateTime startTime, LocalDateTime endTime);

    long countByStatus(BookingStatus status);
}
