package com.iot.selenium.tests;

import java.util.Arrays;
import java.util.Map;

import com.iot.selenium.config.ConfigReader;
import com.iot.selenium.pages.SensorDashboardPage;

import org.testng.Assert;
import org.testng.annotations.AfterClass;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

public class SensorDashboardTest extends BaseTest {
  private static final String SHEET_NAME = "Sensor Dashboard";

  private boolean driverInitialized = false;
  private String authToken;
  private SensorDashboardPage sensorDashboardPage;
  private ConfigReader configReader;

  @BeforeClass(alwaysRun = true)
  public void seedSensorsBeforeClass() {
    configReader = new ConfigReader();
    authToken = getSharedAuthToken();
    try {
      SensorDashboardPage.generateSensors(authToken);
    } catch (Exception e) {
      throw new IllegalStateException("Failed to seed sensors via API", e);
    }
    super.setUp();
    driverInitialized = true;
    sensorDashboardPage = new SensorDashboardPage(driver);
    restoreAuthenticatedSession();
  }

  @BeforeMethod(alwaysRun = true)
  @Override
  public void setUp() {
    if (!driverInitialized) {
      super.setUp();
      driverInitialized = true;
    }
    if (configReader == null) {
      configReader = new ConfigReader();
    }
    sensorDashboardPage = new SensorDashboardPage(driver);
  }

  @AfterMethod(alwaysRun = true)
  @Override
  public void tearDown() {
    if (driver == null) {
      return;
    }
  }

  @AfterClass(alwaysRun = true)
  public void tearDownClass() {
    driverInitialized = false;
    super.tearDown();
  }

  @Test(priority = 1)
  public void testDataAfterSeed() throws Exception {
    runSeedDataCase("TC-SD01", "traffic");
    runSeedDataCase("TC-SD02", "air");
    runSeedDataCase("TC-SD03", "street");
  }

  @Test(priority = 2, dependsOnMethods = "testDataAfterSeed", enabled = true)
  public void testEmptyState() throws Exception {
    SensorDashboardPage.flushSensors(authToken);
    assertEmptyState("TC-SD07", "traffic", "No traffic readings available.");
    assertEmptyState("TC-SD08", "air", "No air quality readings available.");
    assertEmptyState("TC-SD09", "street", "No street light readings available.");
    SensorDashboardPage.generateSensors(authToken);
  }

  @Test(priority = 3, dependsOnMethods = "testEmptyState", enabled = true)
  public void testRefresh() throws Exception {
    runRefreshCase("TC-SD13", "traffic");
    runRefreshCase("TC-SD14", "air");
    runRefreshCase("TC-SD15", "street");
  }

  @Test(priority = 4, dependsOnMethods = "testRefresh", enabled = true)
  public void testAlertsModal() throws Exception {
    runAlertsModalCase("TC-SD16", "traffic");
    runAlertsModalCase("TC-SD17", "air");
  }

  @Test(priority = 5, dependsOnMethods = "testAlertsModal", enabled = true)
  public void testHistoryDropdown() throws Exception {
    Map<String, String> rd = rowByTcId("TC-SD19");
    Map<String, String> data = structuredData(rd);
    String tcId = rd.get("tc_id");

    // TC-SD19 is traffic-specific; default if not in Excel
    String section = data.get("section");
    if (section == null || section.isBlank()) {
      section = "traffic";
    }
    section = section.trim();

    int minHistoryOptions = Integer.parseInt(data.get("minHistoryOptions"));
    int historyIndex = Integer.parseInt(data.get("historyIndex"));

    sensorDashboardPage.navigateToHome();
    sensorDashboardPage.waitForSectionDataDisplayed(section);
    int optionCount = sensorDashboardPage.getHistoryOptionCount(section);
    if (optionCount < minHistoryOptions) {
      throw new org.testng.SkipException(
        "[" + tcId + "] Need at least " + minHistoryOptions + " history readings; got " + optionCount);
    }
    String before = sensorDashboardPage.getFirstStatValueText(section);
    sensorDashboardPage.selectHistoryByIndex(section, historyIndex);
    String after = sensorDashboardPage.getFirstStatValueText(section);
    Assert.assertFalse(
      before.isBlank(),
      "[" + tcId + "] Expected initial traffic density text before history change");
    Assert.assertFalse(
      after.isBlank(),
      "[" + tcId + "] Expected traffic density text after history selection");
  }

  private void runSeedDataCase(String tcId, String defaultSection) throws Exception {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    String section = data.get("section");
    if (section == null || section.isBlank()) {
      section = defaultSection;
    }
    section = section.trim();
    sensorDashboardPage.navigateToHome();
    sensorDashboardPage.waitForSectionDataDisplayed(section);
    Assert.assertTrue(
      sensorDashboardPage.isSectionDataDisplayed(section),
      "[" + tcId + "] Expected " + section + " data to be visible after seed");
  }

  private void assertEmptyState(String tcId, String defaultSection, String defaultExpectedEmpty) throws Exception {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    sensorDashboardPage.navigateToHome();

    String section = data.get("section");
    if (section == null || section.isBlank()) {
      section = defaultSection;
    }
    section = section.trim();

    String expectedEmpty = data.get("expectedEmpty");
    if (expectedEmpty == null || expectedEmpty.isBlank()) {
      expectedEmpty = defaultExpectedEmpty;
    }
    expectedEmpty = expectedEmpty.trim();

    sensorDashboardPage.waitForEmptyState(section, expectedEmpty);
    Assert.assertTrue(
      sensorDashboardPage.isEmptyStateDisplayed(section, expectedEmpty),
      "[" + tcId + "] Expected empty state message '" + expectedEmpty + "'");
  }

  private void runRefreshCase(String tcId, String defaultSection) throws Exception {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    String section = data.get("section");
    if (section == null || section.isBlank()) {
      section = defaultSection;
    }
    section = section.trim();
    sensorDashboardPage.navigateToHome();
    sensorDashboardPage.waitForSectionDataDisplayed(section);
    sensorDashboardPage.clickRefresh(section);
    sensorDashboardPage.waitForSectionDataDisplayed(section);
    Assert.assertTrue(
      sensorDashboardPage.isSectionDataDisplayed(section),
      "[" + tcId + "] Expected " + section + " data after refresh");
  }

  private void runAlertsModalCase(String tcId, String defaultSection) throws Exception {
    Map<String, String> rd = rowByTcId(tcId);
    Map<String, String> data = structuredData(rd);
    String section = data.get("section");
    if (section == null || section.isBlank()) {
      section = defaultSection;
    }
    section = section.trim();
    sensorDashboardPage.navigateToHome();
    sensorDashboardPage.waitForSectionDataDisplayed(section);
    sensorDashboardPage.clickViewAlerts(section);
    sensorDashboardPage.waitForAlertsModalVisible(section);
    Assert.assertTrue(
      sensorDashboardPage.isAlertsModalVisible(section),
      "[" + tcId + "] Expected alerts modal to open");
    sensorDashboardPage.clickCloseAlerts(section);
    sensorDashboardPage.waitForAlertsModalClosed(section);
    Assert.assertFalse(
      sensorDashboardPage.isAlertsModalVisible(section),
      "[" + tcId + "] Expected alerts modal to close");
  }

  private Map<String, String> rowByTcId(String tcId) {
    return Arrays.stream(rowsForSheet(SHEET_NAME))
      .map(this::rowData)
      .filter(rd -> tcId.equals(rd.get("tc_id")))
      .findFirst()
      .orElseThrow(() -> new IllegalStateException("Row not found for tc_id: " + tcId));
  }
}

/*
package com.iot.selenium.tests;

import java.util.Arrays;
import java.util.Map;

import com.iot.selenium.config.ConfigReader;
import com.iot.selenium.pages.SensorDashboardPage;

import org.testng.Assert;
import org.testng.annotations.AfterClass;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

public class SensorDashboardTest extends BaseTest {
    private static final String SHEET_NAME = "Sensor Dashboard";

    private boolean driverInitialized = false;
    private String authToken;
    private SensorDashboardPage sensorDashboardPage;
    private ConfigReader configReader;

    @BeforeClass(alwaysRun = true)
    public void seedSensorsBeforeClass() {
        configReader = new ConfigReader();
        authToken = getSharedAuthToken();
        try {
            SensorDashboardPage.generateSensors(authToken);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to seed sensors via API", e);
        }
        super.setUp();
        driverInitialized = true;
        sensorDashboardPage = new SensorDashboardPage(driver);
        restoreAuthenticatedSession();
    }

    @BeforeMethod(alwaysRun = true)
    @Override
    public void setUp() {
        if (!driverInitialized) {
            super.setUp();
            driverInitialized = true;
        }
        if (configReader == null) {
            configReader = new ConfigReader();
        }
        sensorDashboardPage = new SensorDashboardPage(driver);
    }

    @AfterMethod(alwaysRun = true)
    @Override
    public void tearDown() {
        if (driver == null) {
            return;
        }
        // Do NOT call super.tearDown() — driver must stay alive across tests
    }

    @AfterClass(alwaysRun = true)
    public void tearDownClass() {
        driverInitialized = false;
        super.tearDown();
    }

    @Test(priority = 1)
    public void testDataAfterSeed() throws Exception {
        runSeedDataCase("TC-SD01");
        runSeedDataCase("TC-SD02");
        runSeedDataCase("TC-SD03");
    }

    // Disabled: DELETE /api/sensors/flush returns 500 — see bug BUG-SD-FLUSH
    @Test(priority = 2, dependsOnMethods = "testDataAfterSeed", enabled = true)
    public void testEmptyState() throws Exception {
        SensorDashboardPage.flushSensors(authToken);
        assertEmptyState("TC-SD07");
        assertEmptyState("TC-SD08");
        assertEmptyState("TC-SD09");
        SensorDashboardPage.generateSensors(authToken);
    }

    // Disabled: DELETE /api/sensors/flush returns 500 — see bug BUG-SD-FLUSH
    @Test(priority = 3, dependsOnMethods = "testEmptyState", enabled = true)
    public void testRefresh() throws Exception {
        runRefreshCase("TC-SD13");
        runRefreshCase("TC-SD14");
        runRefreshCase("TC-SD15");
    }

    // Disabled: DELETE /api/sensors/flush returns 500 — see bug BUG-SD-FLUSH
    @Test(priority = 4, dependsOnMethods = "testRefresh", enabled = true)
    public void testAlertsModal() throws Exception {
        runAlertsModalCase("TC-SD16");
        runAlertsModalCase("TC-SD17");
    }

    // Disabled: DELETE /api/sensors/flush returns 500 — see bug BUG-SD-FLUSH
    @Test(priority = 5, dependsOnMethods = "testAlertsModal", enabled = true)
    public void testHistoryDropdown() throws Exception {
        Map<String, String> rd = rowByTcId("TC-SD19");
        Map<String, String> data = structuredData(rd);
        String tcId = rd.get("tc_id");
        String section = data.get("section");
        int minHistoryOptions = Integer.parseInt(data.get("minHistoryOptions"));
        int historyIndex = Integer.parseInt(data.get("historyIndex"));

        sensorDashboardPage.navigateToHome();
        sensorDashboardPage.waitForSectionDataDisplayed(section);
        int optionCount = sensorDashboardPage.getHistoryOptionCount(section);
        if (optionCount < minHistoryOptions) {
            throw new org.testng.SkipException(
                    "[" + tcId + "] Need at least " + minHistoryOptions + " history readings; got " + optionCount);
        }
        String before = sensorDashboardPage.getFirstStatValueText(section);
        sensorDashboardPage.selectHistoryByIndex(section, historyIndex);
        String after = sensorDashboardPage.getFirstStatValueText(section);
        Assert.assertFalse(
                before.isBlank(),
                "[" + tcId + "] Expected initial traffic density text before history change");
        Assert.assertFalse(
                after.isBlank(),
                "[" + tcId + "] Expected traffic density text after history selection");
    }

    private void runSeedDataCase(String tcId) throws Exception {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        String section = data.get("section");
        sensorDashboardPage.navigateToHome();
        sensorDashboardPage.waitForSectionDataDisplayed(section);
        Assert.assertTrue(
                sensorDashboardPage.isSectionDataDisplayed(section),
                "[" + tcId + "] Expected " + section + " data to be visible after seed");
    }

    private void assertEmptyState(String tcId) throws Exception {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        sensorDashboardPage.navigateToHome();

        String section = data.get("section");
        String expectedEmpty = data.get("expectedEmpty");
        sensorDashboardPage.waitForEmptyState(section, expectedEmpty);
        Assert.assertTrue(
                sensorDashboardPage.isEmptyStateDisplayed(section, expectedEmpty),
                "[" + tcId + "] Expected empty state message '" + expectedEmpty + "'");
    }

    private void assertEmptyState(String tcId) throws Exception {
      Map<String, String> rd = rowByTcId(tcId);
      Map<String, String> data = structuredData(rd);
      sensorDashboardPage.navigateToHome();

      String section = data.get("section");
      if (section == null || section.isBlank()) {
        section = switch (tcId) {
          case "TC-SD07" -> "traffic";
          case "TC-SD08" -> "air";
          case "TC-SD09" -> "street";
          default -> throw new IllegalStateException("Unknown tcId: " + tcId);
        };
      }
      section = section.trim();

      String expectedEmpty = data.get("expectedEmpty");
      if (expectedEmpty == null || expectedEmpty.isBlank()) {
        expectedEmpty = switch (tcId) {
          case "TC-SD07" -> "No traffic readings available.";
          case "TC-SD08" -> "No air quality readings available.";
          case "TC-SD09" -> "No street light readings available.";
          default -> throw new IllegalStateException("Unknown tcId: " + tcId);
        };
      }
      expectedEmpty = expectedEmpty.trim();

      sensorDashboardPage.waitForEmptyState(section, expectedEmpty);
      Assert.assertTrue(
        sensorDashboardPage.isEmptyStateDisplayed(section, expectedEmpty),
        "[" + tcId + "] Expected empty state message '" + expectedEmpty + "'");
    }

    private void runRefreshCase(String tcId) throws Exception {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        String section = data.get("section");
        sensorDashboardPage.navigateToHome();
        sensorDashboardPage.waitForSectionDataDisplayed(section);
        sensorDashboardPage.clickRefresh(section);
        sensorDashboardPage.waitForSectionDataDisplayed(section);
        Assert.assertTrue(
                sensorDashboardPage.isSectionDataDisplayed(section),
                "[" + tcId + "] Expected " + section + " data after refresh");
    }

    private void runAlertsModalCase(String tcId) throws Exception {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        String section = data.get("section");
        sensorDashboardPage.navigateToHome();
        sensorDashboardPage.waitForSectionDataDisplayed(section);
        sensorDashboardPage.clickViewAlerts(section);
        sensorDashboardPage.waitForAlertsModalVisible(section);
        Assert.assertTrue(
                sensorDashboardPage.isAlertsModalVisible(section),
                "[" + tcId + "] Expected alerts modal to open");
        sensorDashboardPage.clickCloseAlerts(section);
        sensorDashboardPage.waitForAlertsModalClosed(section);
        Assert.assertFalse(
                sensorDashboardPage.isAlertsModalVisible(section),
                "[" + tcId + "] Expected alerts modal to close");
    }

    private Map<String, String> rowByTcId(String tcId) {
        return Arrays.stream(rowsForSheet(SHEET_NAME))
                .map(this::rowData)
                .filter(rd -> tcId.equals(rd.get("tc_id")))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Row not found for tc_id: " + tcId));
    }

}

*/
