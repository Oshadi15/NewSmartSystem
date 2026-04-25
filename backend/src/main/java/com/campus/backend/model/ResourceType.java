package com.campus.backend.model;

public enum ResourceType {
    LECTURE_HALL,
    LAB,
    MEETING_ROOM,
    EQUIPMENT,
    // Legacy aliases - kept for backward compatibility with existing DB documents
    ROOM   // maps to MEETING_ROOM conceptually
}

