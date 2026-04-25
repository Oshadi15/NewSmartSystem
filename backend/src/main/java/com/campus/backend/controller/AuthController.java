package com.campus.backend.controller;

import com.campus.backend.dto.AuthResponse;
import com.campus.backend.dto.GoogleAuthRequest;
import com.campus.backend.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Authentication endpoints — exempt from the AuthInterceptor
 * (configured in WebMvcConfig to exclude /api/auth/**).
 *
 * <h3>Flow</h3>
 * <pre>
 * User clicks "Sign in with Google"
 *   → @react-oauth/google returns a credential (ID token)
 *   → Frontend decodes it to get { email, name, picture }
 *   → Frontend calls POST /api/auth/google
 *   → Backend creates / fetches User, returns { userId, role }
 *   → Frontend stores in localStorage, attaches as X-User-Id / X-User-Role headers
 * </pre>
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * Authenticates a user using Google OAuth profile data.
     * Creates account on first login (role = USER).
     *
     * <pre>POST /api/auth/google</pre>
     */
    @PostMapping("/google")
    public ResponseEntity<AuthResponse> loginWithGoogle(
            @RequestBody GoogleAuthRequest request) {
        AuthResponse response = authService.loginWithGoogle(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Returns the stored profile for a user by id.
     * Used to restore session state on app refresh.
     *
     * <pre>GET /api/auth/me/{userId}</pre>
     */
    @GetMapping("/me/{userId}")
    public ResponseEntity<AuthResponse> getProfile(@PathVariable String userId) {
        return ResponseEntity.ok(authService.getProfile(userId));
    }
}
