package com.iot.selenium.tests;

import java.util.Map;

import com.iot.selenium.pages.DashboardPage;
import com.iot.selenium.pages.UserProfilePage;
import org.testng.Assert;
import org.testng.annotations.DataProvider;
import org.testng.annotations.Test;

public class UserProfileTest extends BaseTest {
    @DataProvider(name = "profileData")
    public Object[][] profileData() {
        return rowsForSheetWhere("Profile Page", "Test Case Name", "Selenium Profile Smoke");
    }

    @Test(dataProvider = "profileData")
    public void shouldDisplayProfileDetails(Map<String, String> data) {
        Map<String, String> testData = structuredData(data);

        login(testData.get("email"), testData.get("password"));

        UserProfilePage profilePage = new DashboardPage(driver).openProfile();
        Assert.assertEquals(profilePage.getFirstName(), testData.getOrDefault("expectedFirstName", ""));
        Assert.assertEquals(profilePage.getLastName(), testData.getOrDefault("expectedLastName", ""));
        Assert.assertEquals(profilePage.getEmail(), testData.getOrDefault("expectedEmail", ""));
        Assert.assertTrue(profilePage.isChangePasswordVisible(), "Change password action should be visible.");
    }

    @Test(dataProvider = "profileData")
    public void shouldReturnToDashboardFromProfile(Map<String, String> data) {
        Map<String, String> testData = structuredData(data);

        login(testData.get("email"), testData.get("password"));

        UserProfilePage profilePage = new DashboardPage(driver).openProfile();
        profilePage.goBackToDashboard();

        DashboardPage dashboardPage = new DashboardPage(driver);
        Assert.assertTrue(
                dashboardPage.getGreetingText().contains(testData.getOrDefault("expectedGreetingName", "")),
                "Should return to the dashboard after clicking Back.");
    }
}