package com.campus.backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResourceAvailability {
    private LocalTime startTime;
    private LocalTime endTime;
}
