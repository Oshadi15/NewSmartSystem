package com.campus.backend.controller;

import com.campus.backend.dto.NotificationDTO;
import com.campus.backend.exception.UnauthorizedException;
import com.campus.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Notification endpoints.
 *
 * <pre>
 * GET    /api/notifications/user/{userId}         — get user's notifications
 * GET    /api/notifications/user/{userId}/unread-count — unread badge count
 * PUT    /api/notifications/{id}/read             — mark one as read
 * PUT    /api/notifications/user/{userId}/read-all — mark all as read
 * DELETE /api/notifications/{id}                  — delete one
 * DELETE /api/notifications/user/{userId}/clear-all — clear all
 * </pre>
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<NotificationDTO>> getUserNotifications(
            @PathVariable String userId,
            @RequestAttribute("userId") String requestUserId,
            @RequestAttribute("userRole") String requestUserRole) {
        validateOwnerOrAdmin(userId, requestUserId, requestUserRole);
        return ResponseEntity.ok(notificationService.getUserNotifications(userId));
    }

    @GetMapping("/user/{userId}/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @PathVariable String userId,
            @RequestAttribute("userId") String requestUserId,
            @RequestAttribute("userRole") String requestUserRole) {
        validateOwnerOrAdmin(userId, requestUserId, requestUserRole);
        long count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationDTO> markAsRead(
            @PathVariable String id,
            @RequestAttribute("userId") String requestUserId,
            @RequestAttribute("userRole") String requestUserRole) {
        return ResponseEntity.ok(notificationService.markAsRead(id, requestUserId, requestUserRole));
    }

    @PutMapping("/user/{userId}/read-all")
    public ResponseEntity<Map<String, Object>> markAllAsRead(
            @PathVariable String userId,
            @RequestAttribute("userId") String requestUserId,
            @RequestAttribute("userRole") String requestUserRole) {
        validateOwnerOrAdmin(userId, requestUserId, requestUserRole);
        int count = notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(Map.of("markedRead", count));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(
            @PathVariable String id,
            @RequestAttribute("userId") String requestUserId,
            @RequestAttribute("userRole") String requestUserRole) {
        notificationService.deleteNotification(id, requestUserId, requestUserRole);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/user/{userId}/clear-all")
    public ResponseEntity<Void> clearAll(
            @PathVariable String userId,
            @RequestAttribute("userId") String requestUserId,
            @RequestAttribute("userRole") String requestUserRole) {
        validateOwnerOrAdmin(userId, requestUserId, requestUserRole);
        notificationService.clearAll(userId);
        return ResponseEntity.noContent().build();
    }

    private void validateOwnerOrAdmin(String targetUserId, String requestUserId, String requestUserRole) {
        if ("ADMIN".equalsIgnoreCase(requestUserRole)) return;
        if (!targetUserId.equals(requestUserId)) {
            throw new UnauthorizedException("You can only access your own notifications.");
        }
    }
}
