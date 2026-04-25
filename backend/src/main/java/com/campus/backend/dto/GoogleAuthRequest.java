package com.campus.backend.dto;

import lombok.Data;

/**
 * Request body for POST /api/auth/google.
 * Frontend sends Google profile data received from @react-oauth/google.
 */
@Data
public class GoogleAuthRequest {
    private String email;
    private String name;
    private String picture; // optional Google profile picture URL
}
