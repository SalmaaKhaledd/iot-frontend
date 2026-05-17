package com.iot.selenium.tests;

import java.time.Duration;
import java.util.Arrays;
import java.util.Map;

import com.iot.selenium.pages.SettingsPage;
import com.iot.selenium.pages.UserProfilePage;

import org.openqa.selenium.support.ui.WebDriverWait;
import org.testng.Assert;
import org.testng.annotations.AfterClass;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.DataProvider;
import org.testng.annotations.Test;

public class SettingsTest extends BaseTest {
    private static final String SHEET_NAME = "Settings & Alerts";

    private boolean driverInitialized = false;

    private static final String TD = "Enter a value between 0 to 500";
    private static final String AS = "Enter a value between 0 to 120";
    private static final String CO = "Enter a value between 0 to 50";
    private static final String OZ = "Enter a value between 0 to 300";
    private static final String BL = "Enter a value between 0 to 100";
    private static final String PC = "Enter a value between 0 to 5000";
    private static final String[] ALL_PLACEHOLDERS = { TD, AS, CO, OZ, BL, PC };

    private SettingsPage settingsPage;

    @BeforeMethod(alwaysRun = true)
    @Override
    public void setUp() {
        if (!driverInitialized) {
            super.setUp();
            driverInitialized = true;
        }
        settingsPage = new SettingsPage(driver);
    }

    @AfterMethod(alwaysRun = true)
    @Override
    public void tearDown() {
        try {
            if (driver != null && settingsPage != null) {
                settingsPage.flushSettings();
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

    @DataProvider(name = "navigationData")
    public Object[][] navigationData() {
        return Arrays.stream(rowsForSheet(SHEET_NAME))
                .filter(row -> {
                    Map<String, String> rd = rowData(row);
                    return isSelenium(rd) && inRange(rd, 64, 73);
                })
                .toArray(Object[][]::new);
    }

    @DataProvider(name = "initialStateData")
    public Object[][] initialStateData() {
        return Arrays.stream(rowsForSheet(SHEET_NAME))
                .filter(row -> {
                    Map<String, String> rd = rowData(row);
                    return isSelenium(rd) && inRange(rd, 74, 82);
                })
                .toArray(Object[][]::new);
    }

    @DataProvider(name = "toggleAddRemoveData")
    public Object[][] toggleAddRemoveData() {
        return Arrays.stream(rowsForSheet(SHEET_NAME))
                .filter(row -> {
                    Map<String, String> rd = rowData(row);
                    return isSelenium(rd) && inRange(rd, 83, 97);
                })
                .toArray(Object[][]::new);
    }

    @DataProvider(name = "bvaData")
    public Object[][] bvaData() {
        return Arrays.stream(rowsForSheet(SHEET_NAME))
                .filter(row -> {
                    Map<String, String> rd = rowData(row);
                    return isSelenium(rd) && inRange(rd, 102, 128);
                })
                .toArray(Object[][]::new);
    }

    @DataProvider(name = "contradictionData")
    public Object[][] contradictionData() {
        return Arrays.stream(rowsForSheet(SHEET_NAME))
                .filter(row -> {
                    Map<String, String> rd = rowData(row);
                    return isSelenium(rd) && inRange(rd, 129, 136);
                })
                .toArray(Object[][]::new);
    }

    @DataProvider(name = "saveFlowData")
    public Object[][] saveFlowData() {
        return Arrays.stream(rowsForSheet(SHEET_NAME))
                .filter(row -> {
                    Map<String, String> rd = rowData(row);
                    return isSelenium(rd) && inRange(rd, 137, 138);
                })
                .toArray(Object[][]::new);
    }

    @DataProvider(name = "multiUserData")
    public Object[][] multiUserData() {
        return Arrays.stream(rowsForSheet(SHEET_NAME))
                .filter(row -> {
                    Map<String, String> rd = rowData(row);
                    return isSelenium(rd) && inRange(rd, 146, 146);
                })
                .toArray(Object[][]::new);
    }

    @DataProvider(name = "newUserData")
    public Object[][] newUserData() {
        return Arrays.stream(rowsForSheet(SHEET_NAME))
                .filter(row -> {
                    Map<String, String> rd = rowData(row);
                    return isSelenium(rd) && inRange(rd, 148, 148);
                })
                .toArray(Object[][]::new);
    }

    @DataProvider(name = "persistenceData")
    public Object[][] persistenceData() {
        return Arrays.stream(rowsForSheet(SHEET_NAME))
                .filter(row -> {
                    Map<String, String> rd = rowData(row);
                    return isSelenium(rd) && inRange(rd, 149, 151);
                })
                .toArray(Object[][]::new);
    }

    @Test(dataProvider = "navigationData")
    public void testNavigation(Object[] row) throws Exception {
        Map<String, String> rd = rowData(row);
        Map<String, String> data = structuredData(rd);
        String tcId = rd.get("tc_id");
        String name = rd.get("Test Case Name");

        if ("Negative".equals(rd.get("Test Type"))) {
            driver.get("http://localhost:4200");
            settingsPage.clearLocalStorage();
            driver.get("http://localhost:4200/settings");
            new WebDriverWait(driver, Duration.ofSeconds(10))
                    .until(d -> d.getCurrentUrl().contains("/login"));
            Assert.assertTrue(
                    driver.getCurrentUrl().contains("/login"),
                    "[" + tcId + "] Expected redirect to /login");
            return;
        }

        if (name.contains("topbar")) {
            String currentUrl = driver.getCurrentUrl();
            if (currentUrl == null || currentUrl.contains("data:") || currentUrl.contains("/login")) {
                login(data.get("email"), data.get("password"));
            }
            driver.get(baseUrl + "/home");
            settingsPage.clickTopbarSettings();
            Assert.assertTrue(
                    driver.getCurrentUrl().contains("/settings"),
                    "[" + tcId + "] Expected /settings");
            return;
        }

        flushAndOpen(rd, data);

        if (name.contains("page loads")) {
            Assert.assertTrue(settingsPage.isSettingsHeadingVisible(), "[" + tcId + "] Heading not visible");
            Assert.assertTrue(settingsPage.areSettingsTabButtonsVisible(), "[" + tcId + "] Tabs not visible");
        } else if (name.contains("Thresholds tab is active by default")) {
            Assert.assertTrue(settingsPage.isThresholdsTabActive(), "[" + tcId + "] Thresholds tab not active");
        } else if (name.contains("Back to Home")) {
            settingsPage.clickBackToHome();
            Assert.assertTrue(driver.getCurrentUrl().contains("/home"), "[" + tcId + "] Expected /home");
        } else if (name.contains("Configuration tab switches")) {
            settingsPage.clickConfigurationTab();
            new WebDriverWait(driver, Duration.ofSeconds(5))
                    .until(d -> settingsPage.isConfigurationTabActive());
            Assert.assertTrue(settingsPage.isConfigurationTabActive(), "[" + tcId + "] Config tab not active");
        } else if (name.contains("Thresholds tab from Configuration")) {
            settingsPage.clickConfigurationTab();
            settingsPage.clickThresholdsTab();
            new WebDriverWait(driver, Duration.ofSeconds(5))
                    .until(d -> settingsPage.isThresholdsTabActive());
            Assert.assertTrue(settingsPage.isThresholdsTabActive(), "[" + tcId + "] Thresholds tab not active");
        } else if (name.contains("active tab button")) {
            Assert.assertTrue(settingsPage.isThresholdsTabActive(), "[" + tcId + "] Thresholds should be active");
            Assert.assertFalse(settingsPage.isConfigurationTabActive(), "[" + tcId + "] Config should be inactive");
            settingsPage.clickConfigurationTab();
            new WebDriverWait(driver, Duration.ofSeconds(5))
                    .until(d -> settingsPage.isConfigurationTabActive());
            Assert.assertTrue(settingsPage.isConfigurationTabActive(), "[" + tcId + "] Config tab not active");
            Assert.assertFalse(settingsPage.isThresholdsTabActive(), "[" + tcId + "] Thresholds should be inactive");
        }
    }

    @Test(dataProvider = "initialStateData")
    public void testInitialState(Object[] row) throws Exception {
        Map<String, String> rd = rowData(row);
        Map<String, String> data = structuredData(rd);
        String tcId = rd.get("tc_id");
        String name = rd.get("Test Case Name");

        flushAndOpen(rd, data);

        if (name.contains("condition buttons default")) {
            for (String ph : ALL_PLACEHOLDERS) {
                Assert.assertEquals(
                        settingsPage.getConditionButtonText(ph),
                        "Above",
                        "[" + tcId + "] Condition not Above for: " + ph);
            }
        } else if (name.contains("Add another threshold") && name.contains("on load")) {
            for (String ph : ALL_PLACEHOLDERS) {
                Assert.assertTrue(
                        settingsPage.isAddThresholdButtonVisible(ph),
                        "[" + tcId + "] Add button not visible for: " + ph);
            }
        } else if (name.contains("placeholder")) {
            String ph = placeholderForTcId(tcId);
            Assert.assertEquals(
                    settingsPage.getPlaceholderText(ph),
                    ph,
                    "[" + tcId + "] Placeholder mismatch");
        } else if (name.contains("disabled when no changes")) {
            Assert.assertTrue(settingsPage.isSaveButtonDisabled(), "[" + tcId + "] Save button should be disabled");
        }
    }

    @Test(dataProvider = "toggleAddRemoveData")
    public void testToggleAddRemove(Object[] row) throws Exception {
        Map<String, String> rd = rowData(row);
        Map<String, String> data = structuredData(rd);
        String tcId = rd.get("tc_id");
        String name = rd.get("Test Case Name");

        flushAndOpen(rd, data);
        settingsPage.waitForDefaultThresholdState(TD);

        if (name.contains("toggles it to")) {
            settingsPage.clickConditionButton(TD);
            Assert.assertEquals(settingsPage.getConditionButtonText(TD), "Below", "[" + tcId + "]");
        } else if (name.contains("toggles back")) {
            settingsPage.clickConditionButton(TD);
            settingsPage.clickConditionButton(TD);
            Assert.assertEquals(settingsPage.getConditionButtonText(TD), "Above", "[" + tcId + "]");
        } else if (name.contains("does not toggle")) {
            settingsPage.clickAddThreshold(TD);
            String before = settingsPage.getConditionButtonText(TD);
            settingsPage.clickConditionButton(TD);
            Assert.assertEquals(settingsPage.getConditionButtonText(TD), before, "[" + tcId + "]");
        } else if (name.contains("adds a second")) {
            settingsPage.clickAddThreshold(TD);
            Assert.assertEquals(settingsPage.countThresholdRows(TD), 2, "[" + tcId + "]");
        } else if (name.contains("opposite condition")) {
            settingsPage.clickAddThreshold(TD);
            Assert.assertEquals(settingsPage.getConditionButtonText(TD, 1), "Below", "[" + tcId + "]");
        } else if (name.contains("Above row appears before")) {
            settingsPage.clickConditionButton(TD);
            settingsPage.clickAddThreshold(TD);
            Assert.assertEquals(settingsPage.getConditionButtonText(TD, 0), "Above", "[" + tcId + "]");
        } else if (name.contains("disappears after 2")) {
            settingsPage.clickAddThreshold(TD);
            Assert.assertFalse(settingsPage.isAddThresholdButtonVisible(TD), "[" + tcId + "]");
        } else if (name.contains("X removes")) {
            settingsPage.clickAddThreshold(TD);
            settingsPage.clickRemoveThreshold(TD);
            Assert.assertEquals(settingsPage.countThresholdRows(TD), 1, "[" + tcId + "]");
        } else if (name.contains("reappears after removing")) {
            settingsPage.clickAddThreshold(TD);
            settingsPage.clickRemoveThreshold(TD);
            Assert.assertTrue(settingsPage.isAddThresholdButtonVisible(TD), "[" + tcId + "]");
        } else if (name.contains("not visible on clean load")) {
            Assert.assertFalse(settingsPage.isUnsavedBadgeVisible(), "[" + tcId + "]");
        } else if (name.contains("appears after entering")) {
            settingsPage.enterThresholdValue(TD, data.get("thresholdValue"));
            new WebDriverWait(driver, Duration.ofSeconds(5))
                    .until(d -> settingsPage.isUnsavedBadgeVisible());
            Assert.assertTrue(settingsPage.isUnsavedBadgeVisible(), "[" + tcId + "]");
        } else if (name.contains("disappears after successful save")) {
            settingsPage.enterThresholdValue(TD, data.get("thresholdValue"));
            settingsPage.clickSaveChanges();
            new WebDriverWait(driver, Duration.ofSeconds(15))
                    .until(d -> settingsPage.isSaveButtonDisabled());
            Assert.assertTrue(
                    settingsPage.isSaveButtonDisabled(),
                    "Save button should be disabled after successful save");
            Assert.assertFalse(settingsPage.isUnsavedBadgeVisible(), "[" + tcId + "]");
        } else if (name.contains("becomes disabled again")) {
            settingsPage.enterThresholdValue(TD, data.get("thresholdValue"));
            settingsPage.clickSaveChanges();
            new WebDriverWait(driver, Duration.ofSeconds(15))
                    .until(d -> settingsPage.isSaveButtonDisabled());
            Assert.assertTrue(
                    settingsPage.isSaveButtonDisabled(),
                    "Save button should be disabled after successful save");
            Assert.assertTrue(settingsPage.isSaveButtonDisabled(), "[" + tcId + "]");
        } else if (name.contains("toggling condition")) {
            settingsPage.enterThresholdValue(TD, data.get("thresholdValue"));
            settingsPage.clickSaveChanges();
            new WebDriverWait(driver, Duration.ofSeconds(15))
                    .until(d -> settingsPage.isSaveButtonDisabled());
            Assert.assertTrue(
                    settingsPage.isSaveButtonDisabled(),
                    "Save button should be disabled after successful save");
            settingsPage.clickConditionButton(TD);
            new WebDriverWait(driver, Duration.ofSeconds(5))
                    .until(d -> settingsPage.isUnsavedBadgeVisible());
            Assert.assertTrue(settingsPage.isUnsavedBadgeVisible(), "[" + tcId + "]");
        } else if (name.contains("persist after leaving")) {
            String expectedValue = data.get("thresholdValue");
            settingsPage.enterThresholdValue(TD, expectedValue);
            String targetCondition = data.get("condition");
            if (!targetCondition.equals(settingsPage.getConditionButtonText(TD))) {
                settingsPage.clickConditionButton(TD);
            }
            settingsPage.clickSaveChanges();
            new WebDriverWait(driver, Duration.ofSeconds(15))
                    .until(d -> settingsPage.isSaveButtonDisabled());
            settingsPage.clickBackToHome();
            settingsPage.navigateToSettings();
            settingsPage.waitForThresholdValue(TD, expectedValue);
            Assert.assertEquals(
                    settingsPage.getThresholdValue(TD),
                    expectedValue,
                    "[" + tcId + "] Value not persisted");
            Assert.assertEquals(
                    settingsPage.getConditionButtonText(TD),
                    targetCondition,
                    "[" + tcId + "] Condition not persisted");
        }
    }

    @Test(dataProvider = "bvaData")
    public void testBoundaryValidation(Object[] row) throws Exception {
        Map<String, String> rd = rowData(row);
        Map<String, String> data = structuredData(rd);
        String tcId = rd.get("tc_id");
        String testType = rd.get("Test Type");
        String placeholder = placeholderFor(data.get("metric"));
        String value = data.get("thresholdValue");

        flushAndOpen(rd, data);
        settingsPage.enterThresholdValue(placeholder, value);

        if ("Positive".equals(testType)) {
            settingsPage.clickSaveChanges();
            settingsPage.waitForSuccessToastVisible();
            Assert.assertTrue(settingsPage.isSuccessToastVisible(), "[" + tcId + "] Expected success toast");
        } else {
            new WebDriverWait(driver, Duration.ofSeconds(5))
                    .until(d -> settingsPage.isErrorTooltipVisible(placeholder));
            Assert.assertTrue(
                    settingsPage.isErrorTooltipVisible(placeholder),
                    "[" + tcId + "] Expected error tooltip for value: " + value);
            settingsPage.clickSaveChanges();
            Assert.assertTrue(
                    settingsPage.isValidationAlertPresent(),
                    "[" + tcId + "] Expected validation alert for invalid value: " + value);
            settingsPage.dismissValidationAlert();
            Assert.assertFalse(
                    settingsPage.isSuccessToastVisible(),
                    "[" + tcId + "] Expected no success toast for invalid value");
        }
    }

    @Test(dataProvider = "contradictionData")
    public void testContradiction(Object[] row) throws Exception {
        Map<String, String> rd = rowData(row);
        Map<String, String> data = structuredData(rd);
        String tcId = rd.get("tc_id");
        String testType = rd.get("Test Type");
        String placeholder = placeholderFor(data.get("metric"));

        flushAndOpen(rd, data);
        settingsPage.clickAddThreshold(placeholder);
        settingsPage.enterAboveValue(placeholder, data.get("aboveValue"));
        settingsPage.enterBelowValue(placeholder, data.get("belowValue"));

        if ("Positive".equals(testType)) {
            settingsPage.clickSaveChanges();
            settingsPage.waitForSuccessToastVisible();
            Assert.assertTrue(
                    settingsPage.isSuccessToastVisible(),
                    "[" + tcId + "] Expected success toast for valid above/below pair");
        } else {
            new WebDriverWait(driver, Duration.ofSeconds(5))
                    .until(d -> settingsPage.isErrorTooltipVisibleOnBothRows(placeholder));
            Assert.assertTrue(
                    settingsPage.isErrorTooltipVisibleOnBothRows(placeholder),
                    "[" + tcId + "] Expected error tooltips on both rows");
            settingsPage.clickSaveChanges();
            Assert.assertTrue(
                    settingsPage.isValidationAlertPresent(),
                    "[" + tcId + "] Expected validation alert for invalid pair");
            settingsPage.dismissValidationAlert();
            Assert.assertFalse(
                    settingsPage.isSuccessToastVisible(),
                    "[" + tcId + "] Expected no success toast for invalid pair");
        }
    }

    @Test(dataProvider = "saveFlowData")
    public void testSaveFlow(Object[] row) throws Exception {
        Map<String, String> rd = rowData(row);
        Map<String, String> data = structuredData(rd);
        String tcId = rd.get("tc_id");

        flushAndOpen(rd, data);
        settingsPage.enterThresholdValue(TD, data.get("thresholdValue"));
        settingsPage.clickSaveChanges();
        settingsPage.waitForSuccessToastVisible();

        if (data.containsKey("waitSeconds")) {
            Thread.sleep(Long.parseLong(data.get("waitSeconds")) * 1000L);
            Assert.assertFalse(
                    settingsPage.isSuccessToastVisible(),
                    "[" + tcId + "] Expected toast to have disappeared");
        } else {
            Assert.assertTrue(
                    settingsPage.getSuccessToastText().contains("Settings saved successfully!"),
                    "[" + tcId + "] Unexpected toast text");
        }
    }

    @Test(dataProvider = "multiUserData")
    public void testMultiUserIsolation(Object[] row) throws Exception {
        Map<String, String> rd = rowData(row);
        Map<String, String> data = structuredData(rd);
        String tcId = rd.get("tc_id");

        settingsPage.tryRegisterUser(data.get("secondUser_email"), "Jane", "Doe", data.get("secondUser_password"));
        settingsPage.flushSettings();
        loginIfNeeded(data.get("email"), data.get("password"));
        settingsPage.navigateToSettings();
        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(d -> settingsPage.isSaveButtonDisabled());
        settingsPage.enterThresholdValue(TD, data.get("thresholdValue"));
        settingsPage.clickSaveChanges();
        new WebDriverWait(driver, Duration.ofSeconds(15))
                .until(d -> settingsPage.isSaveButtonDisabled());
        Assert.assertTrue(
                settingsPage.isSaveButtonDisabled(),
                "Save button should be disabled after successful save");

        new UserProfilePage(driver).open(baseUrl).waitForLoad().clickLogout();
        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(d -> d.getCurrentUrl().contains("/login"));
        login(data.get("secondUser_email"), data.get("secondUser_password"));
        settingsPage.navigateToSettings();

        Assert.assertEquals(
                settingsPage.getThresholdValue(TD),
                "",
                "[" + tcId + "] User B should not see User A's threshold");
    }

    @Test(dataProvider = "newUserData")
    public void testNewUserEmptyState(Object[] row) throws Exception {
        Map<String, String> rd = rowData(row);
        Map<String, String> data = structuredData(rd);
        String tcId = rd.get("tc_id");

        settingsPage.tryRegisterUser(data.get("email"), "New", "User", data.get("password"));
        settingsPage.clearLocalStorage();
        driver.get(baseUrl + "/login");
        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(d -> d.getCurrentUrl().contains("/login"));
        login(data.get("email"), data.get("password"));
        settingsPage.navigateToSettings();

        for (String ph : ALL_PLACEHOLDERS) {
            Assert.assertEquals(
                    settingsPage.getThresholdValue(ph),
                    "",
                    "[" + tcId + "] Expected empty input for: " + ph);
        }

        settingsPage.deleteUser(data.get("email"));
    }

    @Test(dataProvider = "persistenceData")
    public void testPersistence(Object[] row) throws Exception {
        Map<String, String> rd = rowData(row);
        Map<String, String> data = structuredData(rd);
        String tcId = rd.get("tc_id");
        String name = rd.get("Test Case Name");

        flushAndOpen(rd, data);

        if (name.contains("removing")) {
            settingsPage.enterThresholdValue(TD, data.get("thresholdValue"));
            settingsPage.clickSaveChanges();
            new WebDriverWait(driver, Duration.ofSeconds(15))
                    .until(d -> settingsPage.isSaveButtonDisabled());
            Assert.assertTrue(
                    settingsPage.isSaveButtonDisabled(),
                    "Save button should be disabled after successful save");
            settingsPage.waitForSuccessToastGone();
            settingsPage.clickRemoveThreshold(TD);
            settingsPage.clickSaveChanges();
            new WebDriverWait(driver, Duration.ofSeconds(15))
                    .until(d -> settingsPage.isSaveButtonDisabled());
            Assert.assertTrue(
                    settingsPage.isSaveButtonDisabled(),
                    "Save button should be disabled after successful save");
            settingsPage.clickBackToHome();
            settingsPage.navigateToSettings();
            Assert.assertEquals(
                    settingsPage.getThresholdValue(TD),
                    "",
                    "[" + tcId + "] Expected empty after delete");
        } else if (name.contains("updating")) {
            settingsPage.enterThresholdValue(TD, data.get("initialValue"));
            settingsPage.clickSaveChanges();
            new WebDriverWait(driver, Duration.ofSeconds(15))
                    .until(d -> settingsPage.isSaveButtonDisabled());
            Assert.assertTrue(
                    settingsPage.isSaveButtonDisabled(),
                    "Save button should be disabled after successful save");
            settingsPage.enterThresholdValue(TD, data.get("updatedValue"));
            settingsPage.clickSaveChanges();
            new WebDriverWait(driver, Duration.ofSeconds(15))
                    .until(d -> settingsPage.isSaveButtonDisabled());
            Assert.assertTrue(
                    settingsPage.isSaveButtonDisabled(),
                    "Save button should be disabled after successful save");
            settingsPage.clickBackToHome();
            settingsPage.navigateToSettings();
            Assert.assertEquals(
                    settingsPage.getThresholdValue(TD),
                    data.get("updatedValue"),
                    "[" + tcId + "] Expected updated value to persist");
        } else if (name.contains("reverting")) {
            settingsPage.enterThresholdValue(TD, data.get("savedValue"));
            settingsPage.clickSaveChanges();
            new WebDriverWait(driver, Duration.ofSeconds(15))
                    .until(d -> settingsPage.isSaveButtonDisabled());
            Assert.assertTrue(
                    settingsPage.isSaveButtonDisabled(),
                    "Save button should be disabled after successful save");
            settingsPage.enterThresholdValue(TD, data.get("changedValue"));
            new WebDriverWait(driver, Duration.ofSeconds(5))
                    .until(d -> !settingsPage.isSaveButtonDisabled());
            Assert.assertFalse(settingsPage.isSaveButtonDisabled(), "[" + tcId + "] Expected Save enabled after change");
            settingsPage.enterThresholdValue(TD, data.get("savedValue"));
            new WebDriverWait(driver, Duration.ofSeconds(5))
                    .until(d -> settingsPage.isSaveButtonDisabled());
            Assert.assertTrue(settingsPage.isSaveButtonDisabled(), "[" + tcId + "] Expected Save disabled after revert");
        }
    }

    private void flushAndOpen(Map<String, String> rd, Map<String, String> data) throws Exception {
        settingsPage.flushSettings();
        loginIfNeeded(data.get("email"), data.get("password"));
        settingsPage.navigateToSettings();
        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(d -> settingsPage.isSaveButtonDisabled());
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

    private String placeholderFor(String metric) {
        return switch (metric) {
            case "trafficDensity" -> TD;
            case "averageSpeed" -> AS;
            case "co" -> CO;
            case "ozone" -> OZ;
            case "brightnessLevel" -> BL;
            case "powerConsumption" -> PC;
            default -> throw new IllegalArgumentException("Unknown metric key: " + metric);
        };
    }

    private String placeholderForTcId(String tcId) {
        return switch (tcId) {
            case "TC-SA76" -> TD;
            case "TC-SA77" -> AS;
            case "TC-SA78" -> CO;
            case "TC-SA79" -> OZ;
            case "TC-SA80" -> BL;
            case "TC-SA81" -> PC;
            default -> TD;
        };
    }

    private boolean inRange(Map<String, String> rd, int from, int to) {
        try {
            int num = Integer.parseInt(rd.getOrDefault("tc_id", "").replace("TC-SA", ""));
            return num >= from && num <= to;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    private boolean isSelenium(Map<String, String> rd) {
        return rd.getOrDefault("Test Case Name", "").startsWith("Selenium");
    }
}
