package com.campus.backend.dto;

import com.campus.backend.model.BookingStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class BookingDTO {
    private String id;
    private String userId;
    private String resourceId;
    /** Enriched resource name for display — avoids extra client-side lookup. */
    private String resourceName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String purpose;
    private Integer attendees;
    private BookingStatus status;
    private String rejectionReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

