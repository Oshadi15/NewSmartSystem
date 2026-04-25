package com.campus.backend.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Represents a bookable campus resource such as a lecture hall,
 * lab, meeting room, or equipment item.
 *
 * <p>Auditing timestamps (createdAt, updatedAt) are populated
 * automatically by Spring Data MongoDB via {@code @EnableMongoAuditing}.</p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "resources")
public class Resource {

    @Id
    private String id;

    /** Human-readable name, e.g. "Conference Room A". */
    @Indexed
    private String name;

    /** Broad classification of the resource. */
    private ResourceType type;

    /**
     * Maximum occupancy. Optional for EQUIPMENT type —
     * equipment does not have a fixed capacity.
     */
    private Integer capacity;

    /** Physical location, e.g. "Building 3, Floor 2". */
    @Indexed
    private String location;

    /**
     * Daily availability window. When null, the resource is
     * considered available without time restriction.
     */
    private ResourceAvailability availability;

    /**
     * Operational status. Only ACTIVE resources can be booked.
     */
    private ResourceStatus status;

    // ── Audit timestamps ─────────────────────────────────────────────────────

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    // ── Business helpers ─────────────────────────────────────────────────────

    /**
     * Returns true if this resource is bookable (status is ACTIVE).
     */
    public boolean isBookable() {
        return ResourceStatus.ACTIVE.equals(this.status);
    }
}
