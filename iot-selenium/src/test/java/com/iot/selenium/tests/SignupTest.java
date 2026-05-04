package com.iot.selenium.tests;

import java.util.Map;

import com.iot.selenium.pages.DashboardPage;
import com.iot.selenium.pages.SignupPage;
import org.testng.Assert;
import org.testng.annotations.DataProvider;
import org.testng.annotations.Test;

public class SignupTest extends BaseTest {
    @DataProvider(name = "signupSuccessData")
    public Object[][] signupSuccessData() {
        return rowsForSheetWhere("Sign Up", "Test Case Name", "Selenium Registration Success");
    }

    @Test(dataProvider = "signupSuccessData")
    public void shouldRegisterSuccessfully(Map<String, String> data) {
        Map<String, String> testData = structuredData(data);
        String email = buildUniqueEmail(testData.getOrDefault("emailPrefix", "selenium.signup"), testData.getOrDefault("emailDomain", "example.com"));
        String firstName = testData.getOrDefault("firstName", "Alice");
        String lastName = testData.getOrDefault("lastName", "Brown");
        String password = testData.getOrDefault("password", "Signup123!");

        new SignupPage(driver).open(baseUrl).register(email, firstName, lastName, password);

        DashboardPage dashboardPage = new DashboardPage(driver);
        Assert.assertTrue(
                dashboardPage.getGreetingText().contains(testData.getOrDefault("expectedGreetingName", firstName)),
                "Dashboard greeting did not contain the expected name after registration.");
    }

    private String buildUniqueEmail(String emailPrefix, String emailDomain) {
        return emailPrefix + "+" + System.currentTimeMillis() + "@" + emailDomain;
    }
}