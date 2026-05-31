package com.iot.selenium.tests;

import java.time.Duration;
import java.util.Arrays;
import java.util.Map;

import com.iot.selenium.pages.SignupPage;

import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.testng.Assert;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.DataProvider;
import org.testng.annotations.Test;

public class SignupTest extends BaseTest {
    private WebDriverWait wait;

    @BeforeMethod(alwaysRun = true, dependsOnMethods = "setUp")
    public void initWait() {
        wait = new WebDriverWait(driver, Duration.ofSeconds(20));
    }

    @DataProvider(name = "sheetData")
    public Object[][] sheetData() {
        return Arrays.stream(rowsForSheet("Sign Up"))
                .filter(row -> rowData(row)
                        .getOrDefault("Test Case Name", "")
                        .startsWith("Selenium"))
                .toArray(Object[][]::new);
    }

    @Test(dataProvider = "sheetData")
    public void testSignup(Object[] row) {
        Map<String, String> rd = rowData(row);
        Map<String, String> data = structuredData(rd);
        String tcId = rd.getOrDefault("tc_id", "unknown");
        System.out.println(tcId + " | " + rd.getOrDefault("Test Case Name", ""));

        String email = data.getOrDefault("email", "");
        String firstName = data.getOrDefault("firstName", "");
        String lastName = data.getOrDefault("lastName", "");
        String password = data.getOrDefault("password", "");
        String confirmPassword = data.getOrDefault("confirmPassword", "");
        String expectedError = data.getOrDefault("expectedError", "");

        SignupPage page = new SignupPage(driver).open(baseUrl);
        page.fillForm(email, firstName, lastName, password, confirmPassword);
        page.submit();

        if (expectedError.isBlank()) {
            wait.until(ExpectedConditions.urlContains("/home"));
            Assert.assertTrue(
                    driver.getCurrentUrl().contains("/home"),
                    "[" + tcId + "] Expected redirect to /home but got: " + driver.getCurrentUrl());
        } else {
            String actual = page.getErrorText();
            Assert.assertEquals(
                    actual,
                    expectedError.trim(),
                    "[" + tcId + "] Expected error: '" + expectedError.trim() + "' but got: '" + actual + "'");
        }
    }
}
