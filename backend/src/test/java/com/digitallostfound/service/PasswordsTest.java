package com.digitallostfound.service;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class PasswordsTest {
    @Test void hashesAreSaltedAndVerifyOnlyTheOriginalPassword() {
        String password = " campus test passphrase ";
        String hash = Passwords.hash(password);
        assertNotEquals(hash, Passwords.hash(password));
        assertTrue(Passwords.verify(password, hash));
        assertFalse(Passwords.verify(password.trim(), hash));
        assertFalse(Passwords.verify("wrong", hash));
    }
    @Test void legacyPlaintextAndMalformedHashesCannotLogIn() {
        assertFalse(Passwords.verify("12345", "12345"));
        assertFalse(Passwords.verify("pass", "TEST_HASH_NOT_FOR_REAL_LOGIN"));
        assertFalse(Passwords.verify("pass", "pbkdf2-sha256$999999999$a$b"));
        assertFalse(Passwords.verify("pass", null));
    }
    @Test void sessionsHaveIndependentUnpredictableValues() {
        String first = Passwords.token();
        assertTrue(first.matches("[A-Za-z0-9_-]{43}"));
        assertNotEquals(first, Passwords.token());
        assertEquals(64, Passwords.digest(first).length());
    }
}
