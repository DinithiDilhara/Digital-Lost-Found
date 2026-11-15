package com.digitallostfound.server;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.format.ResolverStyle;

final class ReportDates {
    private static final ZoneId SRI_LANKA = ZoneId.of("Asia/Colombo");
    private static final DateTimeFormatter DATE_FORMAT =
        DateTimeFormatter.ofPattern("uuuu-MM-dd").withResolverStyle(ResolverStyle.STRICT);

    private ReportDates() {}

    static LocalDate today() {
        return LocalDate.now(SRI_LANKA);
    }

    static String validationError(String value, LocalDate today) {
        final LocalDate date;
        try {
            date = LocalDate.parse(value, DATE_FORMAT);
        } catch (DateTimeParseException | NullPointerException error) {
            return "Enter a valid report date.";
        }
        if (date.getYear() < 1000) return "Enter a valid report date.";
        if (date.isAfter(today)) return "Report dates cannot be in the future (Sri Lanka time).";
        return null;
    }
}
