package com.mdevs.cinefy.entity;

import com.mdevs.cinefy.entity.enums.EmploymentType;
import com.mdevs.cinefy.entity.enums.StaffPosition;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.DayOfWeek;
import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(indexes = {
        @Index(columnList = "POSITION"),
        @Index(columnList = "CREATED_AT"),
        @Index(columnList = "WORKING_HOUR_START, WORKING_HOUR_END")
})
public class StaffMember extends User {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StaffPosition position;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EmploymentType employmentType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DayOfWeek workingDayStart;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DayOfWeek workingDayEnd;

    @Column(nullable = false)
    private LocalTime workingHourStart;

    @Column(nullable = false)
    private LocalTime workingHourEnd;
}
