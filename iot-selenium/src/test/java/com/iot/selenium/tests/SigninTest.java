package com.iot.selenium.tests;

import java.util.Map;

import com.iot.selenium.pages.DashboardPage;
import com.iot.selenium.pages.SigninPage;
import org.testng.Assert;
import org.testng.annotations.DataProvider;
import org.testng.annotations.Test;

public class SigninTest extends BaseTest {
    @DataProvider(name = "positiveLoginData")
    public Object[][] positiveLoginData() {
        return rowsForSheetWhere("Sign In", "Test Case Name", "Selenium Login Success");
    }

    @DataProvider(name = "negativeLoginData")
    public Object[][] negativeLoginData() {
        return rowsForSheetWhere("Sign In", "Test Case Name", "Selenium Login Failure");
    }

    @Test(dataProvider = "positiveLoginData")
    public void shouldLoginSuccessfully(Map<String, String> data) {
        Map<String, String> testData = structuredData(data);

        new SigninPage(driver).open(baseUrl).login(testData.get("email"), testData.get("password"));

        DashboardPage dashboardPage = new DashboardPage(driver);
        Assert.assertTrue(
                dashboardPage.getGreetingText().contains(testData.getOrDefault("expectedGreetingName", "")),
                "Dashboard greeting did not contain the expected name.");
    }

    @Test(dataProvider = "negativeLoginData")
    public void shouldShowLoginErrorForInvalidCredentials(Map<String, String> data) {
        Map<String, String> testData = structuredData(data);

        SigninPage signinPage = new SigninPage(driver).open(baseUrl).login(testData.get("email"), testData.get("password"));

        Assert.assertTrue(
                signinPage.getErrorMessage().contains(testData.getOrDefault("expectedError", "")),
                "Login error message did not match the expected text.");
    }
}