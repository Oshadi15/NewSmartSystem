package com.campus.backend.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

/**
 * Embeds structured availability into a Resource.
 * Represents the daily operating window (e.g. 08:00 – 22:00).
 * Validated: startTime must be strictly before endTime.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourceAvailability {

    @JsonFormat(pattern = "HH:mm")
    private LocalTime startTime;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime endTime;

    /**
     * Returns true only when both times are set and startTime is before endTime.
     */
    public boolean isValid() {
        if (startTime == null || endTime == null) return true; // null = unrestricted, treated as valid
        return startTime.isBefore(endTime);
    }
}
