package com.campus.backend.dto;

//import com.campus.backend.model.ResourceAvailability;
//import com.campus.backend.model.ResourceStatus;
//import com.campus.backend.model.ResourceType;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Outbound representation of a Resource. Includes all fields
 * the client needs to display and work with a resource.
 */
//@Data
public class ResourceDTO {
    private String id;
    private String name;
    //private ResourceType type;
    private Integer capacity;
    private String location;
    //private ResourceAvailability availability;
    //private ResourceStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    /** Derived field — true when status == ACTIVE. */
    private boolean bookable;
}
