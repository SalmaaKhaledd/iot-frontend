package com.iot.selenium.tests;

import java.util.Map;

import com.iot.selenium.pages.DashboardPage;
import org.testng.Assert;
import org.testng.annotations.DataProvider;
import org.testng.annotations.Test;

public class DashboardTest extends BaseTest {
    @DataProvider(name = "dashboardData")
    public Object[][] dashboardData() {
        return rowsForSheetWhere("Sign In", "Test Case Name", "Selenium Login Success");
    }

    @Test(dataProvider = "dashboardData")
    public void shouldDisplayDashboardGreetingAndProfileShortcut(Map<String, String> data) {
        Map<String, String> testData = structuredData(data);

        login(testData.get("email"), testData.get("password"));

        DashboardPage dashboardPage = new DashboardPage(driver);
        Assert.assertTrue(
            dashboardPage.getGreetingText().contains(testData.getOrDefault("expectedGreetingName", "")),
                "Dashboard greeting did not contain the expected name.");

        if (!testData.getOrDefault("expectedRefreshNotice", "").isBlank()) {
            Assert.assertEquals(dashboardPage.getRefreshNotice(), testData.get("expectedRefreshNotice"));
        }

        Assert.assertNotNull(dashboardPage.openProfile(), "Profile page should be reachable from the dashboard.");
    }
}