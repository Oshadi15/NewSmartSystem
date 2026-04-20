package com.campus.backend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TicketCommentRequest {
    @NotBlank(message = "Comment content cannot be empty.")
    private String content;
}
