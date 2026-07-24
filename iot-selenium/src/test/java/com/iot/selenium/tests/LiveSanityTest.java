package com.iot.selenium.tests;

import java.time.Duration;

import com.iot.selenium.pages.AlertsPage;
import com.iot.selenium.pages.DashboardPage;
import com.iot.selenium.pages.SettingsPage;
import com.iot.selenium.pages.TrafficDashboardPage;
import com.iot.selenium.pages.UserProfilePage;
import com.iot.selenium.utils.LiveDbGuard;

import org.testng.Assert;
import org.testng.annotations.Test;

public class LiveSanityTest extends BaseTest {

    @Test
    public void testAuthenticatedHomeLoads() {
        restoreAuthenticatedSession();

        DashboardPage dashboardPage = new DashboardPage(driver).waitForLoad();

        Assert.assertTrue(dashboardPage.isLoaded(), "Expected authenticated home dashboard to load.");
        logLiveSanityRun();
    }

    @Test
    public void testProfileIsReadable() {
        restoreAuthenticatedSession();

        UserProfilePage profilePage = new UserProfilePage(driver)
                .open(baseUrl)
                .waitForLoad();

        Assert.assertEquals(
                profilePage.getEmail(),
                configReader.getLoginEmail(),
                "Expected profile email to match the configured Selenium user.");
    }

    @Test
    public void testSettingsPageLoadsReadOnly() {
        restoreAuthenticatedSession();

        SettingsPage settingsPage = new SettingsPage(driver);
        settingsPage.navigateToSettings();

        Assert.assertTrue(settingsPage.isSettingsHeadingVisible(), "Expected settings heading to be visible.");
        Assert.assertTrue(settingsPage.areSettingsTabButtonsVisible(), "Expected settings tabs to be visible.");
    }

    @Test
    public void testNotificationPanelOpensAndClosesReadOnly() {
        restoreAuthenticatedSession();

        AlertsPage alertsPage = new AlertsPage(driver);
        alertsPage.navigateToHome();
        alertsPage.clickNotificationsBell();
        alertsPage.waitForPanelVisible();

        Assert.assertTrue(alertsPage.isPanelVisible(), "Expected notification panel to open.");

        alertsPage.clickClosePanel();
        alertsPage.waitForPanelClosed();

        Assert.assertFalse(alertsPage.isPanelVisible(), "Expected notification panel to close.");
    }

    @Test
    public void testDashboardEntryPointNavigationReadOnly() {
        restoreAuthenticatedSession();

        DashboardPage dashboardPage = new DashboardPage(driver).waitForLoad();
        Assert.assertTrue(dashboardPage.isLoaded(), "Expected dashboard to load before entry-point checks.");

        TrafficDashboardPage trafficDashboardPage = new TrafficDashboardPage(driver);
        Assert.assertTrue(
                trafficDashboardPage.isTrafficNavCardVisible(),
                "Expected traffic dashboard card to be visible.");
        Assert.assertTrue(
                trafficDashboardPage.isAirQualityNavCardVisible(),
                "Expected air quality dashboard card to be visible.");
        Assert.assertTrue(
                trafficDashboardPage.isStreetLightsNavCardVisible(),
                "Expected street light dashboard card to be visible.");

        trafficDashboardPage.openFromHome();
        Assert.assertTrue(driver.getCurrentUrl().contains(configReader.getTrafficDashboardPath()));
    }

    private void logLiveSanityRun() {
        System.out.println("Live DB mode: " + LiveDbGuard.isLiveDb());
        System.out.println("Selenium user: " + configReader.getLoginEmail());
        System.out.println("Browser timeout: " + Duration.ofSeconds(configReader.getExplicitWaitSeconds()));
    }
}
