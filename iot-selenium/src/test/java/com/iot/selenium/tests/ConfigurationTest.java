package com.iot.selenium.tests;

import java.time.Duration;
import java.util.Arrays;
import java.util.Map;

import com.iot.selenium.pages.SettingsPage;

import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.testng.Assert;
import org.testng.annotations.AfterClass;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.DataProvider;
import org.testng.annotations.Test;

public class ConfigurationTest extends BaseTest {
    private static final String SHEET_NAME = "Configuration";

    private boolean driverInitialized = false;
    private SettingsPage settingsPage;

    @BeforeMethod(alwaysRun = true)
    @Override
    public void setUp() {
        if (!driverInitialized) {
            super.setUp();
            driverInitialized = true;
        }
        settingsPage = new SettingsPage(driver);
        dismissAlertIfPresent();
    }

    @AfterMethod(alwaysRun = true)
    @Override
    public void tearDown() {
        try {
            if (driver != null && settingsPage != null) {
                settingsPage.saveIntervalsViaApi(5, 5, 5);
            }
        } catch (Exception ignored) {
        }
        // Do NOT call super.tearDown() — driver must stay alive across tests
    }

    @AfterClass(alwaysRun = true)
    public void tearDownClass() {
        driverInitialized = false;
        super.tearDown();
    }

    @DataProvider(name = "sheetData")
    public Object[][] sheetData() {
        return Arrays.stream(rowsForSheet(SHEET_NAME))
                .filter(row -> {
                    Map<String, String> rd = rowData(row);
                    return rd.getOrDefault("Test Case Name", "").startsWith("Selenium");
                })
                .toArray(Object[][]::new);
    }

    @Test(dataProvider = "sheetData")
    public void testConfiguration(Object[] row) throws Exception {
        Map<String, String> rd = rowData(row);
        Map<String, String> data = structuredData(rd);
        String tcId = rd.get("tc_id");
        String name = rd.get("Test Case Name");
        String testType = rd.get("Test Type");

        if ("TC-CFG11".equals(tcId)) {
            loginIfNeeded(data.get("email"), data.get("password"));
            driver.get(baseUrl + "/settings");
            settingsPage.waitForUrl("/settings", 15);
            settingsPage.waitForAngular();
            settingsPage.clickConfigurationTab();
            settingsPage.waitForConfigurationPanel();
            new WebDriverWait(driver, Duration.ofSeconds(15))
                    .until(d -> settingsPage.isSaveButtonDisabled());
            Assert.assertTrue(
                    settingsPage.isSaveButtonDisabled(),
                    "[" + tcId + "] Expected save button disabled when no changes");
            Assert.assertFalse(
                    settingsPage.isUnsavedBadgeVisible(),
                    "[" + tcId + "] Expected no unsaved badge when no changes");
            return;
        }

        openConfigurationTab(data);

        if ("TC-CFG01".equals(tcId)) {
            assertIntervalValue(tcId, "traffic", data.get("expectedTraffic"));
            assertIntervalValue(tcId, "air", data.get("expectedAir"));
            assertIntervalValue(tcId, "street", data.get("expectedStreet"));
            return;
        }

        if ("TC-CFG03".equals(tcId) || "TC-CFG12".equals(tcId)) {
            settingsPage.enterConfigurationInterval("traffic", data.get("trafficInterval"));
            settingsPage.enterConfigurationInterval("air", data.get("airPollutionInterval"));
            settingsPage.enterConfigurationInterval("street", data.get("streetLightInterval"));
            settingsPage.clickSaveChanges();
            assertBadgeHiddenAfterSave(tcId, data.get("expectedBadgeHidden"));

            if ("TC-CFG12".equals(tcId)) {
                settingsPage.clickBackToHome();
                settingsPage.navigateToSettings();
                settingsPage.clickConfigurationTab();
                settingsPage.waitForConfigurationPanel();
                assertIntervalValue(tcId, "traffic", data.get("trafficInterval"));
                assertIntervalValue(tcId, "air", data.get("airPollutionInterval"));
                assertIntervalValue(tcId, "street", data.get("streetLightInterval"));
            } else {
                reloadConfigurationTab();
                assertIntervalValue(tcId, "traffic", data.get("trafficInterval"));
                assertIntervalValue(tcId, "air", data.get("airPollutionInterval"));
                assertIntervalValue(tcId, "street", data.get("streetLightInterval"));
            }
            return;
        }

        if ("TC-CFG10".equals(tcId)) {
            settingsPage.enterConfigurationInterval(data.get("field"), data.get("value"));
            new WebDriverWait(driver, Duration.ofSeconds(5))
                    .until(d -> settingsPage.isUnsavedBadgeVisible());
            Assert.assertTrue(
                    settingsPage.isUnsavedBadgeVisible(),
                    "[" + tcId + "] Expected unsaved badge when interval changed");
            Assert.assertFalse(
                    settingsPage.isSaveButtonDisabled(),
                    "[" + tcId + "] Expected save button enabled when dirty");
            return;
        }

        String field = data.get("field");
        String value = data.get("value");
        settingsPage.enterConfigurationInterval(field, value);

        if ("Negative".equals(testType)) {
            String expectedTooltip = data.get("expectedTooltip");
            new WebDriverWait(driver, Duration.ofSeconds(5))
                    .until(d -> settingsPage.isConfigurationErrorTooltipVisible(field));
            String actualTooltip = settingsPage.getConfigurationErrorTooltipText(field);
            Assert.assertEquals(
                    actualTooltip,
                    expectedTooltip,
                    "[" + tcId + "] Expected tooltip '" + expectedTooltip + "' but got: '" + actualTooltip + "'");
            settingsPage.clickSaveChanges();
            settingsPage.waitForValidationAlert();
            String expectedAlert = data.get("expectedAlert");
            String actualAlert = settingsPage.getValidationAlertText();
            Assert.assertEquals(
                    actualAlert,
                    expectedAlert,
                    "[" + tcId + "] Expected alert '" + expectedAlert + "' but got: '" + actualAlert + "'");
            settingsPage.dismissValidationAlert();
            Assert.assertFalse(
                    settingsPage.isSuccessToastVisible(),
                    "[" + tcId + "] Expected no success toast for invalid value");
            return;
        }

        settingsPage.clickSaveChanges();
        assertBadgeHiddenAfterSave(tcId, data.get("expectedBadgeHidden"));
        reloadConfigurationTab();
        assertIntervalValue(tcId, field, value);
    }

    private void openConfigurationTab(Map<String, String> data) throws Exception {
        loginIfNeeded(data.get("email"), data.get("password"));
        settingsPage.saveIntervalsViaApi(5, 5, 5);
        settingsPage.navigateToSettings();
        new WebDriverWait(driver, Duration.ofSeconds(15))
                .until(d -> settingsPage.isSaveButtonDisabled());
        settingsPage.clickConfigurationTab();
        settingsPage.waitForConfigurationPanel();
    }

    private void reloadConfigurationTab() {
        driver.get(baseUrl + "/settings");
        settingsPage.waitForUrl("/settings", 15);
        settingsPage.waitForAngular();
        settingsPage.clickConfigurationTab();
        settingsPage.waitForConfigurationPanel();
        new WebDriverWait(driver, Duration.ofSeconds(15))
                .until(d -> !settingsPage.getConfigurationIntervalValue("traffic").isBlank());
    }

    private void loginIfNeeded(String email, String password) throws Exception {
        String url = driver.getCurrentUrl();
        boolean notAuthenticated = url == null
                || url.contains("data:")
                || url.contains("/login");
        if (notAuthenticated) {
            login(email, password);
        }
    }

    private void assertIntervalValue(String tcId, String field, String expected) {
        String actual = settingsPage.getConfigurationIntervalValue(field);
        Assert.assertEquals(
                actual,
                expected,
                "[" + tcId + "] Expected interval '" + expected + "' for " + field + " but got: '" + actual + "'");
    }

    private void dismissAlertIfPresent() {
        if (driver == null) {
            return;
        }
        try {
            if (settingsPage != null && settingsPage.isValidationAlertPresent()) {
                settingsPage.dismissValidationAlert();
            }
        } catch (Exception ignored) {
        }
    }

    private void assertBadgeHiddenAfterSave(String tcId, String expectedBadgeHidden) {
        boolean expectedHidden = Boolean.parseBoolean(expectedBadgeHidden);
        new WebDriverWait(driver, Duration.ofSeconds(15))
                .until(d -> settingsPage.isSaveButtonDisabled());
        boolean badgeVisible = settingsPage.isUnsavedBadgeVisible();
        Assert.assertEquals(
                badgeVisible,
                !expectedHidden,
                "[" + tcId + "] Expected unsaved badge hidden=" + expectedBadgeHidden
                        + " but badge visible=" + badgeVisible);
    }
}
