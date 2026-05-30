package com.iot.selenium.tests;

import java.time.Duration;
import java.util.Arrays;
import java.util.Map;

import com.iot.selenium.pages.DashboardPage;
import com.iot.selenium.pages.UserProfilePage;

import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.testng.Assert;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.DataProvider;
import org.testng.annotations.Test;

public class UserProfileTest extends BaseTest {
    private WebDriverWait wait;

    @BeforeMethod(alwaysRun = true, dependsOnMethods = "setUp")
    public void initWait() {
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));
    }

    @DataProvider(name = "sheetData")
    public Object[][] sheetData() {
        return Arrays.stream(rowsForSheet("Profile Page"))
                .filter(row -> rowData(row)
                        .getOrDefault("Test Case Name", "")
                        .startsWith("Selenium"))
                .toArray(Object[][]::new);
    }

    @Test(dataProvider = "sheetData")
    public void testUserProfile(Object[] row) {
        Map<String, String> rd = rowData(row);
        Map<String, String> data = structuredData(rd);
        String tcId = rd.getOrDefault("tc_id", "unknown");
        String testCaseName = rd.getOrDefault("Test Case Name", "");
        System.out.println(tcId + " | " + testCaseName);

        String email = data.getOrDefault("email", "");
        String password = data.getOrDefault("password", "");
        String expectedName = data.getOrDefault("expectedName", "");
        String expectedEmail = data.getOrDefault("expectedEmail", "");

        if (testCaseName.contains("displays correct user name")) {
            login(email, password);
            String actual = new UserProfilePage(driver).open(baseUrl).waitForLoad().getFullName();
            Assert.assertEquals(
                    actual,
                    expectedName,
                    "[" + tcId + "] Expected name: '" + expectedName + "' but got: '" + actual + "'");
        } else if (testCaseName.contains("displays correct email")) {
            login(email, password);
            String actual = new UserProfilePage(driver).open(baseUrl).waitForLoad().getEmail();
            Assert.assertEquals(
                    actual,
                    expectedEmail,
                    "[" + tcId + "] Expected email: '" + expectedEmail + "' but got: '" + actual + "'");
        } else if (testCaseName.contains("back button")) {
            login(email, password);
            new UserProfilePage(driver).open(baseUrl).waitForLoad().clickBack();
            wait.until(ExpectedConditions.urlContains("/home"));
            Assert.assertTrue(
                    driver.getCurrentUrl().contains("/home"),
                    "[" + tcId + "] Expected /home after back but got: " + driver.getCurrentUrl());
        } else if (testCaseName.contains("avatar click")) {
            login(email, password);
            new DashboardPage(driver).waitForLoad().clickAvatar();
            wait.until(ExpectedConditions.urlContains("/profile"));
            Assert.assertTrue(
                    driver.getCurrentUrl().contains("/profile"),
                    "[" + tcId + "] Expected /profile after avatar click but got: " + driver.getCurrentUrl());
        } else if (testCaseName.contains("unauthenticated")) {
            driver.get(baseUrl + "/profile");
            new WebDriverWait(driver, Duration.ofSeconds(10))
                    .until(ExpectedConditions.urlContains("/login"));
            Assert.assertTrue(
                    driver.getCurrentUrl().contains("/login"),
                    "[" + tcId + "] Expected redirect to /login but got: " + driver.getCurrentUrl());
        } else {
            throw new IllegalStateException(
                    "[" + tcId + "] No matching branch for test case: " + testCaseName);
        }
    }
}
