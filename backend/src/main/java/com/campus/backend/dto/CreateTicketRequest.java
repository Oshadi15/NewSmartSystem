package com.campus.backend.dto;

import com.campus.backend.model.TicketPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class CreateTicketRequest {

    // Reporter ID from request for now, usually from Auth context
    @NotBlank(message = "Reporter ID is required")
    private String reporterId;

    @NotBlank(message = "Resource ID is required")
    private String resourceId;

    @NotBlank(message = "Category is required")
    private String category;

    @NotBlank(message = "Description is required")
    private String description;

    @NotNull(message = "Priority is required")
    private TicketPriority priority;

    @Size(max = 3, message = "Maximum 3 attachments allowed")
    private List<String> attachments;
}
