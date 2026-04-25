package com.campus.backend.dto;

import com.campus.backend.model.ResourceAvailability;
import com.campus.backend.model.ResourceStatus;
import com.campus.backend.model.ResourceType;
import jakarta.validation.constraints.Min;
import lombok.Data;

/**
 * Request body for PUT /api/resources/{id} (ADMIN only).
 * All fields are optional — only non-null values are applied (patch semantics).
 */
@Data
public class UpdateResourceRequest {

    private String name;

    private ResourceType type;

    @Min(value = 1, message = "Capacity must be a positive integer")
    private Integer capacity;

    private String location;

    private ResourceAvailability availability;

    private ResourceStatus status;
}
