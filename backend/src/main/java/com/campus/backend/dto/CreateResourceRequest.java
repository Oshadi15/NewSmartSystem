package com.campus.backend.dto;

import com.campus.backend.model.ResourceAvailability;
import com.campus.backend.model.ResourceStatus;
import com.campus.backend.model.ResourceType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Request body for POST /api/resources (ADMIN only).
 *data ranfering
 * <p>Capacity is optional for EQUIPMENT type — the {@code @Min}
 * constraint only fires when a value IS provided.</p>
 */
@Data
public class CreateResourceRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @NotNull(message = "Type is required")
    private ResourceType type;

    /**
     * Capacity is optional for EQUIPMENT; required for rooms/labs.
     * Service layer enforces this distinction.
     */
    @Min(value = 1, message = "Capacity must be a positive integer")
    private Integer capacity;

    @NotBlank(message = "Location is required")
    private String location;

    /**
     * Optional structured availability window (startTime / endTime).
     * When provided, startTime must be strictly before endTime.
     */
    private ResourceAvailability availability;

    /** Defaults to ACTIVE if not specified. */
    private ResourceStatus status = ResourceStatus.ACTIVE;
}
