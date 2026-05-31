package com.iot.selenium.tests;

import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.iot.selenium.pages.SigninPage;
import com.iot.selenium.pages.UserProfilePage;

import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.testng.Assert;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.DataProvider;
import org.testng.annotations.Test;

public class LogoutTest extends BaseTest {
    private WebDriverWait wait;

    @BeforeMethod(alwaysRun = true, dependsOnMethods = "setUp")
    public void initWait() {
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));
    }

    @DataProvider(name = "sheetData")
    public Object[][] sheetData() {
        return Arrays.stream(rowsForSheet("Logout"))
                .filter(row -> rowData(row)
                        .getOrDefault("Test Case Name", "")
                        .startsWith("Selenium"))
                .toArray(Object[][]::new);
    }

    @Test(dataProvider = "sheetData")
    public void testSuccessfulLogout(Object[] row) {
        Map<String, String> rd = rowData(row);
        System.out.println(rd.get("tc_id"));
        Map<String, String> data = structuredData(rd);
        String tcId = Optional.ofNullable(rd.get("tc_id")).filter(s -> !s.isBlank()).orElse("unknown");

        String email = data.getOrDefault("email", "");
        String password = data.getOrDefault("password", "");

        SigninPage signinPage = new SigninPage(driver);
        signinPage.open(baseUrl);
        signinPage.login(email, password);
        wait.until(ExpectedConditions.urlContains("/home"));

        driver.get(baseUrl + "/profile");
        wait.until(ExpectedConditions.urlContains("/profile"));

        UserProfilePage userProfilePage = new UserProfilePage(driver);
        userProfilePage.clickLogout();
        wait.until(ExpectedConditions.urlContains("/login"));

        Assert.assertTrue(
                driver.getCurrentUrl().contains("/login"),
                "[" + tcId + "] Expected URL to contain '/login' but got: " + driver.getCurrentUrl());
    }

    @Test(dependsOnMethods = "testSuccessfulLogout")
    public void testAuthGuardAfterLogout() {
        List<Map<String, String>> rows = Arrays.stream(rowsForSheet("Logout"))
                .map(this::rowData)
                .filter(r -> r.getOrDefault("Test Case Name", "").startsWith("Selenium"))
                .toList();
        Map<String, String> rd = rows.size() >= 2 ? rows.get(1) : rows.isEmpty() ? Map.of() : rows.get(0);
        System.out.println(rd.get("tc_id"));
        String tcId = Optional.ofNullable(rd.get("tc_id")).filter(s -> !s.isBlank()).orElse("unknown");

        driver.get(baseUrl + "/home");
        wait.until(ExpectedConditions.urlContains("/login"));
        Assert.assertTrue(
                driver.getCurrentUrl().contains("/login"),
                "[" + tcId + "] Expected URL to contain '/login' but got: " + driver.getCurrentUrl());
    }
}
