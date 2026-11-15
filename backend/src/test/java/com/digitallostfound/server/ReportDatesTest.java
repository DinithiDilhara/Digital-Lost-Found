package com.digitallostfound.server;

import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class ReportDatesTest {
    private final LocalDate today = LocalDate.of(2026, 11, 11);

    @Test void todayAndPastDatesAreAllowed() {
        assertNull(ReportDates.validationError("2026-11-11", today));
        assertNull(ReportDates.validationError("2026-11-10", today));
    }

    @Test void futureAndInvalidDatesAreRejected() {
        assertEquals("Report dates cannot be in the future (Sri Lanka time).",
            ReportDates.validationError("2026-11-12", today));
        assertEquals("Enter a valid report date.", ReportDates.validationError("2026-02-30", today));
        assertEquals("Enter a valid report date.", ReportDates.validationError("0999-12-31", today));
    }

    @Test void todayUsesSriLankaTimeZone() {
        assertEquals("Asia/Colombo", java.time.ZoneId.of("Asia/Colombo").getId());
        assertNull(ReportDates.validationError(ReportDates.today().toString(), ReportDates.today()));
    }
}
