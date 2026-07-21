package com.iot.selenium.tests;

import org.testng.annotations.Test;

/**
 * Primes shared API auth once after Sign In so the default user from {@code config.properties}
 * exists in the DB. Must not use {@code @BeforeSuite} — that runs before Signup/Signin.
 */
public final class SuiteAuthBootstrap {
    @Test(description = "Cache JWT + iot_user for later restoreAuthenticatedSession() calls")
    public void primeSharedApiAuth() {
        BaseTest.primeSharedAuthForSuite();
    }
}
