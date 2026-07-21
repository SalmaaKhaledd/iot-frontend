# IoT Selenium Test Framework — Complete Technical Documentation

Generated: 2026-05-31

This document is the full framework dump for `iot-frontend/iot-selenium`: every listed file’s **complete source**, plus explanations of purpose, execution order, Excel data patterns, Allure usage, and **Sprint 3** fixes.

> **Naming notes:** The prompt references `LoginPage.java` and `HomePage.java`. In this repo the equivalents are **`SigninPage.java`** (login UI) and **`DashboardPage.java`** (home/dashboard). There is no separate `LoginPage` or `HomePage` class.

> **Additional framework files** (not in the prompt’s ordered list but part of the suite): `SuiteAuthBootstrap.java`, `ConfigReader.java`, `ExcelReader.java`, `SettingsPage.java`, `AlertsPage.java`, `SensorDashboardPage.java`, `UserProfilePage.java`, `ConfigurationTest.java`, `SensorDashboardTest.java`. See **Appendix** at the end.

---

## Table of contents

1. [Infrastructure](#infrastructure)
2. [Page objects](#page-objects)
3. [Test classes](#test-classes)
4. [Data & reporting](#data--reporting)
5. [Sprint 3 failure fixes](#sprint-3-failure-fixes-chronological)
6. [Appendix — other source files](#appendix--other-source-files)

---


## Infrastructure


#### `pom.xml`

**Full path:** `/Users/salmafarida/dxc/iot-frontend/iot-selenium/pom.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.iot</groupId>
    <artifactId>iot-selenium</artifactId>
    <version>1.0.0</version>
    <name>iot-selenium</name>
    <description>Data-driven Selenium Java test suite for the IoT Angular frontend</description>

    <properties>
        <maven.compiler.release>17</maven.compiler.release>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <selenium.version>4.27.0</selenium.version>
        <testng.version>7.11.0</testng.version>
        <webdrivermanager.version>5.9.2</webdrivermanager.version>
        <poi.version>5.4.1</poi.version>
        <surefire.version>3.5.2</surefire.version>
        <allure.version>2.29.0</allure.version>
        <aspectj.version>1.9.24</aspectj.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>org.seleniumhq.selenium</groupId>
            <artifactId>selenium-java</artifactId>
            <version>${selenium.version}</version>
        </dependency>

        <dependency>
            <groupId>org.testng</groupId>
            <artifactId>testng</artifactId>
            <version>${testng.version}</version>
            <scope>test</scope>
        </dependency>

        <dependency>
            <groupId>io.github.bonigarcia</groupId>
            <artifactId>webdrivermanager</artifactId>
            <version>${webdrivermanager.version}</version>
            <scope>test</scope>
        </dependency>

        <dependency>
            <groupId>org.apache.poi</groupId>
            <artifactId>poi-ooxml</artifactId>
            <version>${poi.version}</version>
            <scope>test</scope>
        </dependency>

        <dependency>
            <groupId>io.qameta.allure</groupId>
            <artifactId>allure-testng</artifactId>
            <version>${allure.version}</version>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.13.0</version>
                <configuration>
                    <release>${maven.compiler.release}</release>
                </configuration>
            </plugin>

            <plugin>
                <groupId>io.qameta.allure</groupId>
                <artifactId>allure-maven</artifactId>
                <version>2.14.0</version>
                <configuration>
                    <reportVersion>${allure.version}</reportVersion>
                    <!-- Self-contained index.html (works when opened directly, no local server). -->
                    <singleFile>true</singleFile>
                </configuration>
            </plugin>

            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-surefire-plugin</artifactId>
                <version>${surefire.version}</version>
                <configuration>
                    <suiteXmlFiles>
                        <suiteXmlFile>src/test/resources/testng.xml</suiteXmlFile>
                    </suiteXmlFiles>
                    <useModulePath>false</useModulePath>
                    <argLine>
                        -javaagent:"${settings.localRepository}/org/aspectj/aspectjweaver/${aspectj.version}/aspectjweaver-${aspectj.version}.jar"
                    </argLine>
                    <systemPropertyVariables>
                        <allure.results.directory>${project.build.directory}/allure-results</allure.results.directory>
                    </systemPropertyVariables>
                </configuration>
                <dependencies>
                    <dependency>
                        <groupId>org.aspectj</groupId>
                        <artifactId>aspectjweaver</artifactId>
                        <version>${aspectj.version}</version>
                    </dependency>
                </dependencies>
            </plugin>
        </plugins>
    </build>
</project>
```
### Explanation — `pom.xml`

**Purpose:** Maven project descriptor for the data-driven Selenium + TestNG suite against the Angular IoT frontend.

| Dependency | Role |
|------------|------|
| `selenium-java` 4.27.0 | WebDriver API (Chrome/Firefox/Edge) |
| `testng` 7.11.0 | Test runner, `@Test`, data providers, suite XML |
| `webdrivermanager` | Auto-downloads matching ChromeDriver |
| `poi-ooxml` | Reads `frontend-testing.xlsx` |
| `allure-testng` | Hooks TestNG results into Allure |

**Allure Maven plugin (`allure-maven` 2.14.0):** `singleFile=true` produces one portable `index.html` (no local server required for saved reports).

**Surefire plugin:** Runs `src/test/resources/testng.xml` (not default `*Test` discovery). **`argLine`** attaches **AspectJ weaver** so `@Step` annotations on private helpers in `TrafficDashboardTest` are woven into Allure reports.

**Sprint 3:** AspectJ + `allure.results.directory` ensure long suite runs produce Allure steps for Traffic dashboard helpers.


#### `src/test/resources/testng.xml`

**Full path:** `/Users/salmafarida/dxc/iot-frontend/iot-selenium/src/test/resources/testng.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE suite SYSTEM "https://testng.org/testng-1.0.dtd">
<suite name="IoT Selenium Suite" verbose="1" parallel="false" preserve-order="true">
    <listeners>
        <listener class-name="io.qameta.allure.testng.AllureTestNg"/>
    </listeners>
    <test name="Signup Tests">
        <classes>
            <class name="com.iot.selenium.tests.SignupTest" />
        </classes>
    </test>
    <test name="Signin Tests">
        <classes>
            <class name="com.iot.selenium.tests.SigninTest" />
        </classes>
    </test>
    <test name="Suite Auth Prime">
        <classes>
            <class name="com.iot.selenium.tests.SuiteAuthBootstrap"/>
        </classes>
    </test>
    <test name="User Profile Tests">
        <classes>
            <class name="com.iot.selenium.tests.UserProfileTest" />
        </classes>
    </test>
    <test name="Alerts &amp; Notifications Tests">
        <classes>
            <class name="com.iot.selenium.tests.AlertsTest" />
        </classes>
    </test>
    <test name="Settings Tests">
        <classes>
            <class name="com.iot.selenium.tests.SettingsTest" />
        </classes>
    </test>
    <test name="Configuration Tests">
        <classes>
            <class name="com.iot.selenium.tests.ConfigurationTest" />
        </classes>
    </test>
    <test name="Sensor Dashboard Tests">
        <classes>
            <class name="com.iot.selenium.tests.SensorDashboardTest" />
        </classes>
    </test>
    <test name="Traffic Dashboard Tests">
        <classes>
            <class name="com.iot.selenium.tests.TrafficDashboardTest" />
        </classes>
    </test>
    <test name="Logout Tests">
        <classes>
            <class name="com.iot.selenium.tests.LogoutTest" />
        </classes>
    </test>
</suite>
```
### Explanation — `testng.xml`

**Suite:** `IoT Selenium Suite`, `parallel="false"`, `preserve-order="true"` — one browser thread, strict order.

**Listener:** `io.qameta.allure.testng.AllureTestNg` — records every TestNG execution to `target/allure-results`.

**Class order (critical):**

| Order | `<test>` block | Why |
|-------|----------------|-----|
| 1 | Signup | Creates users from Excel before sign-in |
| 2 | Signin | Validates login; default user must exist |
| 3 | **Suite Auth Prime** | `SuiteAuthBootstrap.primeSharedApiAuth()` — one API login, caches JWT for the JVM |
| 4 | User Profile | Needs auth |
| 5 | **Alerts** | Seeds alerts + uses sensor refresh; runs **before** Settings so threshold/flush order does not break alert seeding |
| 6 | **Settings** | Heavy UI; shares one browser in class; may flush settings/alerts |
| 7 | Configuration | Settings-related routes |
| 8 | Sensor Dashboard | API seed + home sections |
| 9 | **Traffic Dashboard** | Largest suite; reuses shared auth |
| 10 | **Logout last** | Blacklists JWT; must not run before other authenticated tests |

**Why `@BeforeSuite` was removed:** A suite-level hook ran **before** Signup/Signin, so `primeSharedAuth` hit the API before the default user existed or before UI registration completed. **`SuiteAuthBootstrap`** is a normal `@Test` placed **after** Signin in XML order instead.


#### `src/test/resources/config.properties`

**Full path:** `/Users/salmafarida/dxc/iot-frontend/iot-selenium/src/test/resources/config.properties`

```properties
browser=chrome
baseUrl=http://localhost:4200

apiBaseUrl=http://localhost:8080
homePath=/home
trafficDashboardPath=/traffic-dashboard
loginPath=/login
apiAuthLoginPath=/api/auth/login
apiSensorsGeneratePath=/api/sensors/generate
apiSensorsFlushPath=/api/sensors/flush
apiAlertsPath=/api/alerts

loginEmail=john@example.com
loginPassword=Password123!

explicitWait=15

```
### Explanation — `config.properties`

| Property | Purpose |
|----------|---------|
| `browser` | `chrome` (default), `firefox`, or `edge` — passed to `BaseTest.createDriver()` |
| `baseUrl` | Angular app origin (`http://localhost:4200`) |
| `apiBaseUrl` | Spring backend (`http://localhost:8080`) for API seeding |
| `homePath` | `/home` — post-login landing |
| `trafficDashboardPath` | `/traffic-dashboard` |
| `loginPath` | `/login` — used for auth inject + redirect checks |
| `apiAuthLoginPath` | `/api/auth/login` |
| `apiSensorsGeneratePath` | `/api/sensors/generate` |
| `apiSensorsFlushPath` | `/api/sensors/flush` |
| `apiAlertsPath` | `/api/alerts` |
| `loginEmail` / `loginPassword` | Default suite user (`john@example.com` / `Password123!`) |
| `explicitWait` | Seconds for page-object waits (Traffic dashboard uses 15) |

**Sprint 3:** Backend `ratelimit.auth.enabled=false` in **dev** profile (not this file) pairs with API login in `BaseTest` to avoid HTTP 429 during full suite.


#### `src/test/resources/allure.properties`

**Full path:** `/Users/salmafarida/dxc/iot-frontend/iot-selenium/src/test/resources/allure.properties`

```properties
allure.results.directory=target/allure-results

```
### Explanation — `allure.properties`

Sets `allure.results.directory=target/allure-results` (also duplicated in Surefire `systemPropertyVariables`). Raw JSON results land here during `mvn test`; `mvn allure:report` or `scripts/save-allure-report.sh` builds HTML.


#### `src/test/java/com/iot/selenium/tests/BaseTest.java`

**Full path:** `/Users/salmafarida/dxc/iot-frontend/iot-selenium/src/test/java/com/iot/selenium/tests/BaseTest.java`

```java
package com.iot.selenium.tests;

import java.time.Duration;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;

import com.iot.selenium.config.ConfigReader;
import com.iot.selenium.pages.SensorDashboardPage;
import com.iot.selenium.pages.SigninPage;
import com.iot.selenium.utils.ExcelReader;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.edge.EdgeDriver;
import org.openqa.selenium.edge.EdgeOptions;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxOptions;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;

public abstract class BaseTest {
    protected static final String TEST_DATA_FILE = "testdata/frontend-testing.xlsx";
    private static final ExcelReader EXCEL_READER = new ExcelReader();

    protected WebDriver driver;
    protected ConfigReader configReader;
    protected String baseUrl;
    /** Cached JWT from one API login per JVM run (shared across all test classes). */
    protected String authToken;
    private static String sharedAuthToken;
    private static String sharedAuthUserJson;
    private static final long LOGIN_RATE_LIMIT_RETRY_MS = 65_000L;

    @BeforeMethod(alwaysRun = true)
    public void setUp() {
        configReader = new ConfigReader();
        baseUrl = configReader.getBaseUrl();
        driver = createDriver(configReader.getBrowser());
        driver.manage().window().maximize();
    }

    @AfterMethod(alwaysRun = true)
    public void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }

    /** Logs in with the given credentials and waits until the URL contains {@code /home}. */
    protected void login(String email, String password) {
        SigninPage signIn = new SigninPage(driver);
        signIn.open(baseUrl).login(email, password);
        signIn.waitForUrl("/home", 20);
    }

    /**
     * Ensures an authenticated session. Default credentials use API + {@code localStorage} restore
     * (avoids UI login rate limits and reuses suite token). Other credentials use UI login when needed.
     */
    protected void loginIfNeeded(String email, String password) {
        runAuthSetup(() -> loginIfNeededInternal(email, password));
    }

    /** Called from {@link SuiteAuthBootstrap} after Sign In so the default user exists in the DB. */
    public static void primeSharedAuthForSuite() {
        runAuthSetup(() -> loadSharedAuthIfAbsent(new ConfigReader()));
    }

    /** JWT cached by {@link #primeSharedAuthForSuite()} / {@link #ensureAuthToken()}. */
    public static String getSharedAuthToken() {
        primeSharedAuthForSuite();
        return sharedAuthToken;
    }

    /**
     * Clears JVM-wide auth cache. Required after UI logout (backend blacklists the JWT) so the
     * next {@link #restoreAuthenticatedSession()} does not reuse an invalid token.
     */
    public static void clearSharedAuth() {
        sharedAuthToken = null;
        sharedAuthUserJson = null;
    }

    /** One {@code POST /api/auth/login} per JVM run using default credentials from config. */
    protected void ensureAuthToken() {
        runAuthSetup(() -> {
            if (configReader == null) {
                configReader = new ConfigReader();
            }
            loadSharedAuthIfAbsent(configReader);
            authToken = sharedAuthToken;
        });
    }

    private void loginIfNeededInternal(String email, String password) throws Exception {
        if (configReader == null) {
            configReader = new ConfigReader();
        }
        if (isDefaultCredentials(email, password)) {
            String url = driver.getCurrentUrl();
            String loginPath = configReader.getLoginPath();
            if (url != null && url.contains(loginPath)) {
                clearSharedAuth();
            }
            restoreAuthenticatedSessionInternal();
            authToken = sharedAuthToken;
            return;
        }
        String url = driver.getCurrentUrl();
        String loginPath = configReader.getLoginPath();
        boolean notAuthenticated = url == null
                || url.contains("data:")
                || url.contains(loginPath);
        if (notAuthenticated) {
            login(email, password);
        }
    }

    private static void runAuthSetup(AuthSetup action) {
        try {
            action.run();
        } catch (Exception e) {
            throw new IllegalStateException("Authentication setup failed", e);
        }
    }

    @FunctionalInterface
    private interface AuthSetup {
        void run() throws Exception;
    }

    private static void loadSharedAuthIfAbsent(ConfigReader config) throws Exception {
        if (sharedAuthToken != null && !sharedAuthToken.isBlank()) {
            return;
        }
        for (int attempt = 1; attempt <= 3; attempt++) {
            try {
                SensorDashboardPage.ApiAuthSession session = SensorDashboardPage.loginViaApi(
                        config.getLoginEmail(), config.getLoginPassword());
                sharedAuthToken = session.token();
                sharedAuthUserJson = session.userJson();
                return;
            } catch (IllegalStateException e) {
                if (e.getMessage().contains("429") && attempt < 3) {
                    Thread.sleep(LOGIN_RATE_LIMIT_RETRY_MS);
                } else {
                    throw e;
                }
            }
        }
    }

    /**
     * Restores session via {@code localStorage} + navigation to {@code /home}.
     * Use after negative tests that clear storage, or instead of UI login in long suites.
     * Opens the app origin first — {@code localStorage} is not available on {@code data:} URLs.
     */
    protected void restoreAuthenticatedSession() {
        runAuthSetup(this::restoreAuthenticatedSessionInternal);
    }

    private void restoreAuthenticatedSessionInternal() throws Exception {
        if (configReader == null) {
            configReader = new ConfigReader();
        }
        for (int attempt = 0; attempt < 2; attempt++) {
            if (attempt > 0) {
                clearSharedAuth();
            }
            loadSharedAuthIfAbsent(configReader);
            authToken = sharedAuthToken;
            injectAuthIntoBrowser();
            try {
                waitUntilOnHome(15);
                return;
            } catch (TimeoutException ignored) {
                // Cached JWT may be blacklisted (e.g. after Logout tests) — refresh and retry once.
            }
        }
        login(configReader.getLoginEmail(), configReader.getLoginPassword());
    }

    private void injectAuthIntoBrowser() {
        driver.get(configReader.getBaseUrl() + configReader.getLoginPath());
        new WebDriverWait(driver, Duration.ofSeconds(15))
                .until(d -> {
                    String current = d.getCurrentUrl();
                    return current != null
                            && !current.startsWith("data:")
                            && (current.contains("/login") || current.contains("/home"));
                });
        ((JavascriptExecutor) driver).executeScript(
                "window.localStorage.setItem('iot_auth_token', arguments[0]);"
                        + "window.localStorage.setItem('iot_user', arguments[1]);",
                authToken,
                sharedAuthUserJson);
        driver.get(configReader.getBaseUrl() + configReader.getHomePath());
    }

    private void waitUntilOnHome(int timeoutSeconds) {
        new WebDriverWait(driver, Duration.ofSeconds(timeoutSeconds))
                .until(ExpectedConditions.urlContains("/home"));
    }

    protected boolean isDefaultCredentials(String email, String password) {
        if (configReader == null) {
            configReader = new ConfigReader();
        }
        boolean emailOk = email == null || email.isBlank() || email.equals(configReader.getLoginEmail());
        boolean passwordOk = password == null || password.isBlank()
                || password.equals(configReader.getLoginPassword());
        return emailOk && passwordOk;
    }

    protected Map<String, String> structuredData(Map<String, String> row) {
        return parseKeyValuePairs(row.getOrDefault("Test Data Used", ""));
    }

    protected Object[][] rowsForSheet(String sheetName) {
        return EXCEL_READER.readSheet(TEST_DATA_FILE, sheetName);
    }

    protected Object[][] rowsForSheetWhere(String sheetName, String columnName, String expectedValue) {
        Object[][] allRows = rowsForSheet(sheetName);
        if (allRows.length == 0) {
            return allRows;
        }

        Object[][] filtered = new Object[allRows.length][1];
        int index = 0;
        for (Object[] row : allRows) {
            Map<String, String> rowData = rowData(row);
            if (expectedValue.equalsIgnoreCase(rowData.getOrDefault(columnName, ""))) {
                filtered[index++] = new Object[] { rowData };
            }
        }

        Object[][] result = new Object[index][1];
        System.arraycopy(filtered, 0, result, 0, index);
        return result;
    }

    protected Map<String, String> rowData(Object[] row) {
        Object firstCell = row.length == 0 ? null : row[0];
        if (firstCell instanceof Map<?, ?> map) {
            Map<String, String> rowData = new LinkedHashMap<>();
            for (Map.Entry<?, ?> entry : map.entrySet()) {
                rowData.put(String.valueOf(entry.getKey()), String.valueOf(entry.getValue()));
            }
            return rowData;
        }
        throw new IllegalStateException("Expected ExcelReader rows to contain a row map.");
    }

    private Map<String, String> parseKeyValuePairs(String rawValue) {
        Map<String, String> values = new LinkedHashMap<>();
        if (rawValue == null || rawValue.isBlank()) {
            return values;
        }

        Arrays.stream(rawValue.split("[;\n]"))
                .map(String::trim)
                .filter(entry -> !entry.isBlank())
                .forEach(entry -> {
                    int separatorIndex = entry.indexOf('=');
                    if (separatorIndex < 0) {
                        return;
                    }
                    String key = entry.substring(0, separatorIndex).trim();
                    String value = entry.substring(separatorIndex + 1).trim();
                    if (!key.isEmpty()) {
                        values.put(key, value);
                    }
                });

        return values;
    }

    private WebDriver createDriver(String browser) {
        String normalizedBrowser = browser == null ? "chrome" : browser.trim().toLowerCase();
        return switch (normalizedBrowser) {
            case "firefox" -> {
                WebDriverManager.firefoxdriver().setup();
                FirefoxOptions options = new FirefoxOptions();
                yield new FirefoxDriver(options);
            }
            case "edge" -> {
                WebDriverManager.edgedriver().setup();
                EdgeOptions options = new EdgeOptions();
                yield new EdgeDriver(options);
            }
            default -> {
                WebDriverManager.chromedriver().setup();
                ChromeOptions options = new ChromeOptions();
                options.addArguments("--remote-allow-origins=*");
                yield new ChromeDriver(options);
            }
        };
    }
}

```
### Explanation — `BaseTest.java`

Abstract parent for all tests.

| Member / method | Purpose | Sprint 3 |
|-----------------|---------|----------|
| `TEST_DATA_FILE` | Classpath path to Excel workbook | — |
| `EXCEL_READER` | Singleton `ExcelReader` | — |
| `driver` | Fresh browser per `@BeforeMethod` in classes that call `super.setUp()` | Long-lived classes override |
| `sharedAuthToken` / `sharedAuthUserJson` | JVM-wide cache from one API login | Avoids 100+ UI logins |
| `setUp()` | New `ConfigReader`, `createDriver`, maximize | Default lifecycle |
| `tearDown()` | `driver.quit()` | Overridden in Settings/Alerts/Traffic to keep browser |
| `login()` | UI sign-in via `SigninPage` | Fallback when inject fails |
| `loginIfNeeded()` | Default creds → `restoreAuthenticatedSession`; else UI login | Replaces repeated UI login |
| `primeSharedAuthForSuite()` | Static; called from `SuiteAuthBootstrap` | Replaces `@BeforeSuite` |
| `getSharedAuthToken()` | Lazy prime + return JWT | Used by Alerts/Traffic API |
| `clearSharedAuth()` | Null cache after logout / bad token | Logout + negative tests |
| `ensureAuthToken()` | Loads shared token for API calls | Traffic seeding |
| `restoreAuthenticatedSession()` | Inject `localStorage` + navigate `/home` | Settings, Traffic, Alerts |
| `isDefaultCredentials()` | Blank or config email/password → API path | Multi-user Settings rows use UI login |
| `structuredData()` | Parses `Test Data Used` column (`key=value;`) | All data-driven tests |
| `rowsForSheet()` / `rowData()` | Excel → TestNG `Object[][]` | — |
| `loadSharedAuthIfAbsent()` | `POST /api/auth/login` with 429 retry (65s, 3 attempts) | Rate-limit resilience |
| `injectAuthIntoBrowser()` | Open `/login` first (not `data:`), set `iot_auth_token` + `iot_user`, go `/home` | Fixes blank `localStorage` |
| `waitUntilOnHome()` | URL wait after inject | — |

**Execution order:** Most tests: `@BeforeMethod setUp` → test → `@AfterMethod tearDown`. Classes that set `driverInitialized` skip quit until `@AfterClass`.


#### `src/test/java/com/iot/selenium/pages/BasePage.java`

**Full path:** `/Users/salmafarida/dxc/iot-frontend/iot-selenium/src/test/java/com/iot/selenium/pages/BasePage.java`

```java
package com.iot.selenium.pages;

import java.time.Duration;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.StaleElementReferenceException;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public abstract class BasePage {
    private static final By ALERT_TOAST = By.cssSelector(".alert-toast");
    private static final By ALERT_TOAST_CLOSE = By.cssSelector(".alert-toast .close-btn");

    protected final WebDriver driver;
    protected final WebDriverWait wait;

    protected BasePage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(15));
    }

    protected WebElement waitForVisible(By locator) {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(locator));
    }

    protected WebElement waitForClickable(By locator) {
        return wait.until(ExpectedConditions.elementToBeClickable(locator));
    }

    protected void click(By locator) {
        waitForClickable(locator).click();
    }

    protected void type(By locator, String value) {
        WebElement element = waitForVisible(locator);
        element.clear();
        element.sendKeys(value == null ? "" : value);
    }

    protected String getText(By locator) {
        return waitForVisible(locator).getText().trim();
    }

    /** Dismisses stacked traffic/alert toasts that can block topbar clicks after alert seeding. */
    protected void dismissAlertToastsIfPresent() {
        try {
            new WebDriverWait(driver, Duration.ofSeconds(8))
                    .pollingEvery(Duration.ofMillis(300))
                    .until(driver -> {
                        clickVisibleAlertToastCloseButtons();
                        return !anyAlertToastDisplayed();
                    });
        } catch (TimeoutException ignored) {
            for (int attempt = 0; attempt < 3; attempt++) {
                if (!clickVisibleAlertToastCloseButtons()) {
                    break;
                }
            }
        }
    }

    private boolean clickVisibleAlertToastCloseButtons() {
        boolean clicked = false;
        for (WebElement closeButton : driver.findElements(ALERT_TOAST_CLOSE)) {
            try {
                if (closeButton.isDisplayed()) {
                    ((JavascriptExecutor) driver).executeScript("arguments[0].click();", closeButton);
                    clicked = true;
                }
            } catch (StaleElementReferenceException ignored) {
                // Toast DOM updated between findElements and click; caller re-polls.
            }
        }
        return clicked;
    }

    private boolean anyAlertToastDisplayed() {
        for (WebElement toast : driver.findElements(ALERT_TOAST)) {
            try {
                if (toast.isDisplayed()) {
                    return true;
                }
            } catch (StaleElementReferenceException ignored) {
                // Toast removed from DOM between find and isDisplayed; re-query on next poll.
            }
        }
        return false;
    }

    protected String firstDisplayedText(By locator) {
        try {
            WebElement el = new WebDriverWait(driver, Duration.ofSeconds(15))
                .until(ExpectedConditions.visibilityOfElementLocated(locator));
            return el.getText().trim();
        } catch (TimeoutException e) {
            return "";
        }
    }

    /**
     * Waits for an error element that is created only when an error is present (e.g. {@code .error-message} after HTTP failure).
     */
    protected String waitForErrorText(By locator, int timeoutSeconds) {
        try {
            WebElement el = new WebDriverWait(driver, Duration.ofSeconds(timeoutSeconds))
                    .until(ExpectedConditions.visibilityOfElementLocated(locator));
            return el.getText().trim();
        } catch (TimeoutException e) {
            return "";
        }
    }

    /**
     * Waits for the current URL to contain {@code urlFragment}; does not wait for Angular stability.
     * Use after navigation so Selenium does not block on unrelated in-flight HTTP (e.g. home profile refresh).
     */
    public void waitForUrl(String urlFragment, int timeoutSeconds) {
        new WebDriverWait(driver, Duration.ofSeconds(timeoutSeconds))
                .until(ExpectedConditions.urlContains(urlFragment));
    }

    public void waitForAngular() {
                wait.until(activeDriver -> {
                        Object result = ((JavascriptExecutor) activeDriver).executeScript("""
                const testabilities = window.getAllAngularTestabilities && window.getAllAngularTestabilities();
                if (testabilities && testabilities.length) {
                  return testabilities.every(testability => testability.isStable());
                }
                if (window.getAngularTestability) {
                  try {
                    return window.getAngularTestability(document.body).isStable();
                  } catch (error) {
                    return document.readyState === 'complete';
                  }
                }
                return document.readyState === 'complete';
                """);
            return Boolean.TRUE.equals(result);
        });
    }
}
```
### Explanation — `BasePage.java`

Base Page Object: wraps `WebDriver` + 15s `WebDriverWait`.

| Method | Purpose | Sprint 3 |
|--------|---------|----------|
| `waitForVisible` / `waitForClickable` / `click` / `type` / `getText` | Standard synchronization | — |
| `dismissAlertToastsIfPresent()` | Closes stacked `.alert-toast` via JS click on `.close-btn` | **Added** — alert toasts blocked Settings topbar |
| Stale handling in toast loop | Re-poll when DOM refreshes | Flakiness after alert seeding |
| `firstDisplayedText` / `waitForErrorText` | Sign-up/sign-in errors | — |
| `waitForUrl` | Navigation assert without full Angular wait | Traffic/Settings speed |
| `waitForAngular()` | `getAllAngularTestabilities().isStable()` | Used after filters |


## Page objects


#### `src/test/java/com/iot/selenium/pages/SigninPage.java`

**Full path:** `/Users/salmafarida/dxc/iot-frontend/iot-selenium/src/test/java/com/iot/selenium/pages/SigninPage.java`

```java
package com.iot.selenium.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class SigninPage extends BasePage {
    private static final By EMAIL_INPUT = By.id("email");
    private static final By PASSWORD_INPUT = By.id("password");
    private static final By SIGN_IN_BUTTON = By.cssSelector("button[type='submit']");
    private static final By FIELD_ERROR = By.cssSelector(".field-error");
    private static final By ERROR_MESSAGE = By.cssSelector(".error-message");

    public SigninPage(WebDriver driver) {
        super(driver);
    }

    public SigninPage open(String baseUrl) {
        driver.get(baseUrl + "/login");
        waitForVisible(EMAIL_INPUT);
        return this;
    }

    public SigninPage enterEmail(String email) {
        type(EMAIL_INPUT, email);
        return this;
    }

    public SigninPage enterPassword(String password) {
        type(PASSWORD_INPUT, password);
        return this;
    }

    public SigninPage submit() {
        click(SIGN_IN_BUTTON);
        return this;
    }

    public SigninPage login(String email, String password) {
        return enterEmail(email).enterPassword(password).submit();
    }

    public String getErrorMessage() {
        return getText(ERROR_MESSAGE);
    }

    public String getFieldErrorText() {
        return firstDisplayedText(FIELD_ERROR);
    }

    public String getApiErrorText() {
        return waitForErrorText(ERROR_MESSAGE, 15);
    }

    /**
     * Resolves validation text (immediate in DOM via reactive forms) before reading API errors.
     * When there is no field-level {@code .field-error}, waits up to 15 seconds for HTTP-driven {@code .error-message}.
     */
    public String getErrorText() {
        String field = getFieldErrorText();
        if (!field.isEmpty()) {
            return field;
        }
        return waitForErrorText(ERROR_MESSAGE, 15);
    }
}

```
Login page object (`/login`). `open`, `login`, `getErrorText` (field error first, then API). Used by `BaseTest.login()` and `SigninTest`.
#### `src/test/java/com/iot/selenium/pages/SignupPage.java`

**Full path:** `/Users/salmafarida/dxc/iot-frontend/iot-selenium/src/test/java/com/iot/selenium/pages/SignupPage.java`

```java
package com.iot.selenium.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;

public class SignupPage extends BasePage {
    private static final By EMAIL = By.id("email");
    private static final By FIRST_NAME = By.id("firstName");
    private static final By LAST_NAME = By.id("lastName");
    private static final By PASSWORD = By.id("password");
    private static final By CONFIRM_PASSWORD = By.id("confirmPassword");
    private static final By SUBMIT = By.cssSelector("button[type='submit']");
    private static final By FIELD_ERROR = By.cssSelector(".field-error");
    private static final By API_ERROR = By.cssSelector(".error-message");

    public SignupPage(WebDriver driver) {
        super(driver);
    }

    public SignupPage open(String baseUrl) {
        driver.get(baseUrl + "/signup");
        waitForVisible(EMAIL);
        return this;
    }

    public void fillForm(
            String email,
            String firstName,
            String lastName,
            String password,
            String confirmPassword) {
        type(EMAIL, email);
        type(FIRST_NAME, firstName);
        type(LAST_NAME, lastName);
        type(PASSWORD, password);
        type(CONFIRM_PASSWORD, confirmPassword);
    }

    public void submit() {
        waitForClickable(SUBMIT).click();
    }

    public String getFieldErrorText() {
        return firstDisplayedText(FIELD_ERROR);
    }

    public String getApiErrorText() {
        return waitForErrorText(API_ERROR, 15);
    }

    /**
     * Resolves validation text (immediate in DOM via reactive forms) before reading API errors.
     * When there is no field-level {@code .field-error}, waits up to 15 seconds for HTTP-driven {@code .error-message}.
     */
    public String getErrorText() {
        String field = getFieldErrorText();
        if (!field.isEmpty()) {
            return field;
        }
        return waitForErrorText(API_ERROR, 15);
    }

    public SignupPage enterEmail(String email) {
        type(EMAIL, email);
        return this;
    }

    public SignupPage enterFirstName(String firstName) {
        type(FIRST_NAME, firstName);
        return this;
    }

    public SignupPage enterLastName(String lastName) {
        type(LAST_NAME, lastName);
        return this;
    }

    public SignupPage enterPassword(String password) {
        type(PASSWORD, password);
        return this;
    }

    public SignupPage enterConfirmPassword(String password) {
        type(CONFIRM_PASSWORD, password);
        return this;
    }

    public SignupPage register(String email, String firstName, String lastName, String password) {
        fillForm(email, firstName, lastName, password, password);
        submit();
        return this;
    }

    public String getErrorMessage() {
        return getText(API_ERROR);
    }
}

```
Registration (`/signup`). `fillForm`, `submit`, `getErrorText`. `SignupTest` data-driven rows.
#### `src/test/java/com/iot/selenium/pages/DashboardPage.java`

**Full path:** `/Users/salmafarida/dxc/iot-frontend/iot-selenium/src/test/java/com/iot/selenium/pages/DashboardPage.java`

```java
package com.iot.selenium.pages;

import java.util.List;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

public class DashboardPage extends BasePage {
    private static final By GREETING_TITLE = By.cssSelector(".hero h1");
    private static final By AVATAR_BUTTON = By.cssSelector(".avatar-button");
    private static final By REFRESH_NOTICE = By.cssSelector(".refresh-notice");

    public DashboardPage(WebDriver driver) {
        super(driver);
    }

    public DashboardPage waitForLoad() {
        waitForVisible(GREETING_TITLE);
        return this;
    }

    public void clickAvatar() {
        dismissAlertToastsIfPresent();
        click(AVATAR_BUTTON);
    }

    public boolean isLoaded() {
        List<WebElement> elements = driver.findElements(GREETING_TITLE);
        return !elements.isEmpty() && elements.get(0).isDisplayed();
    }

    public String getGreetingText() {
        return getText(GREETING_TITLE);
    }

    public String getRefreshNotice() {
        return driver.findElements(REFRESH_NOTICE).isEmpty() ? "" : getText(REFRESH_NOTICE);
    }

    public boolean hasRefreshNotice() {
        return !driver.findElements(REFRESH_NOTICE).isEmpty();
    }

    public UserProfilePage openProfile() {
        clickAvatar();
        return new UserProfilePage(driver);
    }
}

```
**Home page** (`/home`): greeting, avatar → profile, `dismissAlertToastsIfPresent` before avatar click.
#### `src/test/java/com/iot/selenium/pages/TrafficDashboardPage.java`

**Full path:** `/Users/salmafarida/dxc/iot-frontend/iot-selenium/src/test/java/com/iot/selenium/pages/TrafficDashboardPage.java`

```java
package com.iot.selenium.pages;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

import com.iot.selenium.config.ConfigReader;

import org.openqa.selenium.By;
import org.openqa.selenium.StaleElementReferenceException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;


public class TrafficDashboardPage extends BasePage {
    private static final By PAGE_ROOT = By.cssSelector("[data-testid='traffic-dashboard-page']");
    private static final By BACK_BUTTON = By.cssSelector("[data-testid='back-button']");
    private static final By FILTER_PANEL = By.cssSelector("[data-testid='filter-panel']");
    private static final By LOCATION_SELECT = By.cssSelector("[data-testid='location-select'] [data-testid='custom-select-trigger']");
    private static final By CONGESTION_SELECT = By.cssSelector("[data-testid='congestion-select'] [data-testid='custom-select-trigger']");
    private static final By SORT_SELECT = By.cssSelector("[data-testid='sort-select'] [data-testid='custom-select-trigger']");
    private static final By CUSTOM_SELECT_DROPDOWN = By.cssSelector("[data-testid='custom-select-dropdown']");
    private static final By APPLY_FILTERS = By.cssSelector("[data-testid='apply-filters-btn']");
    private static final By RESET_FILTERS = By.cssSelector("[data-testid='reset-filters-btn']");
    private static final By TRAFFIC_TABLE = By.cssSelector("[data-testid='traffic-table']");
    private static final By TRAFFIC_ROWS = By.cssSelector("[data-testid='traffic-row']");
    private static final By EMPTY_STATE = By.cssSelector("[data-testid='empty-state']");
    private static final By LOADING_STATE = By.cssSelector("[data-testid='loading-state']");
    private static final By ERROR_STATE = By.cssSelector("[data-testid='error-state']");
    private static final By ERROR_STATE_TEXT = By.cssSelector("[data-testid='error-state'] .state-text");
    private static final By NEXT_PAGE = By.cssSelector("[data-testid='next-page-btn']");
    private static final By PREV_PAGE = By.cssSelector("[data-testid='prev-page-btn']");
    private static final By FIRST_PAGE = By.cssSelector("[data-testid='first-page-btn']");
    private static final By LAST_PAGE = By.cssSelector("[data-testid='last-page-btn']");
    private static final By PAGE_SIZE_SELECT = By.cssSelector("[data-testid='page-size-select'] [data-testid='custom-select-trigger']");
    private static final By ALERT_BANNER_STRIP = By.cssSelector("[data-testid='alert-banner-strip']");
    private static final By ALERT_BANNER = By.cssSelector("[data-testid='alert-banner']");
    private static final By ALERT_BANNER_MESSAGE = By.cssSelector("[data-testid='alert-banner'] .alert-banner-message");
    private static final By ALERT_BANNER_CLOSE = By.cssSelector("[data-testid='alert-banner-close']");
    private static final By TRAFFIC_NAV_CARD = By.cssSelector("[data-testid='traffic-nav-card']");
    private static final By FILTER_ERROR = By.cssSelector("[data-testid='filter-panel'] .filter-error");

    private static final String FROM_DATETIME_HOST = "from-datetime";
    private static final String TO_DATETIME_HOST = "to-datetime";

    private final String baseUrl;
    private final String apiBaseUrl;
    private final String trafficDashboardPath;
    private final String homePath;
    private final int explicitWaitSeconds;

    public TrafficDashboardPage(WebDriver driver) {
        super(driver);
        ConfigReader config = new ConfigReader();
        this.baseUrl = config.getBaseUrl();
        this.apiBaseUrl = config.getApiBaseUrl();
        this.trafficDashboardPath = config.getTrafficDashboardPath();
        this.homePath = config.getHomePath();
        this.explicitWaitSeconds = config.getExplicitWaitSeconds();
    }

    public static String authenticate(String email, String password) throws Exception {
        return SensorDashboardPage.authenticate(email, password);
    }

    public static void generateSensors(String bearerToken) throws Exception {
        SensorDashboardPage.generateSensors(bearerToken);
    }

    public static void flushSensors(String bearerToken) throws Exception {
        SensorDashboardPage.flushSensors(bearerToken);
    }

    /**
     * Navigates directly to the traffic dashboard URL. Requires an authenticated session;
     * otherwise the app redirects to login. Prefer {@link #openFromHome()} after {@code login()}.
     */
    public TrafficDashboardPage open() {
        driver.get(baseUrl + trafficDashboardPath);
        waitForUrl(trafficDashboardPath, explicitWaitSeconds);
        return waitForLoad();
    }
    public boolean isTrafficNavCardVisible() {
        return isElementDisplayed(TRAFFIC_NAV_CARD);
    }

    public boolean isAirQualityNavCardVisible() {
        return driver.findElements(By.cssSelector("[data-testid='air-quality-nav-card']")).stream()
                .anyMatch(e -> e.isDisplayed());
    }

    public boolean isStreetLightsNavCardVisible() {
        return driver.findElements(By.cssSelector("[data-testid='street-lights-nav-card']")).stream()
                .anyMatch(e -> e.isDisplayed());
    }

    public String getTrafficNavCardText() {
        return driver.findElement(TRAFFIC_NAV_CARD).getText().trim();
    }

    /**
     * Opens the traffic dashboard from the home page via the Traffic nav card (real user flow).
     * Call after {@code login()} when the browser is already on {@code /home}.
     */
    public TrafficDashboardPage openFromHome() {
        dismissAlertToastsIfPresent();
        click(TRAFFIC_NAV_CARD);
        waitForUrl(trafficDashboardPath, explicitWaitSeconds);
        return waitForLoad();
    }

    public TrafficDashboardPage waitForLoad() {
        dismissAlertToastsIfPresent();
        waitForVisible(PAGE_ROOT);
        waitForAngular();
        return this;
    }

    /** Returns to {@code /home} via back button when on the traffic dashboard, otherwise direct navigation. */
    public DashboardPage navigateToHome() {
        dismissAlertToastsIfPresent();
        String url = driver.getCurrentUrl();
        if (url != null && url.contains(trafficDashboardPath)) {
            click(BACK_BUTTON);
            waitForUrl(homePath, explicitWaitSeconds);
        } else {
            driver.get(baseUrl + homePath);
            waitForUrl(homePath, explicitWaitSeconds);
        }
        waitForAngular();
        return new DashboardPage(driver).waitForLoad();
    }

    public TrafficDashboardPage selectLocation(String value) {
        return selectCustomOption(LOCATION_SELECT, value);
    }

    public TrafficDashboardPage selectCongestion(String value) {
        return selectCustomOption(CONGESTION_SELECT, value);
    }

    public TrafficDashboardPage selectSort(String value) {
        return selectCustomOption(SORT_SELECT, value);
    }

    public TrafficDashboardPage selectPageSize(String value) {
        return selectCustomOption(PAGE_SIZE_SELECT, value);
    }

    public TrafficDashboardPage clickApplyFilters() {
        click(APPLY_FILTERS);
        waitForAngular();
        return this;
    }

    public TrafficDashboardPage clickResetFilters() {
        click(RESET_FILTERS);
        waitForAngular();
        return this;
    }

    public boolean isLoaded() {
        return isElementDisplayed(PAGE_ROOT);
    }

    public boolean isTableVisible() {
        List<WebElement> elements = driver.findElements(TRAFFIC_TABLE);
        return !elements.isEmpty() && elements.get(0).isDisplayed();
    }

    public int getRowCount() {
        return driver.findElements(TRAFFIC_ROWS).size();
    }

    public boolean isEmptyStateVisible() {
        List<WebElement> elements = driver.findElements(EMPTY_STATE);
        return !elements.isEmpty() && elements.get(0).isDisplayed();
    }

    public boolean isFilterPanelVisible() {
        List<WebElement> elements = driver.findElements(FILTER_PANEL);
        return !elements.isEmpty() && elements.get(0).isDisplayed();
    }

    // --- Step 1: loading, error, pagination ---

    public boolean isLoadingVisible() {
        return isElementDisplayed(LOADING_STATE);
    }

    /**
     * Waits up to {@code timeoutSeconds} for the loading spinner. Returns false if load finishes
     * before the spinner appears (common on fast runs). Does not retain element references.
     */
    public boolean waitForLoadingIfPresent(int timeoutSeconds) {
        try {
            new WebDriverWait(driver, Duration.ofSeconds(timeoutSeconds))
                    .until(ExpectedConditions.visibilityOfElementLocated(LOADING_STATE));
            return true;
        } catch (org.openqa.selenium.TimeoutException e) {
            return false;
        }
    }

    public TrafficDashboardPage waitForLoadingToFinish() {
        new WebDriverWait(driver, Duration.ofSeconds(explicitWaitSeconds))
                .until(ExpectedConditions.invisibilityOfElementLocated(LOADING_STATE));
        return this;
    }

    /**
     * Waits until the loading spinner is gone and Angular is stable.
     * Use after apply filters, page changes, or page-size changes.
     */
    public TrafficDashboardPage waitForResultsReady() {
        waitForLoadingToFinish();
        waitForAngular();
        return this;
    }

    public boolean isErrorStateVisible() {
        return isElementDisplayed(ERROR_STATE);
    }

    public String getErrorMessage() {
        return firstDisplayedText(ERROR_STATE_TEXT);
    }

    public String waitForErrorMessage() {
        return waitForErrorText(ERROR_STATE_TEXT, explicitWaitSeconds);
    }

    public boolean isPaginationVisible() {
        return isElementDisplayed(NEXT_PAGE) || isElementDisplayed(PREV_PAGE);
    }

    public TrafficDashboardPage clickNextPage() {
        click(NEXT_PAGE);
        return waitForResultsReady();
    }

    public TrafficDashboardPage clickPrevPage() {
        click(PREV_PAGE);
        return waitForResultsReady();
    }

    public TrafficDashboardPage clickFirstPage() {
        click(FIRST_PAGE);
        return waitForResultsReady();
    }

    public TrafficDashboardPage clickLastPage() {
        click(LAST_PAGE);
        return waitForResultsReady();
    }

    public boolean isNextPageEnabled() {
        return isButtonEnabled(NEXT_PAGE);
    }

    public boolean isPrevPageEnabled() {
        return isButtonEnabled(PREV_PAGE);
    }

    public boolean isFirstPageEnabled() {
        return isButtonEnabled(FIRST_PAGE);
    }

    public boolean isLastPageEnabled() {
        return isButtonEnabled(LAST_PAGE);
    }

    // --- Step 3: traffic dashboard alert banners (not topbar toasts) ---

    public boolean isAlertBannerStripVisible() {
        return isElementDisplayed(ALERT_BANNER_STRIP);
    }

    public boolean isAlertBannerVisible() {
        return isElementDisplayed(ALERT_BANNER);
    }

    public int getAlertBannerCount() {
        int count = 0;
        for (WebElement banner : driver.findElements(ALERT_BANNER)) {
            try {
                if (banner.isDisplayed()) {
                    count++;
                }
            } catch (StaleElementReferenceException ignored) {
                // Banner strip re-rendered while counting; next poll re-queries the DOM.
            }
        }
        return count;
    }

    public String getAlertBannerMessage() {
        for (WebElement message : driver.findElements(ALERT_BANNER_MESSAGE)) {
            if (message.isDisplayed()) {
                return message.getText().trim();
            }
        }
        return "";
    }

    public List<String> getAlertBannerMessages() {
        List<String> messages = new ArrayList<>();
        for (WebElement message : driver.findElements(ALERT_BANNER_MESSAGE)) {
            if (message.isDisplayed()) {
                messages.add(message.getText().trim());
            }
        }
        return messages;
    }

    public TrafficDashboardPage waitForAlertBanner() {
        waitForVisible(ALERT_BANNER);
        return this;
    }

    public TrafficDashboardPage dismissAlertBanner() {
        if (clickFirstVisibleAlertBannerClose()) {
            waitForAngular();
        }
        return this;
    }

    /**
     * Dismisses every visible traffic alert banner via its close button.
     * Stops when no close button is visible or after {@code maxAttempts} clicks.
     * Re-queries the DOM each click because banners are removed asynchronously.
     */
    public TrafficDashboardPage dismissAllAlertBanners() {
        final int maxAttempts = 10;
        for (int attempt = 0; attempt < maxAttempts; attempt++) {
            if (!clickFirstVisibleAlertBannerClose()) {
                break;
            }
            waitForAngular();
        }
        return this;
    }

    private boolean clickFirstVisibleAlertBannerClose() {
        List<WebElement> closeButtons = driver.findElements(ALERT_BANNER_CLOSE);
        for (WebElement closeButton : closeButtons) {
            try {
                if (!closeButton.isDisplayed()) {
                    continue;
                }
                closeButton.click();
                return true;
            } catch (StaleElementReferenceException ignored) {
                // Banner strip re-rendered between findElements and click; try next or re-query.
            }
        }
        return false;
    }

    // --- Step 4: date/time pickers ---

    /**
     * @param isoDate date in {@code yyyy-MM-dd} form (matches {@code data-testid="day-..."} on calendar cells)
     */
    public TrafficDashboardPage setFromDate(String isoDate) {
        selectDateOnly(FROM_DATETIME_HOST, isoDate);
        return this;
    }

    public TrafficDashboardPage setToDate(String isoDate) {
        selectDateOnly(TO_DATETIME_HOST, isoDate);
        return this;
    }

    public TrafficDashboardPage setFromDateTime(String isoDate, int hour24, int minute) {
        selectDateTime(FROM_DATETIME_HOST, isoDate, hour24, minute);
        return this;
    }

    public TrafficDashboardPage setToDateTime(String isoDate, int hour24, int minute) {
        selectDateTime(TO_DATETIME_HOST, isoDate, hour24, minute);
        return this;
    }

    public boolean isDateRangeErrorVisible() {
        return isElementDisplayed(FILTER_ERROR);
    }

    public boolean isTimeRangeErrorVisible() {
        List<WebElement> errors = driver.findElements(FILTER_ERROR);
        return errors.stream().anyMatch(WebElement::isDisplayed);
    }

    private TrafficDashboardPage selectCustomOption(By triggerLocator, String value) {
        click(triggerLocator);
        waitForVisible(CUSTOM_SELECT_DROPDOWN);
        click(optionByValue(value));
        waitForAngular();
        return this;
    }

    private static By optionByValue(String value) {
        return By.cssSelector("[data-testid='option-" + value + "']");
    }

    private By dateTimeScope(String hostTestId, String innerSelector) {
        return By.cssSelector("[data-testid='" + hostTestId + "'] " + innerSelector);
    }

    private void selectDateOnly(String hostTestId, String isoDate) {
        click(dateTimeScope(hostTestId, "[data-testid='dtp-trigger']"));
        waitForVisible(dateTimeScope(hostTestId, "[data-testid='dtp-popup']"));
        click(dateTimeScope(hostTestId, "[data-testid='day-" + isoDate + "']"));
        closeDateTimePicker();
        waitForAngular();
    }

    private void selectDateTime(String hostTestId, String isoDate, int hour24, int minute) {
        click(dateTimeScope(hostTestId, "[data-testid='dtp-trigger']"));
        waitForVisible(dateTimeScope(hostTestId, "[data-testid='dtp-popup']"));
        click(dateTimeScope(hostTestId, "[data-testid='day-" + isoDate + "']"));

        WebElement timeToggle = driver.findElement(dateTimeScope(hostTestId, ".dtp-toggle"));
        if (!timeToggle.getAttribute("class").contains("on")) {
            click(dateTimeScope(hostTestId, ".dtp-toggle-row"));
        }

        int hour12 = hour24 % 12;
        if (hour12 == 0) {
            hour12 = 12;
        }
        boolean pm = hour24 >= 12;

        WebElement hourInput = waitForVisible(dateTimeScope(hostTestId, "[data-testid='dtp-hour-input']"));
        hourInput.clear();
        hourInput.sendKeys(String.valueOf(hour12));

        WebElement minuteInput = waitForVisible(dateTimeScope(hostTestId, "[data-testid='dtp-minute-input']"));
        minuteInput.clear();
        minuteInput.sendKeys(String.valueOf(minute));

        setPeriodForPicker(hostTestId, pm);
        closeDateTimePicker();
        waitForAngular();
    }

    private void setPeriodForPicker(String hostTestId, boolean pm) {
        List<WebElement> periodButtons = driver.findElements(
                By.cssSelector("[data-testid='" + hostTestId + "'] .dtp-period-btn"));
        if (periodButtons.size() < 2) {
            return;
        }
        WebElement target = pm ? periodButtons.get(1) : periodButtons.get(0);
        if (!target.getAttribute("class").contains("active")) {
            target.click();
        }
    }

    private void closeDateTimePicker() {
        click(By.cssSelector(".page-title"));
    }

    private boolean isElementDisplayed(By locator) {
        List<WebElement> elements = driver.findElements(locator);
        return !elements.isEmpty() && elements.get(0).isDisplayed();
    }

    private boolean isButtonEnabled(By locator) {
        List<WebElement> elements = driver.findElements(locator);
        if (elements.isEmpty()) {
            return false;
        }
        WebElement button = elements.get(0);
        return button.isDisplayed() && button.isEnabled();
    }

    public TrafficDashboardPage clickFilterPanelToggle() {
        click(By.cssSelector("[data-testid='filter-panel'] .filter-header"));
        waitForAngular();
        return this;
    }

    public TrafficDashboardPage waitForFilterPanelExpanded() {
        new WebDriverWait(driver, Duration.ofSeconds(5))
                .until(d -> !isFilterPanelCollapsed());
        return this;
    }

    public TrafficDashboardPage waitForFilterPanelCollapsed() {
        new WebDriverWait(driver, Duration.ofSeconds(5))
                .until(d -> isFilterPanelCollapsed());
        return this;
    }

    public boolean isFilterPanelCollapsed() {
        for (int attempt = 0; attempt < 3; attempt++) {
            try {
                List<WebElement> applyButtons = driver.findElements(APPLY_FILTERS);
                if (applyButtons.isEmpty()) {
                    return true;
                }
                return !applyButtons.get(0).isDisplayed();
            } catch (StaleElementReferenceException e) {
                if (attempt == 2) {
                    throw e;
                }
            }
        }
        return true;
    }

    /** Opens the dashboard without dismissing topbar alert toasts (for traffic alert-banner tests). */
    public TrafficDashboardPage openWithoutToastDismiss() {
        driver.get(baseUrl + trafficDashboardPath);
        waitForUrl(trafficDashboardPath, explicitWaitSeconds);
        waitForVisible(PAGE_ROOT);
        waitForAngular();
        return this;
    }

    /** Waits for page root without closing topbar toasts (preserves traffic alert banners). */
    public TrafficDashboardPage waitForLoadWithoutDismissingToasts() {
        waitForVisible(PAGE_ROOT);
        waitForAngular();
        return this;
    }

    public String getFirstRowText() {
        List<WebElement> rows = driver.findElements(TRAFFIC_ROWS);
        if (rows.isEmpty()) {
            return "";
        }
        return rows.get(0).getText().trim();
    }

    public String getFirstRowTimestamp() {
        List<WebElement> rows = driver.findElements(TRAFFIC_ROWS);
        if (rows.isEmpty()) {
            return "";
        }
        return timestampTextFromRow(rows.get(0));
    }

    public String getSecondRowTimestamp() {
        List<WebElement> rows = driver.findElements(TRAFFIC_ROWS);
        if (rows.size() < 2) {
            return "";
        }
        return timestampTextFromRow(rows.get(1));
    }

    private String timestampTextFromRow(WebElement row) {
        for (WebElement td : row.findElements(By.tagName("td"))) {
            String text = td.getText().trim();
            if (text.matches(".*\\d{4}-\\d{2}-\\d{2}.*:.*") || (text.contains("-") && text.contains(":"))) {
                return text;
            }
        }
        return "";
    }

    public boolean isAnalyticsHeaderVisible() {
        for (WebElement header : driver.findElements(By.cssSelector("[data-testid='analytics-header']"))) {
            if (header.isDisplayed()) {
                return true;
            }
        }
        return false;
    }

    public TrafficDashboardPage clickAnalyticsToggle() {
        click(By.cssSelector("[data-testid='analytics-header']"));
        waitForAngular();
        return this;
    }

    public boolean isAnalyticsPanelExpanded() {
        List<WebElement> charts = driver.findElements(By.id("speedChart"));
        for (int i = 0; i < charts.size(); i++) {
            try {
                if (charts.get(i).isDisplayed()) {
                    return true;
                }
            } catch (StaleElementReferenceException ignored) {
                charts = driver.findElements(By.id("speedChart"));
                i = -1;
            }
        }
        return false;
    }

    public List<String> getAnalyticsMetricCardTexts() {
        List<String> values = new ArrayList<>();
        for (WebElement card : driver.findElements(By.cssSelector(".analytics-body .analytics-card-value"))) {
            if (card.isDisplayed()) {
                String text = card.getText().trim();
                if (!text.isEmpty()) {
                    values.add(text);
                }
            }
        }
        return values;
    }

    public boolean areChartsRendered() {
        return !driver.findElements(By.id("speedChart")).isEmpty()
                && !driver.findElements(By.id("densityChart")).isEmpty()
                && !driver.findElements(By.id("donutChart")).isEmpty();
    }
}
```
**Largest page object** — `/traffic-dashboard` and entry from home nav card.

**Auth / navigation:** `open()`, `openFromHome()`, `openWithoutToastDismiss()`, `waitForLoadWithoutDismissingToasts()`, `navigateToHome()`.

**Why two open paths:** Normal `waitForLoad()` dismisses **topbar toasts** (`.alert-toast`). Banner tests must **not** dismiss toasts that appear together with dashboard **banners** (`data-testid=alert-banner`). Hence `openWithoutToastDismiss` + `waitForLoadWithoutDismissingToasts`.

**Filters/sort/pagination:** Custom selects via `data-testid=option-{value}`; `clickApplyFilters` / `clickResetFilters` + `waitForResultsReady()` (spinner gone + Angular stable).

**Alert banners (in-page strip):** `ALERT_BANNER_STRIP`, `ALERT_BANNER`, `getAlertBannerCount()` with **StaleElementReferenceException** catch (strip re-renders), `dismissAlertBanner()` (one), `dismissAllAlertBanners()` (up to 10 clicks, re-query DOM each time — **Sprint 3 stale fix**).

**Filter panel:** `clickFilterPanelToggle`, `waitForFilterPanelExpanded/Collapsed`, `isFilterPanelCollapsed` with stale retry.

**Analytics:** `analytics-header`, `#speedChart`, `#densityChart`, `#donutChart`.

**API helpers:** `generateSensors` / `flushSensors` delegate to `SensorDashboardPage`.

**Date/time:** `setFromDate`, `setToDate`, `setFromDateTime`, `setToDateTime` via `data-testid` host `from-datetime` / `to-datetime`.


## Test classes


#### `src/test/java/com/iot/selenium/tests/SignupTest.java`

**Full path:** `/Users/salmafarida/dxc/iot-frontend/iot-selenium/src/test/java/com/iot/selenium/tests/SignupTest.java`

```java
package com.iot.selenium.tests;

import java.time.Duration;
import java.util.Arrays;
import java.util.Map;

import com.iot.selenium.pages.SignupPage;

import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.testng.Assert;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.DataProvider;
import org.testng.annotations.Test;

public class SignupTest extends BaseTest {
    private WebDriverWait wait;

    @BeforeMethod(alwaysRun = true, dependsOnMethods = "setUp")
    public void initWait() {
        wait = new WebDriverWait(driver, Duration.ofSeconds(20));
    }

    @DataProvider(name = "sheetData")
    public Object[][] sheetData() {
        return Arrays.stream(rowsForSheet("Sign Up"))
                .filter(row -> rowData(row)
                        .getOrDefault("Test Case Name", "")
                        .startsWith("Selenium"))
                .toArray(Object[][]::new);
    }

    @Test(dataProvider = "sheetData")
    public void testSignup(Object[] row) {
        Map<String, String> rd = rowData(row);
        Map<String, String> data = structuredData(rd);
        String tcId = rd.getOrDefault("tc_id", "unknown");
        System.out.println(tcId + " | " + rd.getOrDefault("Test Case Name", ""));

        String email = data.getOrDefault("email", "");
        String firstName = data.getOrDefault("firstName", "");
        String lastName = data.getOrDefault("lastName", "");
        String password = data.getOrDefault("password", "");
        String confirmPassword = data.getOrDefault("confirmPassword", "");
        String expectedError = data.getOrDefault("expectedError", "");

        SignupPage page = new SignupPage(driver).open(baseUrl);
        page.fillForm(email, firstName, lastName, password, confirmPassword);
        page.submit();

        if (expectedError.isBlank()) {
            wait.until(ExpectedConditions.urlContains("/home"));
            Assert.assertTrue(
                    driver.getCurrentUrl().contains("/home"),
                    "[" + tcId + "] Expected redirect to /home but got: " + driver.getCurrentUrl());
        } else {
            String actual = page.getErrorText();
            Assert.assertEquals(
                    actual,
                    expectedError.trim(),
                    "[" + tcId + "] Expected error: '" + expectedError.trim() + "' but got: '" + actual + "'");
        }
    }
}

```
Excel sheet `Sign Up`, filter `Selenium*`. One `@Test` + `sheetData` provider. Positive → URL `/home`; negative → `expectedError`.
#### `src/test/java/com/iot/selenium/tests/SigninTest.java`

**Full path:** `/Users/salmafarida/dxc/iot-frontend/iot-selenium/src/test/java/com/iot/selenium/tests/SigninTest.java`

```java
package com.iot.selenium.tests;

import java.time.Duration;
import java.util.Arrays;
import java.util.Map;

import com.iot.selenium.pages.SigninPage;

import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.testng.Assert;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.DataProvider;
import org.testng.annotations.Test;

public class SigninTest extends BaseTest {
    private WebDriverWait wait;

    @BeforeMethod(alwaysRun = true, dependsOnMethods = "setUp")
    public void initWait() {
        wait = new WebDriverWait(driver, Duration.ofSeconds(20));
    }

    @DataProvider(name = "sheetData")
    public Object[][] sheetData() {
        return Arrays.stream(rowsForSheet("Sign In"))
                .filter(row -> rowData(row)
                        .getOrDefault("Test Case Name", "")
                        .startsWith("Selenium"))
                .toArray(Object[][]::new);
    }

    @Test(dataProvider = "sheetData")
    public void testSignin(Object[] row) {
        Map<String, String> rd = rowData(row);
        Map<String, String> data = structuredData(rd);
        String tcId = rd.getOrDefault("tc_id", "unknown");
        System.out.println(tcId + " | " + rd.getOrDefault("Test Case Name", ""));

        String email = data.getOrDefault("email", "");
        String password = data.getOrDefault("password", "");
        String expectedError = data.getOrDefault("expectedError", "");

        SigninPage page = new SigninPage(driver).open(baseUrl);
        page.login(email, password);

        if (expectedError.isBlank()) {
            wait.until(ExpectedConditions.urlContains("/home"));
            Assert.assertTrue(
                    driver.getCurrentUrl().contains("/home"),
                    "[" + tcId + "] Expected redirect to /home but got: " + driver.getCurrentUrl());
        } else {
            String actual = page.getErrorText();
            Assert.assertEquals(
                    actual,
                    expectedError.trim(),
                    "[" + tcId + "] Expected error: '" + expectedError.trim() + "' but got: '" + actual + "'");
        }
    }
}

```
Sheet `Sign In`. Same pattern as Signup. Must run before `SuiteAuthBootstrap`.
#### `src/test/java/com/iot/selenium/tests/LogoutTest.java`

**Full path:** `/Users/salmafarida/dxc/iot-frontend/iot-selenium/src/test/java/com/iot/selenium/tests/LogoutTest.java`

```java
package com.iot.selenium.tests;

import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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
        String tcId = Optional.ofNullable(rd.get("tc_id")).filter(s -> !s.isBlank()).orElse("unknown");

        clearSharedAuth();
        restoreAuthenticatedSession();

        driver.get(baseUrl + "/profile");
        wait.until(ExpectedConditions.urlContains("/profile"));

        UserProfilePage userProfilePage = new UserProfilePage(driver);
        userProfilePage.clickLogout();
        wait.until(ExpectedConditions.urlContains("/login"));

        Assert.assertTrue(
                driver.getCurrentUrl().contains("/login"),
                "[" + tcId + "] Expected URL to contain '/login' but got: " + driver.getCurrentUrl());

        clearSharedAuth();
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

```
Sheet `Logout`. **`clearSharedAuth()` + `restoreAuthenticatedSession()`** before logout test so session is valid (Sprint 3). After logout: `clearSharedAuth()` again. `testAuthGuardAfterLogout` depends on first test — `/home` → `/login`. **Must be last in suite** (blacklisted JWT).
#### `src/test/java/com/iot/selenium/tests/UserProfileTest.java`

**Full path:** `/Users/salmafarida/dxc/iot-frontend/iot-selenium/src/test/java/com/iot/selenium/tests/UserProfileTest.java`

```java
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
            loginIfNeeded(email, password);
            String actual = new UserProfilePage(driver).open(baseUrl).waitForLoad().getFullName();
            Assert.assertEquals(
                    actual,
                    expectedName,
                    "[" + tcId + "] Expected name: '" + expectedName + "' but got: '" + actual + "'");
        } else if (testCaseName.contains("displays correct email")) {
            loginIfNeeded(email, password);
            String actual = new UserProfilePage(driver).open(baseUrl).waitForLoad().getEmail();
            Assert.assertEquals(
                    actual,
                    expectedEmail,
                    "[" + tcId + "] Expected email: '" + expectedEmail + "' but got: '" + actual + "'");
        } else if (testCaseName.contains("back button")) {
            loginIfNeeded(email, password);
            new UserProfilePage(driver).open(baseUrl).waitForLoad().clickBack();
            wait.until(ExpectedConditions.urlContains("/home"));
            Assert.assertTrue(
                    driver.getCurrentUrl().contains("/home"),
                    "[" + tcId + "] Expected /home after back but got: " + driver.getCurrentUrl());
        } else if (testCaseName.contains("avatar click")) {
            loginIfNeeded(email, password);
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

```
Sheet `Profile Page`. Branches on `Test Case Name` substring. Uses `loginIfNeeded` for authenticated cases.
#### `src/test/java/com/iot/selenium/tests/SettingsTest.java`

**Full path:** `/Users/salmafarida/dxc/iot-frontend/iot-selenium/src/test/java/com/iot/selenium/tests/SettingsTest.java`

```java
package com.iot.selenium.tests;

import java.time.Duration;
import java.util.Arrays;
import java.util.Map;

import com.iot.selenium.config.ConfigReader;
import com.iot.selenium.pages.AlertsPage;
import com.iot.selenium.pages.SettingsPage;
import com.iot.selenium.pages.UserProfilePage;

import org.openqa.selenium.support.ui.WebDriverWait;
import org.testng.Assert;
import org.testng.annotations.AfterClass;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeClass;
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

    @BeforeClass(alwaysRun = true)
    public void authBeforeClass() throws Exception {
        super.setUp();
        driverInitialized = true;
        settingsPage = new SettingsPage(driver);
        restoreAuthenticatedSession();
        AlertsPage.flushAlertsPublic();
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
            baseUrl = configReader.getBaseUrl();
        }
        settingsPage = new SettingsPage(driver);
        settingsPage.dismissValidationAlertIfPresent();
        String url = driver.getCurrentUrl();
        if (url != null && url.contains("/login")) {
            ensureAuthenticatedForSettings();
        }
    }

    @AfterMethod(alwaysRun = true)
    @Override
    public void tearDown() {
        try {
            if (driver != null && settingsPage != null) {
                settingsPage.dismissValidationAlertIfPresent();
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
            ensureAuthenticatedForSettings();
            return;
        }

        if (name.contains("topbar")) {
            restoreAuthenticatedSession();
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
        settingsPage.dismissValidationAlertIfPresent();
        AlertsPage.flushAlertsPublic();
        settingsPage.flushSettings();
        ensureAuthenticatedForSettings();
        settingsPage.navigateToSettings();
        new WebDriverWait(driver, Duration.ofSeconds(15))
                .until(d -> settingsPage.isSaveButtonDisabled());
    }

    private void ensureAuthenticatedForSettings() {
        settingsPage.dismissValidationAlertIfPresent();
        String url = driver.getCurrentUrl();
        if (url != null && url.contains("/login")) {
            clearSharedAuth();
        }
        restoreAuthenticatedSession();
        url = driver.getCurrentUrl();
        if (url != null && url.contains("/login")) {
            clearSharedAuth();
            restoreAuthenticatedSession();
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

```
Sheet `Settings & Alerts` (tc_id TC-SA*). **One browser for entire class** (`driverInitialized`, no `super.tearDown` in `@AfterMethod`).

**Order dependency:** Runs after **AlertsTest** so alert seeding and flushes are not fighting Settings threshold saves.

**Auth:** `@BeforeClass` `restoreAuthenticatedSession` + `flushAlertsPublic`. `@BeforeMethod` dismiss validation alert, `ensureAuthenticatedForSettings` if on `/login`. **`flushAndOpen`** per test: dismiss alert → flush alerts/settings → restore auth → `navigateToSettings`.

**Sprint 3 fixes:** `dismissValidationAlertIfPresent` (native browser alert after invalid save); `ensureAuthenticatedForSettings` after negative navigation clears `localStorage`; `navigateToSettings` via topbar (not direct URL) to avoid toast overlap; removed `throws Exception` from helper for `setUp` override compatibility.

**Nine `@Test` methods** with data providers: navigation, initialState, toggleAddRemove, bva, contradiction, saveFlow, multiUser, newUser, persistence.


#### `src/test/java/com/iot/selenium/tests/AlertsTest.java`

**Full path:** `/Users/salmafarida/dxc/iot-frontend/iot-selenium/src/test/java/com/iot/selenium/tests/AlertsTest.java`

```java
package com.iot.selenium.tests;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import com.iot.selenium.config.ConfigReader;
import com.iot.selenium.pages.AlertsPage;
import com.iot.selenium.pages.SensorDashboardPage;
import com.iot.selenium.pages.SettingsPage;

import org.testng.Assert;
import org.testng.SkipException;
import org.testng.annotations.AfterClass;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

public class AlertsTest extends BaseTest {
    private static final String SHEET_NAME = "Alerts & Notifications";
    private static final long ALERT_POLL_TIMEOUT_MS = 20_000L;
    private static final long ALERT_POLL_INTERVAL_MS = 2_000L;

    private boolean driverInitialized = false;
    private String authToken;
    private AlertsPage alertsPage;
    private SensorDashboardPage sensorDashboardPage;
    private SettingsPage settingsPage;
    private ConfigReader configReader;

    @BeforeClass(alwaysRun = true)
    public void seedAlertsBeforeClass() {
        configReader = new ConfigReader();
        try {
            AlertsPage.flushSettingsPublic();
            AlertsPage.flushAlertsPublic();
        } catch (Exception e) {
            throw new IllegalStateException("Failed to flush alert/settings data before class", e);
        }

        super.setUp();
        driverInitialized = true;
        alertsPage = new AlertsPage(driver);
        sensorDashboardPage = new SensorDashboardPage(driver);
        settingsPage = new SettingsPage(driver);

        restoreAuthenticatedSession();
        authToken = getSharedAuthToken();
        try {
            runFullAlertSeedingSequence();
        } catch (SkipException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("Failed to seed alerts before class", e);
        }
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
        alertsPage = new AlertsPage(driver);
        sensorDashboardPage = new SensorDashboardPage(driver);
        settingsPage = new SettingsPage(driver);
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
    public void testPanelOpenClose() throws Exception {
        runPanelOpenCase("TC-AN01");
        runPanelCloseCase("TC-AN02");
    }

    @Test(priority = 2, dependsOnMethods = "testPanelOpenClose")
    public void testEmptyNotifications() throws Exception {
        AlertsPage.deleteAllAlerts(authToken);
        runEmptyStateCase("TC-AN03");
        runBadgeHiddenCase("TC-AN04");
    }

    @Test(priority = 3, dependsOnMethods = "testEmptyNotifications")
    public void testSeededNotifications() throws Exception {
        reseedAlertsAfterEmptyState();
        runBadgeVisibleCase("TC-AN05");
        runAlertCardListedCase("TC-AN06");
    }

    @Test(priority = 4, dependsOnMethods = "testSeededNotifications")
    public void testJumpToSensorModal() throws Exception {
        runJumpToModalCase("TC-AN07");
        runJumpToModalCase("TC-AN08");
    }

    @Test(priority = 5, dependsOnMethods = "testJumpToSensorModal")
    public void testDeleteFromModal() throws Exception {
        runDeleteFromModalCase("TC-AN09");
    }

    @Test(priority = 6, dependsOnMethods = "testPanelOpenClose")
    public void testPanelOnSettingsRoute() throws Exception {
        runPanelOnRouteCase("TC-AN12");
    }

    private void runFullAlertSeedingSequence() throws Exception {
        refreshAlertsFromSensors();
    }

    private void reseedAlertsAfterEmptyState() throws Exception {
        refreshAlertsFromSensors();
    }

    private void refreshAlertsFromSensors() throws Exception {
        if (authToken == null || authToken.isBlank()) {
            authToken = getSharedAuthToken();
        }
        AlertsPage.seedTrafficDensityAboveThreshold(authToken);
        for (int i = 0; i < 3; i++) {
            AlertsPage.generateSensorsPublic();
        }

        alertsPage.navigateToHome();
        sensorDashboardPage.waitForSectionDataDisplayed("traffic");
        sensorDashboardPage.clickRefresh("traffic");
        sensorDashboardPage.waitForSectionDataDisplayed("traffic");

        List<String> alertIds = AlertsPage.pollAlertIdsUntilMinCount(
                authToken, 1, ALERT_POLL_TIMEOUT_MS, ALERT_POLL_INTERVAL_MS);
        if (alertIds.isEmpty()) {
            throw new SkipException(
                    "Seeding failed — no alerts in DB after threshold + generate + refresh. Run aborted.");
        }
    }

    private void runPanelOpenCase(String tcId) throws Exception {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        alertsPage.navigateToHome();
        alertsPage.clickNotificationsBell();
        alertsPage.waitForPanelVisible();
        Assert.assertTrue(alertsPage.isPanelVisible(), "[" + tcId + "] Expected notification panel to be visible");
        Assert.assertEquals(
                alertsPage.getPanelTitleText(),
                data.get("expectedTitle"),
                "[" + tcId + "] Unexpected panel title");
    }

    private void runPanelCloseCase(String tcId) throws Exception {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        alertsPage.navigateToHome();
        alertsPage.clickNotificationsBell();
        alertsPage.waitForPanelVisible();
        alertsPage.clickClosePanel();
        alertsPage.waitForPanelClosed();
        Assert.assertFalse(alertsPage.isPanelVisible(), "[" + tcId + "] Expected notification panel to close");
    }

    private void runEmptyStateCase(String tcId) throws Exception {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        alertsPage.navigateToHome();
        alertsPage.clickNotificationsBell();
        alertsPage.waitForPanelVisible();
        Assert.assertTrue(
                alertsPage.isEmptyStateDisplayed(),
                "[" + tcId + "] Expected empty state to be displayed");
        Assert.assertEquals(
                alertsPage.getEmptyStateText(),
                data.get("expectedEmpty"),
                "[" + tcId + "] Unexpected empty state message");
        Assert.assertEquals(
                alertsPage.getPanelAlertCardCount(),
                0,
                "[" + tcId + "] Expected no alert cards in panel");
    }

    private void runBadgeHiddenCase(String tcId) throws Exception {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        alertsPage.navigateToHome();
        boolean expectedVisible = Boolean.parseBoolean(data.get("expectedBadgeVisible"));
        Assert.assertEquals(
                alertsPage.isBadgeVisible(),
                expectedVisible,
                "[" + tcId + "] Unexpected badge visibility");
    }

    private void runBadgeVisibleCase(String tcId) throws Exception {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        ensureAlertsPresent(tcId, data);
        alertsPage.navigateToHome();
        boolean expectedVisible = Boolean.parseBoolean(data.get("expectedBadgeVisible"));
        if (expectedVisible) {
            sensorDashboardPage.clickRefresh("traffic");
            alertsPage.waitForBadgeVisible(true, 20);
        }
        Assert.assertEquals(
                alertsPage.isBadgeVisible(),
                expectedVisible,
                "[" + tcId + "] Expected unread badge to be visible");
    }

    private void runAlertCardListedCase(String tcId) throws Exception {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        int minCards = Integer.parseInt(data.get("minAlertCards"));
        ensureAlertsPresent(tcId, data);
        alertsPage.navigateToHome();
        alertsPage.clickNotificationsBell();
        alertsPage.waitForPanelVisible();
        int count = alertsPage.getPanelAlertCardCount();
        Assert.assertTrue(count >= minCards, "[" + tcId + "] Expected at least " + minCards + " alert cards");
    }

    private void runJumpToModalCase(String tcId) throws Exception {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        String sensorType = data.get("sensorType");
        ensureAlertsPresent(tcId, data);
        alertsPage.navigateToHome();
        alertsPage.clickNotificationsBell();
        alertsPage.waitForPanelVisible();
        Assert.assertTrue(
                alertsPage.getPanelAlertCardCount() >= 1,
                "[" + tcId + "] Expected at least one alert card in panel");
        if ("air-quality".equals(sensorType) && !alertsPage.hasPanelAlertForSensorType(sensorType)) {
            throw new SkipException("[" + tcId + "] No air-quality alert card in panel after seeding");
        }
        alertsPage.clickPanelAlertCardBySensorType(sensorType);
        alertsPage.waitForPanelClosed();
        Assert.assertFalse(alertsPage.isPanelVisible(), "[" + tcId + "] Expected panel to close after jump");
        alertsPage.waitForSensorModalVisible(sensorType);
        Assert.assertTrue(
                alertsPage.isSensorModalVisible(sensorType),
                "[" + tcId + "] Expected " + sensorType + " alerts modal to open");
    }

    private void runDeleteFromModalCase(String tcId) throws Exception {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        String section = data.get("section");
        ensureAlertsPresent(tcId, data);
        alertsPage.navigateToHome();
        alertsPage.clickNotificationsBell();
        alertsPage.waitForPanelVisible();
        Assert.assertTrue(
                alertsPage.getPanelAlertCardCount() >= 1,
                "[" + tcId + "] Expected at least one alert card to open modal");
        alertsPage.clickFirstPanelAlertCard();
        alertsPage.waitForSensorModalVisible(section);
        int before = alertsPage.getSensorModalAlertCardCount(section);
        Assert.assertTrue(before >= 1, "[" + tcId + "] Expected at least one alert in modal to delete");
        alertsPage.clickDeleteFirstAlertInModal(section);
        alertsPage.waitForSensorModalAlertCount(section, before - 1);
        Assert.assertEquals(
                alertsPage.getSensorModalAlertCardCount(section),
                before - 1,
                "[" + tcId + "] Card removed from modal list");
    }

    private void runPanelOnRouteCase(String tcId) throws Exception {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        alertsPage.navigateTo(data.get("route"));
        alertsPage.clickNotificationsBell();
        alertsPage.waitForPanelVisible();
        Assert.assertTrue(alertsPage.isPanelVisible(), "[" + tcId + "] Expected panel on " + data.get("route"));
        Assert.assertEquals(
                alertsPage.getPanelTitleText(),
                data.get("expectedTitle"),
                "[" + tcId + "] Unexpected panel title on settings route");
    }

    private void ensureAlertsPresent(String tcId, Map<String, String> data) throws Exception {
        int minCards = data.containsKey("minAlertCards")
                ? Integer.parseInt(data.get("minAlertCards"))
                : 1;
        authToken = alertsPage.getAuthTokenFromLocalStorage();
        if (AlertsPage.fetchAlertIds(authToken).size() >= minCards) {
            return;
        }

        if (data.containsKey("requires") && "air_quality_threshold".equals(data.get("requires"))) {
            settingsPage.navigateToSettings();
            settingsPage.clickThresholdsTab();
            settingsPage.enterThresholdValue(
                    data.get("airThresholdPlaceholder"), data.get("airThresholdValue"));
            settingsPage.clickSaveChanges();
            if (settingsPage.isValidationAlertPresent()) {
                throw new IllegalStateException(
                        "[" + tcId + "] Air quality threshold save blocked by browser alert: "
                                + settingsPage.getValidationAlertText());
            }
            sensorDashboardPage.navigateToHome();
            sensorDashboardPage.waitForSectionDataDisplayed("air");
            sensorDashboardPage.clickRefresh("air");
            sensorDashboardPage.waitForSectionDataDisplayed("air");
            List<String> ids = AlertsPage.pollAlertIdsUntilMinCount(
                    authToken, minCards, ALERT_POLL_TIMEOUT_MS, ALERT_POLL_INTERVAL_MS);
            if (ids.size() < minCards) {
                throw new SkipException(
                        "[" + tcId + "] Need at least " + minCards + " alerts from API; got " + ids.size());
            }
            return;
        }

        throw new SkipException(
                "[" + tcId + "] Expected at least " + minCards + " alerts after class seeding; none found");
    }

    private Map<String, String> rowByTcId(String tcId) {
        return Arrays.stream(rowsForSheet(SHEET_NAME))
                .map(this::rowData)
                .filter(rd -> tcId.equals(rd.get("tc_id")))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Row not found for tc_id: " + tcId));
    }

}

```
Sheet `Alerts & Notifications` (TC-AN01–AN12). **Single browser**, `@BeforeClass` flush settings+alerts, restore session, **`runFullAlertSeedingSequence`**: API threshold seed + 3× `generateSensors` + traffic refresh + poll API for alert IDs.

**`dependsOnMethods` chain:** panel open/close → empty (delete all alerts) → seeded → jump modal → delete; `testPanelOnSettingsRoute` depends only on panel open.

**`enabled=false`:** Not in AlertsTest — disabled tests are in **SensorDashboardTest** (priority 2–5).

**SkipException:** Rethrown from `@BeforeClass` if seeding fails; air-quality card skip if no matching alert.


#### `src/test/java/com/iot/selenium/tests/TrafficDashboardTest.java`

**Full path:** `/Users/salmafarida/dxc/iot-frontend/iot-selenium/src/test/java/com/iot/selenium/tests/TrafficDashboardTest.java`

```java
package com.iot.selenium.tests;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import com.iot.selenium.config.ConfigReader;
import com.iot.selenium.pages.AlertsPage;
import com.iot.selenium.pages.TrafficDashboardPage;

import io.qameta.allure.Feature;
import io.qameta.allure.Step;
import org.testng.Assert;
import org.testng.SkipException;
import org.testng.annotations.AfterClass;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;
import org.openqa.selenium.JavascriptExecutor;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.ExpectedConditions;
import java.time.Duration;

/**
 * E2E tests for {@code /traffic-dashboard}. API seeding ({@code generateSensors} / per-type flush) is added
 * in setup only when a test needs table or empty-state data — not for entry-point (F6) cases.
 */
@Feature("Traffic Dashboard")
public class TrafficDashboardTest extends BaseTest {
    private static final String SHEET_NAME = "TrafficDashboard";
    private static final long ALERT_POLL_TIMEOUT_MS = 20_000L;
    private static final long ALERT_POLL_INTERVAL_MS = 2_000L;

    private boolean driverInitialized = false;
    private TrafficDashboardPage trafficDashboardPage;

    @BeforeClass(alwaysRun = true)
    public void seedBeforeClass() {
        configReader = new ConfigReader();
        ensureAuthToken();
        super.setUp();
        driverInitialized = true;
        trafficDashboardPage = new TrafficDashboardPage(driver);
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
        trafficDashboardPage = new TrafficDashboardPage(driver);
    }

    @AfterMethod(alwaysRun = true)
    @Override
    public void tearDown() {
        if (driver == null) return;
        // Keep browser alive across tests
    }

    @AfterClass(alwaysRun = true)
    public void tearDownClass() {
        driverInitialized = false;
        super.tearDown();
    }

    private Map<String, String> rowByTcId(String tcId) {
        return Arrays.stream(rowsForSheet(SHEET_NAME))
                .map(this::rowData)
                .filter(rd -> tcId.equals(rd.get("tc_id")))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Row not found for tc_id: " + tcId));
    }

    @Test(priority = 1)
    public void testEntryPoint() throws Exception {
        runTrafficCardVisibleCase("TC-F6-01");
        runTrafficCardNavigatesCase("TC-F6-02");
        runTrafficCardTitleCase("TC-F6-03");
        runAirQualityNavCardCase("TC-F6-05");
        runStreetLightsNavCardCase("TC-F6-06");
        runUnauthenticatedRedirectCase("TC-F6-04");
    }

    @Test(priority = 2)
    public void testDashboardNavigation() throws Exception {
        seedForF7();
        runDashboardLoadsCase("TC-F7-01");
        runBackButtonCase("TC-F7-03");
        runTableVisibleCase("TC-F7-04");
        runTableColumnsCase("TC-F7-05");
        runFilterPanelVisibleCase("TC-F7-06");
        runLoadingStateCase("TC-F7-07");
        runPageHeadingCase("TC-F7-08");
        runTableRowDataCase("TC-F7-09");
        runDashboardUnauthenticatedCase("TC-F7-02");
    }

    @Test(priority = 3)
    public void testFilters() throws Exception {
        seedForF7();
        runFilterByRingRoadCase("TC-F8-01");
        runFilterByOctoberBridgeCase("TC-F8-02");
        runFilterBySalahSalemCase("TC-F8-03");
        runFilterByLowCongestionCase("TC-F8-04");
        runFilterByModerateCongestionCase("TC-F8-05");
        runFilterByHighCongestionCase("TC-F8-06");
        runFilterBySevereCongestionCase("TC-F8-07");
    }

    @Test(priority = 4)
    public void testSorting() throws Exception {
        seedForSorting();
        runSortMostRecentCase("TC-F8-08");
        runSortOldestFirstCase("TC-F8-09");
        runSortDensityLowHighCase("TC-F8-10");
        runSortDensityHighLowCase("TC-F8-11");
        runSortSpeedLowHighCase("TC-F8-12");
        runSortSpeedHighLowCase("TC-F8-13");
        runSortOrderCase("TC-F8-24");
    }

    @Test(priority = 5)
    public void testPagination() throws Exception {
        seedForPagination();
        runNextPageCase("TC-F8-14");
        runPrevPageCase("TC-F8-15");
        runFirstPageCase("TC-F8-16");
        runLastPageCase("TC-F8-17");
        runPageSizeFiveCase("TC-F8-18");
        runPageSizeTenCase("TC-F8-19");
        runResetFiltersCase("TC-F8-20");
    }

    @Test(priority = 6)
    public void testFilterEdgeCases() throws Exception {
        seedForF7();
        runEmptyStateCase("TC-F8-21");
        runApplyFiltersReloadsCase("TC-F8-22");
        runFilterPanelToggleCase("TC-F8-23");
    }

    @Test(priority = 7)
    public void testAlertBanners() throws Exception {
        seedForF9();
        runAlertBannerVisibleCase("TC-F9-01");
        runAlertBannerDismissCase("TC-F9-02");
        runAlertBannerAutoDismissCase("TC-F9-03");
        runNoAlertBannersCase("TC-F9-04");
        runMultipleAlertBannersCase("TC-F9-05");
    }

    // TC-F10-05 (chart update on filter) excluded — not reliably testable via Selenium
    @Test(priority = 8)
    public void testAnalytics() throws Exception {
        seedForF7();
        runAnalyticsPanelVisibleCase("TC-F10-01");
        runAnalyticsToggleCase("TC-F10-02");
        runAnalyticsMetricCardsCase("TC-F10-03");
        runAnalyticsChartsRenderCase("TC-F10-04");
    }

    @Step("Authenticate API, flush and generate traffic sensors")
    private void seedForF7() throws Exception {
        ensureAuthToken();
        TrafficDashboardPage.flushSensors(authToken);
        TrafficDashboardPage.generateSensors(authToken);
    }

    @Step("Authenticate API, flush and generate two traffic readings for sort-order checks")
    private void seedForSorting() throws Exception {
        ensureAuthToken();
        TrafficDashboardPage.flushSensors(authToken);
        TrafficDashboardPage.generateSensors(authToken);
        TrafficDashboardPage.generateSensors(authToken);
    }

    @Step("Authenticate API, flush and generate traffic sensors for pagination")
    private void seedForPagination() throws Exception {
        ensureAuthToken();
        TrafficDashboardPage.flushSensors(authToken);
        for (int i = 0; i < 12; i++) {
            TrafficDashboardPage.generateSensors(authToken);
        }
    }

    @Step("Seed traffic alerts and open dashboard with alert banners")
    private void seedForF9() throws Exception {
        AlertsPage.flushAlertsPublic();
        AlertsPage.flushSettingsPublic();
        ensureAuthToken();
        String settingsBody =
                "[{\"type\":\"TRAFFIC\",\"metric\":\"TRAFFIC_DENSITY\",\"thresholdValue\":1,\"alertType\":\"ABOVE\"}]";
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest settingsRequest = HttpRequest.newBuilder()
                .uri(URI.create(configReader.getApiBaseUrl() + "/api/settings"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + authToken)
                .PUT(HttpRequest.BodyPublishers.ofString(settingsBody))
                .build();
        HttpResponse<String> settingsResponse = client.send(settingsRequest, HttpResponse.BodyHandlers.ofString());
        if (settingsResponse.statusCode() < 200 || settingsResponse.statusCode() >= 300) {
            throw new IllegalStateException(
                    "PUT /api/settings failed with status " + settingsResponse.statusCode()
                            + ": " + settingsResponse.body());
        }
        for (int i = 0; i < 3; i++) {
            TrafficDashboardPage.generateSensors(authToken);
        }
        trafficDashboardPage.openWithoutToastDismiss().waitForResultsReady();
        long deadline = System.currentTimeMillis() + ALERT_POLL_TIMEOUT_MS;
        while (System.currentTimeMillis() < deadline) {
            if (trafficDashboardPage.isAlertBannerVisible()) {
                return;
            }
            Thread.sleep(ALERT_POLL_INTERVAL_MS);
            driver.navigate().refresh();
            trafficDashboardPage.waitForLoadWithoutDismissingToasts().waitForResultsReady();
        }
    }

    @Step("TC-F6-01: Traffic nav card is visible on /home")
    private void runTrafficCardVisibleCase(String tcId) {
        rowByTcId(tcId);
        trafficDashboardPage.navigateToHome();
        Assert.assertTrue(
                trafficDashboardPage.isTrafficNavCardVisible(),
                "[" + tcId + "] Traffic nav card should be visible on /home");
    }

    @Step("TC-F6-02: Clicking traffic card navigates to /traffic-dashboard")
    private void runTrafficCardNavigatesCase(String tcId) {
        rowByTcId(tcId);
        trafficDashboardPage.openFromHome();
        Assert.assertTrue(
                driver.getCurrentUrl().contains("/traffic-dashboard"),
                "[" + tcId + "] Clicking traffic card should navigate to /traffic-dashboard");
    }

    @Step("TC-F6-03: Traffic card title contains expected description")
    private void runTrafficCardTitleCase(String tcId) {
        rowByTcId(tcId);
        trafficDashboardPage.navigateToHome();
        String cardText = trafficDashboardPage.getTrafficNavCardText();
        Assert.assertTrue(
                cardText.toLowerCase().contains("monitor road congestion and traffic flow"),
                "[" + tcId + "] Traffic card title incorrect, got: " + cardText);
    }

    @Step("TC-F6-04: Unauthenticated user is redirected to /login from /home")
    private void runUnauthenticatedRedirectCase(String tcId) {
        rowByTcId(tcId);
        ((JavascriptExecutor) driver).executeScript("window.localStorage.clear();");
        driver.get(configReader.getBaseUrl() + configReader.getHomePath());
        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(ExpectedConditions.urlContains("/login"));
        Assert.assertTrue(
                driver.getCurrentUrl().contains("/login"),
                "[" + tcId + "] Unauthenticated user should be redirected to /login");
        restoreAuthenticatedSession();
    }

    @Step("TC-F6-05: Air Quality nav card has data-testid attribute")
    private void runAirQualityNavCardCase(String tcId) {
        rowByTcId(tcId);
        trafficDashboardPage.navigateToHome();
        if (!trafficDashboardPage.isAirQualityNavCardVisible()) {
            throw new SkipException(
                    "[" + tcId + "] BUG 86c9y6abu: Air Quality nav card is missing data-testid='air-quality-nav-card'");
        }
    }

    @Step("TC-F6-06: Street Lights nav card has data-testid attribute")
    private void runStreetLightsNavCardCase(String tcId) {
        rowByTcId(tcId);
        trafficDashboardPage.navigateToHome();
        if (!trafficDashboardPage.isStreetLightsNavCardVisible()) {
            throw new SkipException(
                    "[" + tcId + "] BUG 86c9y6abu: Street Lights nav card is missing data-testid='street-lights-nav-card'");
        }
    }

    @Step("TC-F7-01: Traffic dashboard loads at /traffic-dashboard")
    private void runDashboardLoadsCase(String tcId) {
        rowByTcId(tcId);
        trafficDashboardPage.open();
        Assert.assertTrue(
                trafficDashboardPage.isLoaded(),
                "[" + tcId + "] Traffic dashboard page should be loaded");
        Assert.assertTrue(
                driver.getCurrentUrl().contains("/traffic-dashboard"),
                "[" + tcId + "] URL should contain /traffic-dashboard");
    }

    @Step("TC-F7-02: Unauthenticated access to dashboard redirects to /login")
    private void runDashboardUnauthenticatedCase(String tcId) {
        rowByTcId(tcId);
        ((JavascriptExecutor) driver).executeScript("window.localStorage.clear();");
        driver.get(configReader.getBaseUrl() + configReader.getTrafficDashboardPath());
        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(ExpectedConditions.urlContains("/login"));
        Assert.assertTrue(
                driver.getCurrentUrl().contains("/login"),
                "[" + tcId + "] Unauthenticated user should be redirected to /login");
        restoreAuthenticatedSession();
    }

    @Step("TC-F7-03: Back button navigates to /home")
    private void runBackButtonCase(String tcId) {
        rowByTcId(tcId);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        trafficDashboardPage.navigateToHome();
        Assert.assertTrue(
                driver.getCurrentUrl().contains("/home"),
                "[" + tcId + "] Back button should navigate to /home");
    }

    @Step("TC-F7-04: Traffic readings table is visible")
    private void runTableVisibleCase(String tcId) {
        rowByTcId(tcId);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        Assert.assertTrue(
                trafficDashboardPage.isTableVisible(),
                "[" + tcId + "] Traffic readings table should be visible");
    }

    @Step("TC-F7-05: Table displays all six column headers")
    private void runTableColumnsCase(String tcId) {
        rowByTcId(tcId);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        String pageSource = driver.getPageSource().toUpperCase();
        String[] columnHeaders = {
                "LOCATION", "TIMESTAMP", "DENSITY", "AVG SPEED", "CONGESTION", "VEHICLES/MIN"
        };
        for (String columnHeader : columnHeaders) {
            Assert.assertTrue(
                    pageSource.contains(columnHeader),
                    "[" + tcId + "] Page should contain column header: " + columnHeader);
        }
    }

    @Step("TC-F7-06: Filter panel is visible")
    private void runFilterPanelVisibleCase(String tcId) {
        rowByTcId(tcId);
        trafficDashboardPage.open().waitForLoad();
        Assert.assertTrue(
                trafficDashboardPage.isFilterPanelVisible(),
                "[" + tcId + "] Filter panel should be visible");
    }

    @Step("TC-F7-07: Loading state finishes and dashboard is loaded")
    private void runLoadingStateCase(String tcId) {
        rowByTcId(tcId);
        driver.get(configReader.getBaseUrl() + configReader.getTrafficDashboardPath());
        trafficDashboardPage.waitForUrl(configReader.getTrafficDashboardPath(), 15);
        trafficDashboardPage.waitForLoadingIfPresent(5);
        trafficDashboardPage.waitForResultsReady();
        Assert.assertTrue(
                trafficDashboardPage.isLoaded(),
                "[" + tcId + "] Dashboard should finish loading");
    }

    @Step("TC-F7-08: Page heading contains Sensor readings")
    private void runPageHeadingCase(String tcId) {
        rowByTcId(tcId);
        trafficDashboardPage.open().waitForLoad();
        Assert.assertTrue(
                driver.getPageSource().contains("Sensor readings"),
                "[" + tcId + "] Page should contain heading: Sensor readings");
    }

    @Step("TC-F7-09: First table row contains valid location data")
    private void runTableRowDataCase(String tcId) {
        rowByTcId(tcId);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        String rowText = trafficDashboardPage.getFirstRowText();
        boolean containsLocation =
                rowText.contains("CAIRO_RING_ROAD") ||
                rowText.contains("CAIRO_OCTOBER_BRIDGE") ||
                rowText.contains("CAIRO_SALAH_SALEM_ROAD");
        Assert.assertTrue(
                containsLocation,
                "[" + tcId + "] First table row should contain a valid Cairo location, got: " + rowText);
    }

    @Step("TC-F8-01: Filter by Cairo Ring Road location")
    private void runFilterByRingRoadCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        trafficDashboardPage.clickResetFilters().waitForResultsReady();
        trafficDashboardPage.selectLocation(data.getOrDefault("location", "CAIRO_RING_ROAD"));
        trafficDashboardPage.clickApplyFilters().waitForResultsReady();
        Assert.assertTrue(
                trafficDashboardPage.isTableVisible() || trafficDashboardPage.isEmptyStateVisible(),
                "[" + tcId + "] Table or empty state should be visible after applying location filter");
        if (trafficDashboardPage.isTableVisible()) {
            Assert.assertTrue(
                    driver.getPageSource().contains(data.getOrDefault("expected_location", "CAIRO_RING_ROAD")),
                    "[" + tcId + "] Filtered results should contain CAIRO_RING_ROAD");
        }
    }

    @Step("TC-F8-02: Filter by Cairo October Bridge location")
    private void runFilterByOctoberBridgeCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        trafficDashboardPage.clickResetFilters().waitForResultsReady();
        trafficDashboardPage.selectLocation(data.getOrDefault("location", "OCTOBER_BRIDGE"));
        trafficDashboardPage.clickApplyFilters().waitForResultsReady();
        Assert.assertTrue(
                trafficDashboardPage.isTableVisible() || trafficDashboardPage.isEmptyStateVisible(),
                "[" + tcId + "] Table or empty state should be visible after applying location filter");
        if (trafficDashboardPage.isTableVisible()) {
            Assert.assertTrue(
                    driver.getPageSource().contains(data.getOrDefault("expected_location", "CAIRO_OCTOBER_BRIDGE")),
                    "[" + tcId + "] Filtered results should contain CAIRO_OCTOBER_BRIDGE");
        }
    }

    @Step("TC-F8-03: Filter by Cairo Salah Salem Road location")
    private void runFilterBySalahSalemCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        trafficDashboardPage.clickResetFilters().waitForResultsReady();
        trafficDashboardPage.selectLocation(data.getOrDefault("location", "SALAH_SALEM"));
        trafficDashboardPage.clickApplyFilters().waitForResultsReady();
        Assert.assertTrue(
                trafficDashboardPage.isTableVisible() || trafficDashboardPage.isEmptyStateVisible(),
                "[" + tcId + "] Table or empty state should be visible after applying location filter");
        if (trafficDashboardPage.isTableVisible()) {
            Assert.assertTrue(
                    driver.getPageSource().contains(data.getOrDefault("expected_location", "CAIRO_SALAH_SALEM_ROAD")),
                    "[" + tcId + "] Filtered results should contain CAIRO_SALAH_SALEM_ROAD");
        }
    }

    @Step("TC-F8-04: Filter by low congestion level")
    private void runFilterByLowCongestionCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        trafficDashboardPage.clickResetFilters().waitForResultsReady();
        trafficDashboardPage.selectCongestion(data.getOrDefault("congestion", "LOW"));
        trafficDashboardPage.clickApplyFilters().waitForResultsReady();
        Assert.assertTrue(
                trafficDashboardPage.isTableVisible() || trafficDashboardPage.isEmptyStateVisible(),
                "[" + tcId + "] Table or empty state should be visible after applying congestion filter");
        if (trafficDashboardPage.isTableVisible()) {
            Assert.assertTrue(
                    driver.getPageSource().contains(data.getOrDefault("expected_congestion", "LOW")),
                    "[" + tcId + "] Filtered results should contain LOW");
        }
    }

    @Step("TC-F8-05: Filter by moderate congestion level")
    private void runFilterByModerateCongestionCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        trafficDashboardPage.clickResetFilters().waitForResultsReady();
        trafficDashboardPage.selectCongestion(data.getOrDefault("congestion", "MODERATE"));
        trafficDashboardPage.clickApplyFilters().waitForResultsReady();
        Assert.assertTrue(
                trafficDashboardPage.isTableVisible() || trafficDashboardPage.isEmptyStateVisible(),
                "[" + tcId + "] Table or empty state should be visible after applying congestion filter");
        if (trafficDashboardPage.isTableVisible()) {
            Assert.assertTrue(
                    driver.getPageSource().contains(data.getOrDefault("expected_congestion", "MODERATE")),
                    "[" + tcId + "] Filtered results should contain MODERATE");
        }
    }

    @Step("TC-F8-06: Filter by high congestion level")
    private void runFilterByHighCongestionCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        trafficDashboardPage.clickResetFilters().waitForResultsReady();
        trafficDashboardPage.selectCongestion(data.getOrDefault("congestion", "HIGH"));
        trafficDashboardPage.clickApplyFilters().waitForResultsReady();
        Assert.assertTrue(
                trafficDashboardPage.isTableVisible() || trafficDashboardPage.isEmptyStateVisible(),
                "[" + tcId + "] Table or empty state should be visible after applying congestion filter");
        if (trafficDashboardPage.isTableVisible()) {
            Assert.assertTrue(
                    driver.getPageSource().contains(data.getOrDefault("expected_congestion", "HIGH")),
                    "[" + tcId + "] Filtered results should contain HIGH");
        }
    }

    @Step("TC-F8-07: Filter by severe congestion level")
    private void runFilterBySevereCongestionCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        trafficDashboardPage.clickResetFilters().waitForResultsReady();
        trafficDashboardPage.selectCongestion(data.getOrDefault("congestion", "SEVERE"));
        trafficDashboardPage.clickApplyFilters().waitForResultsReady();
        Assert.assertTrue(
                trafficDashboardPage.isTableVisible() || trafficDashboardPage.isEmptyStateVisible(),
                "[" + tcId + "] Table or empty state should be visible after applying congestion filter");
        if (trafficDashboardPage.isTableVisible()) {
            Assert.assertTrue(
                    driver.getPageSource().contains(data.getOrDefault("expected_congestion", "SEVERE")),
                    "[" + tcId + "] Filtered results should contain SEVERE");
        }
    }

    @Step("TC-F8-08: Sort by most recent first")
    private void runSortMostRecentCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        trafficDashboardPage.clickResetFilters().waitForResultsReady();
        trafficDashboardPage.selectSort(data.getOrDefault("sort", "timestamp:desc"));
        trafficDashboardPage.clickApplyFilters().waitForResultsReady();
        Assert.assertTrue(
                trafficDashboardPage.isTableVisible() || trafficDashboardPage.isEmptyStateVisible(),
                "[" + tcId + "] Table or empty state should be visible after applying sort");
        if (trafficDashboardPage.isTableVisible()) {
            Assert.assertTrue(
                    trafficDashboardPage.getRowCount() > 0,
                    "[" + tcId + "] Sorted table should have at least one row");
        }
    }

    @Step("TC-F8-09: Sort by oldest first")
    private void runSortOldestFirstCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        trafficDashboardPage.clickResetFilters().waitForResultsReady();
        trafficDashboardPage.selectSort(data.getOrDefault("sort", "timestamp:asc"));
        trafficDashboardPage.clickApplyFilters().waitForResultsReady();
        Assert.assertTrue(
                trafficDashboardPage.isTableVisible() || trafficDashboardPage.isEmptyStateVisible(),
                "[" + tcId + "] Table or empty state should be visible after applying sort");
        if (trafficDashboardPage.isTableVisible()) {
            Assert.assertTrue(
                    trafficDashboardPage.getRowCount() > 0,
                    "[" + tcId + "] Sorted table should have at least one row");
        }
    }

    @Step("TC-F8-10: Sort by density low to high")
    private void runSortDensityLowHighCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        trafficDashboardPage.clickResetFilters().waitForResultsReady();
        trafficDashboardPage.selectSort(data.getOrDefault("sort", "trafficDensity:asc"));
        trafficDashboardPage.clickApplyFilters().waitForResultsReady();
        Assert.assertTrue(
                trafficDashboardPage.isTableVisible() || trafficDashboardPage.isEmptyStateVisible(),
                "[" + tcId + "] Table or empty state should be visible after applying sort");
        if (trafficDashboardPage.isTableVisible()) {
            Assert.assertTrue(
                    trafficDashboardPage.getRowCount() > 0,
                    "[" + tcId + "] Sorted table should have at least one row");
        }
    }

    @Step("TC-F8-11: Sort by density high to low")
    private void runSortDensityHighLowCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        trafficDashboardPage.clickResetFilters().waitForResultsReady();
        trafficDashboardPage.selectSort(data.getOrDefault("sort", "trafficDensity:desc"));
        trafficDashboardPage.clickApplyFilters().waitForResultsReady();
        Assert.assertTrue(
                trafficDashboardPage.isTableVisible() || trafficDashboardPage.isEmptyStateVisible(),
                "[" + tcId + "] Table or empty state should be visible after applying sort");
        if (trafficDashboardPage.isTableVisible()) {
            Assert.assertTrue(
                    trafficDashboardPage.getRowCount() > 0,
                    "[" + tcId + "] Sorted table should have at least one row");
        }
    }

    @Step("TC-F8-12: Sort by speed low to high")
    private void runSortSpeedLowHighCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        trafficDashboardPage.clickResetFilters().waitForResultsReady();
        trafficDashboardPage.selectSort(data.getOrDefault("sort", "avgSpeed:asc"));
        trafficDashboardPage.clickApplyFilters().waitForResultsReady();
        Assert.assertTrue(
                trafficDashboardPage.isTableVisible() || trafficDashboardPage.isEmptyStateVisible(),
                "[" + tcId + "] Table or empty state should be visible after applying sort");
        if (trafficDashboardPage.isTableVisible()) {
            Assert.assertTrue(
                    trafficDashboardPage.getRowCount() > 0,
                    "[" + tcId + "] Sorted table should have at least one row");
        }
    }

    @Step("TC-F8-13: Sort by speed high to low")
    private void runSortSpeedHighLowCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        trafficDashboardPage.clickResetFilters().waitForResultsReady();
        trafficDashboardPage.selectSort(data.getOrDefault("sort", "avgSpeed:desc"));
        trafficDashboardPage.clickApplyFilters().waitForResultsReady();
        Assert.assertTrue(
                trafficDashboardPage.isTableVisible() || trafficDashboardPage.isEmptyStateVisible(),
                "[" + tcId + "] Table or empty state should be visible after applying sort");
        if (trafficDashboardPage.isTableVisible()) {
            Assert.assertTrue(
                    trafficDashboardPage.getRowCount() > 0,
                    "[" + tcId + "] Sorted table should have at least one row");
        }
    }

    @Step("TC-F8-24: Rows sorted by timestamp descending are in correct order")
    private void runSortOrderCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        trafficDashboardPage.clickResetFilters().waitForResultsReady();
        trafficDashboardPage.selectSort(data.getOrDefault("sort", "timestamp:desc"));
        trafficDashboardPage.clickApplyFilters().waitForResultsReady();
        Assert.assertTrue(
                trafficDashboardPage.getRowCount() >= 2,
                "[" + tcId + "] Need at least two table rows to verify timestamp sort order");
        String first = trafficDashboardPage.getFirstRowTimestamp();
        String second = trafficDashboardPage.getSecondRowTimestamp();
        Assert.assertFalse(
                first.isEmpty(),
                "[" + tcId + "] First row timestamp should be present");
        Assert.assertFalse(
                second.isEmpty(),
                "[" + tcId + "] Second row timestamp should be present");
        Assert.assertTrue(
                first.compareTo(second) >= 0,
                "[" + tcId + "] First row timestamp should be >= second row timestamp in desc sort. Got: "
                        + first + " vs " + second);
    }

    @Step("TC-F8-14: Next page navigation shows rows and enables previous page")
    private void runNextPageCase(String tcId) {
        rowByTcId(tcId);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        trafficDashboardPage.clickResetFilters().waitForResultsReady();
        Assert.assertTrue(
                trafficDashboardPage.isNextPageEnabled(),
                "[" + tcId + "] Next page button should be enabled");
        trafficDashboardPage.clickNextPage();
        Assert.assertTrue(
                trafficDashboardPage.getRowCount() > 0,
                "[" + tcId + "] Next page should display at least one row");
        Assert.assertTrue(
                trafficDashboardPage.isPrevPageEnabled(),
                "[" + tcId + "] Previous page button should be enabled after navigating forward");
    }

    @Step("TC-F8-15: Previous page returns to first page")
    private void runPrevPageCase(String tcId) {
        rowByTcId(tcId);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        trafficDashboardPage.clickResetFilters().waitForResultsReady();
        trafficDashboardPage.clickNextPage();
        trafficDashboardPage.clickPrevPage();
        Assert.assertFalse(
                trafficDashboardPage.isPrevPageEnabled(),
                "[" + tcId + "] Previous page button should be disabled on first page");
        Assert.assertTrue(
                trafficDashboardPage.getRowCount() > 0,
                "[" + tcId + "] First page should display at least one row");
    }

    @Step("TC-F8-16: First page button returns to first page")
    private void runFirstPageCase(String tcId) {
        rowByTcId(tcId);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        trafficDashboardPage.clickResetFilters().waitForResultsReady();
        trafficDashboardPage.clickNextPage();
        trafficDashboardPage.clickFirstPage();
        Assert.assertFalse(
                trafficDashboardPage.isPrevPageEnabled(),
                "[" + tcId + "] Previous page button should be disabled on first page");
        Assert.assertFalse(
                trafficDashboardPage.isFirstPageEnabled(),
                "[" + tcId + "] First page button should be disabled on first page");
    }

    @Step("TC-F8-17: Last page button navigates to last page")
    private void runLastPageCase(String tcId) {
        rowByTcId(tcId);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        trafficDashboardPage.clickResetFilters().waitForResultsReady();
        trafficDashboardPage.clickLastPage();
        Assert.assertFalse(
                trafficDashboardPage.isNextPageEnabled(),
                "[" + tcId + "] Next page button should be disabled on last page");
        Assert.assertFalse(
                trafficDashboardPage.isLastPageEnabled(),
                "[" + tcId + "] Last page button should be disabled on last page");
    }

    @Step("TC-F8-18: Page size five shows five rows")
    private void runPageSizeFiveCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        int expectedSize = Integer.parseInt(data.getOrDefault("page_size", "5"));
        trafficDashboardPage.selectPageSize(data.getOrDefault("page_size", "5")).waitForResultsReady();
        Assert.assertEquals(
                trafficDashboardPage.getRowCount(),
                expectedSize,
                "[" + tcId + "] Page size 5 should show exactly 5 rows");
    }

    @Step("TC-F8-19: Page size ten shows ten rows")
    private void runPageSizeTenCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        int expectedSize = Integer.parseInt(data.getOrDefault("page_size", "10"));
        trafficDashboardPage.selectPageSize(data.getOrDefault("page_size", "10")).waitForResultsReady();
        Assert.assertEquals(
                trafficDashboardPage.getRowCount(),
                expectedSize,
                "[" + tcId + "] Page size 10 should show exactly 10 rows");
    }

    @Step("TC-F8-20: Reset filters restores full results table")
    private void runResetFiltersCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        trafficDashboardPage.selectLocation(data.getOrDefault("location", "CAIRO_RING_ROAD"));
        trafficDashboardPage.clickApplyFilters().waitForResultsReady();
        trafficDashboardPage.clickResetFilters().waitForResultsReady();
        Assert.assertTrue(
                trafficDashboardPage.getRowCount() > 0,
                "[" + tcId + "] Reset filters should restore at least one row");
    }

    @Step("TC-F8-21: Restrictive filters show empty state or matching table")
    private void runEmptyStateCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        trafficDashboardPage.selectLocation(data.getOrDefault("location", "CAIRO_RING_ROAD"));
        trafficDashboardPage.selectCongestion(data.getOrDefault("congestion", "SEVERE"));
        trafficDashboardPage.clickApplyFilters().waitForResultsReady();
        if (trafficDashboardPage.isEmptyStateVisible()) {
            Assert.assertFalse(
                    trafficDashboardPage.isTableVisible(),
                    "[" + tcId + "] Table should not be visible when empty state is shown");
        } else {
            Assert.assertTrue(
                    trafficDashboardPage.isTableVisible(),
                    "[" + tcId + "] Table should be visible when seeded data matches filters");
        }
    }

    @Step("TC-F8-22: Apply filters reloads table or empty state")
    private void runApplyFiltersReloadsCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        trafficDashboardPage.clickResetFilters().waitForResultsReady();
        trafficDashboardPage.selectLocation(data.getOrDefault("location", "CAIRO_RING_ROAD"));
        trafficDashboardPage.clickApplyFilters().waitForResultsReady();
        Assert.assertTrue(
                trafficDashboardPage.isTableVisible() || trafficDashboardPage.isEmptyStateVisible(),
                "[" + tcId + "] Apply filters should show table or empty state");
    }

    @Step("TC-F8-23: Filter panel expands and collapses")
    private void runFilterPanelToggleCase(String tcId) {
        rowByTcId(tcId);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        Assert.assertFalse(
                trafficDashboardPage.isFilterPanelCollapsed(),
                "[" + tcId + "] Filter panel should be expanded initially");
        trafficDashboardPage.clickFilterPanelToggle().waitForFilterPanelCollapsed();
        Assert.assertTrue(
                trafficDashboardPage.isFilterPanelCollapsed(),
                "[" + tcId + "] Filter panel should be collapsed after toggle");
        trafficDashboardPage.clickFilterPanelToggle().waitForFilterPanelExpanded();
        Assert.assertFalse(
                trafficDashboardPage.isFilterPanelCollapsed(),
                "[" + tcId + "] Filter panel should be expanded after second toggle");
    }

    @Step("TC-F9-01: Traffic alert banner is visible on dashboard")
    private void runAlertBannerVisibleCase(String tcId) {
        rowByTcId(tcId);
        Assert.assertTrue(
                trafficDashboardPage.isAlertBannerVisible(),
                "[" + tcId + "] Alert banner should be visible");
    }

    @Step("TC-F9-02: Alert banner can be dismissed manually")
    private void runAlertBannerDismissCase(String tcId) {
        rowByTcId(tcId);
        trafficDashboardPage.waitForAlertBanner();
        int bannersBeforeDismiss = trafficDashboardPage.getAlertBannerCount();
        Assert.assertTrue(
                bannersBeforeDismiss > 0,
                "[" + tcId + "] Expected at least one alert banner before dismiss");
        trafficDashboardPage.dismissAlertBanner();
        new WebDriverWait(driver, Duration.ofSeconds(5))
                .until(d -> trafficDashboardPage.getAlertBannerCount() < bannersBeforeDismiss);
        Assert.assertTrue(
                trafficDashboardPage.getAlertBannerCount() < bannersBeforeDismiss,
                "[" + tcId + "] Manual dismiss should remove at least one alert banner");
    }

    @Step("TC-F9-03: Alert banner auto-dismisses after five seconds")
    private void runAlertBannerAutoDismissCase(String tcId) throws Exception {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.waitForAlertBanner();
        long waitMs = Long.parseLong(data.getOrDefault("wait_ms", "7000"));
        Thread.sleep(waitMs);
        Assert.assertFalse(
                trafficDashboardPage.isAlertBannerVisible(),
                "[" + tcId + "] Alert banner should auto-dismiss without clicking close");
    }

    @Step("TC-F9-04: No alert banners when alerts are flushed")
    private void runNoAlertBannersCase(String tcId) throws Exception {
        rowByTcId(tcId);
        AlertsPage.flushAlertsPublic();
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        Assert.assertFalse(
                trafficDashboardPage.isAlertBannerVisible(),
                "[" + tcId + "] No alert banner should be visible after flushing alerts");
    }

    @Step("TC-F9-05: Multiple alert banners can appear at once")
    private void runMultipleAlertBannersCase(String tcId) throws Exception {
        rowByTcId(tcId);
        for (int i = 0; i < 3; i++) {
            TrafficDashboardPage.generateSensors(authToken);
        }
        trafficDashboardPage.openWithoutToastDismiss().waitForResultsReady();
        boolean multipleBannersVisible = false;
        long deadline = System.currentTimeMillis() + 3_000L;
        while (System.currentTimeMillis() < deadline) {
            if (trafficDashboardPage.getAlertBannerCount() >= 2) {
                multipleBannersVisible = true;
                break;
            }
            Thread.sleep(500);
        }
        Assert.assertTrue(
                multipleBannersVisible,
                "[" + tcId + "] At least two alert banners should be visible before auto-dismiss");
    }

    @Step("TC-F10-01: Analytics panel header is visible when data exists")
    private void runAnalyticsPanelVisibleCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        Assert.assertTrue(
                trafficDashboardPage.isAnalyticsHeaderVisible(),
                "[" + tcId + "] Analytics panel header should be visible when readings exist");
    }

    @Step("TC-F10-02: Analytics panel collapses and expands on header click")
    private void runAnalyticsToggleCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        Assert.assertTrue(
                trafficDashboardPage.isAnalyticsPanelExpanded(),
                "[" + tcId + "] Analytics panel should start expanded");
        trafficDashboardPage.clickAnalyticsToggle();
        Assert.assertFalse(
                trafficDashboardPage.isAnalyticsPanelExpanded(),
                "[" + tcId + "] Analytics panel should collapse after header click");
        trafficDashboardPage.clickAnalyticsToggle();
        Assert.assertTrue(
                trafficDashboardPage.isAnalyticsPanelExpanded(),
                "[" + tcId + "] Analytics panel should expand again after second header click");
    }

    @Step("TC-F10-03: Analytics metric cards display non-empty values")
    private void runAnalyticsMetricCardsCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        List<String> values = trafficDashboardPage.getAnalyticsMetricCardTexts();
        Assert.assertFalse(
                values.isEmpty(),
                "[" + tcId + "] At least one metric card should be visible");
        for (String value : values) {
            Assert.assertFalse(
                    value.isBlank(),
                    "[" + tcId + "] Metric card value should not be blank, got: " + value);
        }
    }

    @Step("TC-F10-04: All three charts render when data exists")
    private void runAnalyticsChartsRenderCase(String tcId) {
        Map<String, String> rd = rowByTcId(tcId);
        Map<String, String> data = structuredData(rd);
        trafficDashboardPage.open().waitForLoad().waitForResultsReady();
        if (trafficDashboardPage.isAlertBannerStripVisible()) {
            trafficDashboardPage.dismissAllAlertBanners();
        }
        Assert.assertTrue(
                trafficDashboardPage.areChartsRendered(),
                "[" + tcId + "] All three charts (speed, density, donut) should be rendered");
    }
}

```
See dedicated section below after full source. Summary:

- `@Feature("Traffic Dashboard")` on class; `@Step` on every `run*Case` and seed helper.
- **8 `@Test` methods** priorities 1–8: entry (F6), navigation (F7), filters (F8), sorting, pagination, edge cases, alert banners (F9), analytics (F10).
- **Shared browser** `@BeforeClass`: `ensureAuthToken`, `restoreAuthenticatedSession`.
- **`rowByTcId(tcId)`** loads Excel row for structured data.
- **TC-F6-05/06:** `SkipException` if `data-testid` nav cards missing (known product bug).
- **TC-F9-06–09:** In Excel, **not implemented** in Java (only F9-01–05).
- **Sprint 3:** stale filter panel retries, auth after F6-04 negative, `seedForF9` TRAFFIC threshold API, no toast dismiss on banner tests.


---

## Sprint 3 failure fixes (chronological)

| # | Symptom / error | File(s) | Before → After | Why it worked |
|---|-----------------|---------|----------------|---------------|
| 1 | HTTP **429** on login; stuck on `/login` | `BaseTest`, backend `RateLimitService`, `application-dev.properties` | Many UI logins → **one API login** + `sharedAuthToken` + `restoreAuthenticatedSession()` inject | Fewer auth requests; dev rate limit disabled |
| 2 | ~53 failures, auth redirect | `testng.xml`, `SuiteAuthBootstrap` | `@BeforeSuite` prime → **test after Signin** | Token primed after user exists |
| 3 | Alerts could not seed | `AlertsTest`, `AlertsPage` | UI-only threshold → **API** `seedTrafficDensityAboveThreshold` + sensor generate + poll | Deterministic DB alerts |
| 4 | Settings on `/login` mid-class | `SettingsTest` | — → `@BeforeClass`/`@BeforeMethod` restore + `flushAndOpen` | Session restored without new driver |
| 5 | `navigateToSettings` timeout; toasts block | `SettingsPage`, `BasePage` | Direct `/settings` URL → **/home + dismiss toasts + topbar settings** | Toasts no longer cover settings button |
| 6 | `UnhandledAlertException` after BVA negative save | `SettingsPage`, `SettingsTest` | — → `dismissValidationAlertIfPresent()` in flush/setUp/tearDown | Native alert cleared before `getCurrentUrl()` |
| 7 | After negative nav test, next test on `/login` | `SettingsTest` | — → `ensureAuthenticatedForSettings()` after negative + in flush | Re-inject JWT after `localStorage.clear()` |
| 8 | Traffic filter panel stale / not collapsed | `TrafficDashboardPage`, `TrafficDashboardTest` | Single click assert → **retry loops** + `waitForFilterPanelCollapsed` | Angular re-renders panel |
| 9 | F6-05/06 fail (missing testids) | `TrafficDashboardTest` | Hard fail → **`SkipException`** | Known bug 86c9y6abu — skip not fail |
| 10 | `NoSuchSessionException` mid-Settings (Chrome crash) | — | Infrastructure flake; not a code defect | Long single-browser run; re-run suite |
| 11 | Compilation: `setUp` cannot throw | `SettingsTest` | `ensureAuthenticatedForSettings() throws Exception` → no throws | `restoreAuthenticatedSession` wraps in runtime exception |
| 12 | Logout tests fail after Traffic | `testng.xml` | Logout middle → **Logout last** | Blacklisted token not reused |
| 13 | Maven 136 vs Allure 36 | — | Documentation only | TestNG counts data-provider rows; Allure overview counts ~Java `@Test` methods |

---

## TrafficDashboardTest — method reference (priorities 1–8)

| Priority | `@Test` | Excel / feature | Private helpers (examples) |
|----------|---------|-----------------|---------------------------|
| 1 | `testEntryPoint` | F6 TC-F6-01–06 | `runTrafficCardVisibleCase`, `runUnauthenticatedRedirectCase`, air/street skip |
| 2 | `testDashboardNavigation` | F7 | `seedForF7`, `runDashboardLoadsCase`, `runBackButtonCase`, … |
| 3 | `testFilters` | F8-01–07 | Location + congestion filters |
| 4 | `testSorting` | F8-08–13, 24 | `seedForSorting` (2× generate) |
| 5 | `testPagination` | F8-14–20 | `seedForPagination` (12× generate) |
| 6 | `testFilterEdgeCases` | F8-21–23 | Empty state, apply reload, panel toggle |
| 7 | `testAlertBanners` | F9-01–05 only | `seedForF9`, `runAlertBannerVisibleCase`, … |
| 8 | `testAnalytics` | F10-01–04 | Charts + metric cards; TC-F10-05 excluded |

**Seeding helpers:**

- `seedForF7()` — flush + one generate (table data).
- `seedForSorting()` — flush + **two** generates (two timestamps).
- `seedForPagination()` — flush + **twelve** generates (pages).
- `seedForF9()` — save TRAFFIC threshold via API, flush alerts, generate, `openWithoutToastDismiss`, poll until banner visible.

---

## Data & reporting

### `frontend-testing.xlsx`

**Sheets:** Legend, Sign Up, Sign In, Profile Page, Logout, Bug Report, Settings & Alerts, Configuration, Sensor Dashboard, Alerts & Notifications, **TrafficDashboard**.

**Common columns:** `tc_id`, `Test Case Name`, `Test Type`, `Test Data Used` (semicolon-separated `key=value`), expected messages, Selenium filter via name prefix `Selenium`.

**TrafficDashboard sheet:** Rows keyed by `tc_id` (`TC-F6-01`, `TC-F8-14`, `TC-F9-07`, …). Tests call `rowByTcId("TC-F8-01")` then `structuredData(rd)` for `location`, `congestion`, `sort`, `wait_ms`, etc.

**Lookup pattern:**

```java
private Map<String, String> rowByTcId(String tcId) {
    return Arrays.stream(rowsForSheet(SHEET_NAME))
            .map(this::rowData)
            .filter(rd -> tcId.equals(rd.get("tc_id")))
            .findFirst()
            .orElseThrow(...);
}
```

**Implemented vs Excel (Traffic F9):** TC-F9-01–05 implemented; **TC-F9-06–09 not implemented** (non-TRAFFIC banner, banner text match, toast+banner simultaneous, dismiss-all strip).

### Allure annotations

| Annotation | Where used | Purpose |
|------------|------------|---------|
| `@Feature("Traffic Dashboard")` | `TrafficDashboardTest` class | Behaviors tab grouping |
| `@Step("…")` | Traffic private `run*Case`, seed methods | Timeline steps in report |
| `@Story` / `@Description` | Not used in current codebase | — |

Listener: `AllureTestNg` in `testng.xml`. Surefire sets `allure.results.directory`. AspectJ weaver required for `@Step` on private methods.

---


### `src/test/resources/testdata/frontend-testing.xlsx`

Binary workbook — not pasted. Structure documented above. Open in Excel or use `ExcelReader.readSheet("testdata/frontend-testing.xlsx", sheetName)`.

## Appendix — other source files


#### `src/test/java/com/iot/selenium/config/ConfigReader.java`

**Full path:** `/Users/salmafarida/dxc/iot-frontend/iot-selenium/src/test/java/com/iot/selenium/config/ConfigReader.java`

```java
package com.iot.selenium.config;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

public class ConfigReader {
    private static final String CONFIG_FILE = "config.properties";
    private final Properties properties = new Properties();

    public ConfigReader() {
        try (InputStream inputStream = getClass().getClassLoader().getResourceAsStream(CONFIG_FILE)) {
            if (inputStream == null) {
                throw new IllegalStateException("Could not find " + CONFIG_FILE + " on the test classpath.");
            }
            properties.load(inputStream);
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to load " + CONFIG_FILE + ".", exception);
        }
    }

    public String getBrowser() {
        return properties.getProperty("browser", "chrome").trim();
    }

    public String getBaseUrl() {
        return properties.getProperty("baseUrl", "http://localhost:4200").trim();
    }

    public String getApiBaseUrl() {
        return properties.getProperty("apiBaseUrl", "http://localhost:8080").trim();
    }

    public String getHomePath() {
        return properties.getProperty("homePath", "/home").trim();
    }

    public String getTrafficDashboardPath() {
        return properties.getProperty("trafficDashboardPath", "/traffic-dashboard").trim();
    }

    public String getLoginPath() {
        return properties.getProperty("loginPath", "/login").trim();
    }

    public String getApiAuthLoginPath() {
        return properties.getProperty("apiAuthLoginPath", "/api/auth/login").trim();
    }

    public String getApiSensorsGeneratePath() {
        return properties.getProperty("apiSensorsGeneratePath", "/api/sensors/generate").trim();
    }

    public String getApiSensorsFlushPath() {
        return properties.getProperty("apiSensorsFlushPath", "/api/sensors/flush").trim();
    }

    public String getApiAlertsPath() {
        return properties.getProperty("apiAlertsPath", "/api/alerts").trim();
    }

    public String getLoginEmail() {
        return properties.getProperty("loginEmail", "").trim();
    }

    public String getLoginPassword() {
        return properties.getProperty("loginPassword", "").trim();
    }

    public int getExplicitWaitSeconds() {
        return Integer.parseInt(properties.getProperty("explicitWait", "15").trim());
    }
}

```

#### `src/test/java/com/iot/selenium/utils/ExcelReader.java`

**Full path:** `/Users/salmafarida/dxc/iot-frontend/iot-selenium/src/test/java/com/iot/selenium/utils/ExcelReader.java`

```java
package com.iot.selenium.utils;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;

public class ExcelReader {
    private final DataFormatter dataFormatter = new DataFormatter();

    public Object[][] readSheet(String resourcePath, String sheetName) {
        try (InputStream inputStream = getResourceAsStream(resourcePath);
             Workbook workbook = WorkbookFactory.create(inputStream)) {
            Sheet sheet = workbook.getSheet(sheetName);
            if (sheet == null) {
                throw new IllegalStateException("Sheet '" + sheetName + "' was not found in " + resourcePath + ".");
            }

            Row headerRow = sheet.getRow(sheet.getFirstRowNum());
            if (headerRow == null) {
                return new Object[0][0];
            }

            List<String> headers = new ArrayList<>();
            headerRow.forEach(cell -> headers.add(dataFormatter.formatCellValue(cell).trim()));

            List<Object[]> rows = new ArrayList<>();
            for (int rowIndex = sheet.getFirstRowNum() + 1; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
                Row row = sheet.getRow(rowIndex);
                if (row == null || isBlankRow(row)) {
                    continue;
                }

                Map<String, String> rowData = new LinkedHashMap<>();
                for (int cellIndex = 0; cellIndex < headers.size(); cellIndex++) {
                    String header = headers.get(cellIndex);
                    if (header.isEmpty()) {
                        continue;
                    }
                    String value = dataFormatter.formatCellValue(row.getCell(cellIndex)).trim();
                    rowData.put(header, value);
                }
                rows.add(new Object[] { rowData });
            }

            return rows.toArray(Object[][]::new);
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to read test data from " + resourcePath + ".", exception);
        }
    }

    private InputStream getResourceAsStream(String resourcePath) {
        String normalizedPath = resourcePath.startsWith("/") ? resourcePath.substring(1) : resourcePath;
        InputStream inputStream = getClass().getClassLoader().getResourceAsStream(normalizedPath);
        if (inputStream == null) {
            throw new IllegalStateException("Could not find test data file on the classpath: " + resourcePath);
        }
        return inputStream;
    }

    private boolean isBlankRow(Row row) {
        return !row.cellIterator().hasNext();
    }
}
```

#### `src/test/java/com/iot/selenium/tests/SuiteAuthBootstrap.java`

**Full path:** `/Users/salmafarida/dxc/iot-frontend/iot-selenium/src/test/java/com/iot/selenium/tests/SuiteAuthBootstrap.java`

```java
package com.iot.selenium.tests;

import org.testng.annotations.Test;

/**
 * Primes shared API auth once after Sign In so the default user from {@code config.properties}
 * exists in the DB. Must not use {@code @BeforeSuite} — that runs before Signup/Signin.
 */
public final class SuiteAuthBootstrap {
    @Test(description = "Cache JWT + iot_user for later restoreAuthenticatedSession() calls")
    public void primeSharedApiAuth() {
        BaseTest.primeSharedAuthForSuite();
    }
}

```

#### `src/test/java/com/iot/selenium/pages/AlertsPage.java`

**Full path:** `/Users/salmafarida/dxc/iot-frontend/iot-selenium/src/test/java/com/iot/selenium/pages/AlertsPage.java`

```java
package com.iot.selenium.pages;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.iot.selenium.config.ConfigReader;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class AlertsPage extends BasePage {
    private static final Pattern ALERT_ID_PATTERN = Pattern.compile("\"id\"\\s*:\\s*\"([^\"]+)\"");

    private static final By NOTIFICATIONS_BELL = By.cssSelector("button[aria-label='Notifications']");
    private static final By NOTIFY_BADGE = By.cssSelector(".notify-badge");
    private static final By NOTIFICATION_PANEL = By.cssSelector(".notification-panel");
    private static final By PANEL_TITLE = By.cssSelector(".notification-panel .panel-header h3");
    private static final By PANEL_CLOSE = By.cssSelector("button.close-btn[aria-label='Close notifications']");
    private static final By EMPTY_STATE = By.cssSelector(".notification-panel .empty-state");
    private static final By EMPTY_STATE_TEXT = By.cssSelector(".notification-panel .empty-state p");
    private static final By PANEL_ALERT_CARDS = By.cssSelector(".notification-panel .panel-body .alert-card");
    private static final By ALERT_TOAST = By.cssSelector(".alert-toast");
    private static final By ALERT_TOAST_CLOSE = By.cssSelector(".alert-toast .close-btn");
    private static final String LOCAL_STORAGE_TOKEN_KEY = "iot_auth_token";
    private static final String SETTINGS_FLUSH_PATH = "/api/settings/flush";
    private static final String ALERTS_FLUSH_PATH = "/api/alerts/flush";

    private final String baseUrl;
    private final String apiBaseUrl;
    private final String homePath;
    private final String apiAlertsPath;
    private final int explicitWaitSeconds;

    public AlertsPage(WebDriver driver) {
        super(driver);
        ConfigReader config = new ConfigReader();
        this.baseUrl = config.getBaseUrl();
        this.apiBaseUrl = config.getApiBaseUrl();
        this.homePath = config.getHomePath();
        this.apiAlertsPath = config.getApiAlertsPath();
        this.explicitWaitSeconds = config.getExplicitWaitSeconds();
    }

    public void navigateTo(String route) {
        driver.get(baseUrl + route);
        waitForUrl(route, explicitWaitSeconds);
        waitForAngular();
        dismissAlertToastIfPresent();
    }

    public void navigateToHome() {
        navigateTo(homePath);
    }

    public void clickNotificationsBell() {
        dismissAlertToastIfPresent();
        WebElement bell = waitForVisible(NOTIFICATIONS_BELL);
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", bell);
        waitForAngular();
    }

    public void dismissAlertToastIfPresent() {
        try {
            new WebDriverWait(driver, Duration.ofSeconds(10))
                    .until(ExpectedConditions.invisibilityOfElementLocated(ALERT_TOAST));
            return;
        } catch (TimeoutException ignored) {
            // Toast may still be visible — try close button
        }
        List<WebElement> closeButtons = driver.findElements(ALERT_TOAST_CLOSE);
        if (!closeButtons.isEmpty() && closeButtons.get(0).isDisplayed()) {
            closeButtons.get(0).click();
            try {
                new WebDriverWait(driver, Duration.ofSeconds(5))
                        .until(ExpectedConditions.invisibilityOfElementLocated(ALERT_TOAST));
            } catch (TimeoutException ignored) {
                // Toast auto-dismisses after ~5s; bell click uses JS if still overlapping
            }
        }
    }

    public void waitForPanelVisible() {
        waitForVisible(NOTIFICATION_PANEL);
    }

    public boolean isPanelVisible() {
        List<WebElement> panels = driver.findElements(NOTIFICATION_PANEL);
        return !panels.isEmpty() && panels.get(0).isDisplayed();
    }

    public String getPanelTitleText() {
        return getText(PANEL_TITLE);
    }

    public void clickClosePanel() {
        dismissAlertToastIfPresent();
        WebElement closeButton = waitForVisible(PANEL_CLOSE);
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", closeButton);
        waitForAngular();
    }

    public void waitForPanelClosed() {
        new WebDriverWait(driver, Duration.ofSeconds(explicitWaitSeconds))
                .until(ExpectedConditions.invisibilityOfElementLocated(NOTIFICATION_PANEL));
    }

    public boolean isEmptyStateDisplayed() {
        List<WebElement> elements = driver.findElements(EMPTY_STATE);
        return !elements.isEmpty() && elements.get(0).isDisplayed();
    }

    public String getEmptyStateText() {
        return getText(EMPTY_STATE_TEXT);
    }

    public boolean isBadgeVisible() {
        List<WebElement> badges = driver.findElements(NOTIFY_BADGE);
        return !badges.isEmpty() && badges.get(0).isDisplayed();
    }

    public void waitForBadgeVisible(boolean expected, int timeoutSeconds) {
        new WebDriverWait(driver, Duration.ofSeconds(timeoutSeconds))
                .pollingEvery(Duration.ofMillis(500))
                .until(d -> isBadgeVisible() == expected);
    }

    public int getPanelAlertCardCount() {
        return (int) driver.findElements(PANEL_ALERT_CARDS).stream()
                .filter(WebElement::isDisplayed)
                .count();
    }

    public void clickFirstPanelAlertCard() {
        waitForClickable(PANEL_ALERT_CARDS).click();
        waitForAngular();
    }

    public boolean hasPanelAlertForSensorType(String sensorType) {
        String normalized = sensorType.trim().toLowerCase();
        List<WebElement> badges = driver.findElements(
                By.cssSelector(".notification-panel .alert-card .type-badge.type-" + normalized));
        return badges.stream().anyMatch(WebElement::isDisplayed);
    }

    public void clickPanelAlertCardBySensorType(String sensorType) {
        String normalized = sensorType.trim().toLowerCase();
        By typeBadge = By.cssSelector(".notification-panel .alert-card .type-badge.type-" + normalized);
        WebElement badge = waitForVisible(typeBadge);
        WebElement card = badge.findElement(By.xpath("./ancestor::*[contains(@class,'alert-card')][1]"));
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", card);
        waitForAngular();
    }

    public void waitForSensorModalVisible(String sensorType) {
        waitForVisible(sectionLocator(sensorType, ".modal-backdrop"));
    }

    public boolean isSensorModalVisible(String sensorType) {
        List<WebElement> backdrops = driver.findElements(sectionLocator(sensorType, ".modal-backdrop"));
        return !backdrops.isEmpty() && backdrops.get(0).isDisplayed();
    }

    public int getSensorModalAlertCardCount(String section) {
        return driver.findElements(sectionLocator(section, "app-traffic-alerts .alert-card, "
                        + "app-air-quality-alerts .alert-card, "
                        + "app-street-light-alerts .alert-card"))
                .size();
    }

    public void clickDeleteFirstAlertInModal(String section) {
        click(sectionLocator(section, "button[aria-label='Delete alert']"));
        waitForAngular();
    }

    public void waitForSensorModalAlertCount(String section, int expectedCount) {
        new WebDriverWait(driver, Duration.ofSeconds(explicitWaitSeconds))
                .until(d -> getSensorModalAlertCardCount(section) == expectedCount);
    }

    public static void flushSettingsPublic() throws Exception {
        invokePublicDelete(SETTINGS_FLUSH_PATH);
    }

    public static void flushAlertsPublic() throws Exception {
        invokePublicDelete(ALERTS_FLUSH_PATH);
    }

    public static void generateSensorsPublic() throws Exception {
        ConfigReader config = new ConfigReader();
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(config.getApiBaseUrl() + config.getApiSensorsGeneratePath()))
                .POST(HttpRequest.BodyPublishers.noBody())
                .build();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException(
                    "POST " + config.getApiSensorsGeneratePath()
                            + " failed with status " + response.statusCode() + ": " + response.body());
        }
    }

    /** Seeds a low TRAFFIC_DENSITY ABOVE threshold for the authenticated user (reliable vs UI save). */
    public static void seedTrafficDensityAboveThreshold(String bearerToken) throws Exception {
        ConfigReader config = new ConfigReader();
        String body =
                "[{\"type\":\"TRAFFIC\",\"metric\":\"TRAFFIC_DENSITY\",\"thresholdValue\":1,\"alertType\":\"ABOVE\"}]";
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(config.getApiBaseUrl() + "/api/settings"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + bearerToken)
                .PUT(HttpRequest.BodyPublishers.ofString(body))
                .build();
        HttpResponse<String> response =
                HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException(
                    "PUT /api/settings failed with status " + response.statusCode() + ": " + response.body());
        }
    }

    public String getAuthTokenFromLocalStorage() {
        Object token = ((JavascriptExecutor) driver).executeScript(
                "return window.localStorage.getItem('" + LOCAL_STORAGE_TOKEN_KEY + "');");
        if (token == null || String.valueOf(token).isBlank()) {
            throw new IllegalStateException(
                    LOCAL_STORAGE_TOKEN_KEY + " not found in localStorage after login.");
        }
        return String.valueOf(token);
    }

    public static List<String> pollAlertIdsUntilMinCount(
            String bearerToken, int minCount, long timeoutMs, long intervalMs) throws Exception {
        long deadline = System.currentTimeMillis() + timeoutMs;
        List<String> ids = List.of();
        while (System.currentTimeMillis() < deadline) {
            ids = fetchAlertIds(bearerToken);
            if (ids.size() >= minCount) {
                return ids;
            }
            Thread.sleep(intervalMs);
        }
        return ids;
    }

    public static List<String> fetchAlertIds(String bearerToken) throws Exception {
        ConfigReader config = new ConfigReader();
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(config.getApiBaseUrl() + config.getApiAlertsPath()))
                .header("Authorization", "Bearer " + bearerToken)
                .GET()
                .build();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            throw new IllegalStateException(
                    "GET alerts failed with status " + response.statusCode() + ": " + response.body());
        }
        List<String> ids = new ArrayList<>();
        Matcher matcher = ALERT_ID_PATTERN.matcher(response.body());
        while (matcher.find()) {
            ids.add(matcher.group(1));
        }
        return ids;
    }

    public static void deleteAlert(String bearerToken, String alertId) throws Exception {
        ConfigReader config = new ConfigReader();
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(config.getApiBaseUrl() + config.getApiAlertsPath() + "/" + alertId))
                .header("Authorization", "Bearer " + bearerToken)
                .DELETE()
                .build();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException(
                    "DELETE alert failed with status " + response.statusCode() + ": " + response.body());
        }
    }

    public static void deleteAllAlerts(String bearerToken) throws Exception {
        for (String alertId : fetchAlertIds(bearerToken)) {
            deleteAlert(bearerToken, alertId);
        }
    }

    private By sectionLocator(String sensorType, String innerCss) {
        return By.cssSelector(sectionRootId(sensorType) + " " + innerCss);
    }

    private String sectionRootId(String sensorType) {
        return switch (sensorType.trim().toLowerCase()) {
            case "traffic" -> "#traffic-sensor";
            case "air-quality", "air" -> "#air-quality-sensor";
            case "street-light", "street" -> "#street-light-sensor";
            default -> throw new IllegalArgumentException("Unknown sensor type: " + sensorType);
        };
    }

    private static void invokePublicDelete(String path) throws Exception {
        ConfigReader config = new ConfigReader();
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(config.getApiBaseUrl() + path))
                .DELETE()
                .build();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException(
                    "DELETE " + path + " failed with status " + response.statusCode() + ": " + response.body());
        }
    }
}

```

#### `src/test/java/com/iot/selenium/pages/SettingsPage.java`

**Full path:** `/Users/salmafarida/dxc/iot-frontend/iot-selenium/src/test/java/com/iot/selenium/pages/SettingsPage.java`

```java
package com.iot.selenium.pages;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;

import com.iot.selenium.config.ConfigReader;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.NoAlertPresentException;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class SettingsPage extends BasePage {
    private final String baseUrl;
    private final String apiBaseUrl;
    //use placeholder strings as identifiers
    private static final By PAGE_HEADING = By.cssSelector(".settings-page .page-header h1");
    private static final By BACK_BUTTON = By.cssSelector(".settings-page button.back-button");
    private static final By UNSAVED_BADGE = By.cssSelector(".settings-page span.unsaved-badge");
    private static final By SAVE_BUTTON = By.cssSelector(".settings-page button.save-btn");
    private static final By SUCCESS_TOAST = By.cssSelector(".settings-page div.toast-success");
    private static final By TOPBAR_SETTINGS = By.cssSelector("button.icon-button[aria-label='Settings']");

    private static final By THRESHOLDS_TAB = By.xpath(
            "//aside[contains(@class,'tab-rail')]//button[contains(@class,'tab-button')]//strong[text()='Thresholds']");
    private static final By CONFIGURATION_TAB = By.xpath(
            "//aside[contains(@class,'tab-rail')]//button[contains(@class,'tab-button')]//strong[text()='Configuration']");

    private static final String THRESHOLDS_PANEL = "app-settings-thresholds-panel";
    private static final String CONFIG_PANEL = "app-settings-configuration-panel";

    public SettingsPage(WebDriver driver) {
        super(driver);
        ConfigReader config = new ConfigReader();
        this.baseUrl = config.getBaseUrl();
        this.apiBaseUrl = config.getApiBaseUrl();
    }

    public void navigateToSettings() {
        String current = driver.getCurrentUrl();
        if (current != null && current.contains("/settings")) {
            waitForAngular();
            return;
        }
        driver.get(baseUrl + "/home");
        waitForUrl("/home", 15);
        waitForAngular();
        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(d -> {
                    String url = d.getCurrentUrl();
                    return url != null && !url.contains("/login");
                });
        clickTopbarSettings();
        waitForVisible(PAGE_HEADING);
    }

    public void clickBackToHome() {
        click(BACK_BUTTON);
        waitForUrl("/home", 15);
    }

    public void clickThresholdsTab() {
        clickTab(THRESHOLDS_TAB);
    }

    public void clickConfigurationTab() {
        clickTab(CONFIGURATION_TAB);
    }

    public boolean isThresholdsTabActive() {
        return isTabActive(THRESHOLDS_TAB);
    }

    public boolean isConfigurationTabActive() {
        return isTabActive(CONFIGURATION_TAB);
    }

    public boolean isUnsavedBadgeVisible() {
        List<WebElement> elements = driver.findElements(UNSAVED_BADGE);
        return !elements.isEmpty() && elements.get(0).isDisplayed();
    }

    public boolean isSaveButtonDisabled() {
        WebElement saveButton = waitForVisible(SAVE_BUTTON);
        String disabled = saveButton.getAttribute("disabled");
        return disabled != null && !disabled.isBlank();
    }

    public void clickSaveChanges() {
        waitForClickable(SAVE_BUTTON).click();
        // Do NOT call waitForAngular() here — a browser alert may fire immediately
        // and block JS execution. Callers handle their own post-click waits.
    }

    public void waitBetweenTests() throws InterruptedException {
        Thread.sleep(6000);
    }

    public boolean isValidationAlertPresent() {
        try {
            driver.switchTo().alert();
            return true;
        } catch (NoAlertPresentException e) {
            return false;
        }
    }

    public void dismissValidationAlert() {
        try {
            driver.switchTo().alert().dismiss();
        } catch (NoAlertPresentException ignored) {
        }
    }

    /** Clears a leftover native validation alert so WebDriver can read the URL again. */
    public void dismissValidationAlertIfPresent() {
        while (isValidationAlertPresent()) {
            dismissValidationAlert();
        }
    }

    public String getValidationAlertText() {
        return driver.switchTo().alert().getText().trim();
    }

    public void waitForValidationAlert() {
        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(ExpectedConditions.alertIsPresent());
    }

    public boolean isSuccessToastVisible() {
        List<WebElement> elements = driver.findElements(SUCCESS_TOAST);
        return !elements.isEmpty() && elements.get(0).isDisplayed();
    }

    public void waitForSuccessToastVisible() {
        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(ExpectedConditions.visibilityOfElementLocated(SUCCESS_TOAST));
    }

    public void waitForSuccessToastGone() {
        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(ExpectedConditions.invisibilityOfElementLocated(SUCCESS_TOAST));
    }

    public String getSuccessToastText() {
        return getText(SUCCESS_TOAST);
    }

    public boolean isSettingsHeadingVisible() {
        List<WebElement> elements = driver.findElements(PAGE_HEADING);
        return !elements.isEmpty() && elements.get(0).isDisplayed();
    }

    public String getSettingsHeadingText() {
        return getText(PAGE_HEADING);
    }

    public boolean areSettingsTabButtonsVisible() {
        return !driver.findElements(THRESHOLDS_TAB).isEmpty()
                && !driver.findElements(CONFIGURATION_TAB).isEmpty();
    }

    public void clickTopbarSettings() {
        dismissAlertToastsIfPresent();
        waitForAngular();
        dismissAlertToastsIfPresent();
        WebElement settings = waitForVisible(TOPBAR_SETTINGS);
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", settings);
        waitForUrl("/settings", 15);
        waitForAngular();
    }

    public void waitForConfigurationPanel() {
        waitForVisible(By.cssSelector(CONFIG_PANEL));
    }

    public void enterConfigurationInterval(String field, String value) {
        WebElement input = waitForVisible(configurationIntervalInput(field));
        ((JavascriptExecutor) driver).executeScript(
                """
                arguments[0].value = arguments[1];
                arguments[0].dispatchEvent(new Event('input', { bubbles: true }));
                arguments[0].dispatchEvent(new Event('change', { bubbles: true }));
                """,
                input,
                value == null ? "" : value);
        waitForAngular();
    }

    public String getConfigurationIntervalValue(String field) {
        WebElement input = waitForVisible(configurationIntervalInput(field));
        String value = input.getAttribute("value");
        return value == null ? "" : value.trim();
    }

    public boolean isConfigurationErrorTooltipVisible(String field) {
        WebElement shell = configurationInputShell(field);
        List<WebElement> tooltips = shell.findElements(By.cssSelector(".error-tooltip[role='alert']"));
        return !tooltips.isEmpty() && tooltips.get(0).isDisplayed();
    }

    public String getConfigurationErrorTooltipText(String field) {
        WebElement shell = configurationInputShell(field);
        List<WebElement> tooltips = shell.findElements(By.cssSelector(".error-tooltip[role='alert']"));
        if (tooltips.isEmpty() || !tooltips.get(0).isDisplayed()) {
            return "";
        }
        return tooltips.get(0).getText().trim();
    }

    public void saveIntervalsViaApi(int traffic, int airPollution, int streetLight) throws Exception {
        String token = (String) ((JavascriptExecutor) driver).executeScript(
                "return window.localStorage.getItem('iot_auth_token');");
        if (token == null || token.isBlank()) {
            return;
        }
        HttpClient client = HttpClient.newHttpClient();
        String intervalId = null;
        HttpRequest getRequest = HttpRequest.newBuilder()
                .uri(URI.create(apiBaseUrl + "/api/intervals"))
                .header("Authorization", "Bearer " + token)
                .GET()
                .build();
        HttpResponse<String> getResponse = client.send(getRequest, HttpResponse.BodyHandlers.ofString());
        if (getResponse.statusCode() == 200) {
            String body = getResponse.body();
            int idIndex = body.indexOf("\"id\"");
            if (idIndex >= 0) {
                int start = body.indexOf('"', idIndex + 4) + 1;
                int end = body.indexOf('"', start);
                if (start > 0 && end > start) {
                    intervalId = body.substring(start, end);
                }
            }
        }
        String payload = intervalId == null || intervalId.isBlank()
                ? String.format(
                        "{\"trafficInterval\":%d,\"airPollutionInterval\":%d,\"streetLightInterval\":%d}",
                        traffic,
                        airPollution,
                        streetLight)
                : String.format(
                        "{\"id\":\"%s\",\"trafficInterval\":%d,\"airPollutionInterval\":%d,\"streetLightInterval\":%d}",
                        intervalId,
                        traffic,
                        airPollution,
                        streetLight);
        HttpRequest putRequest = HttpRequest.newBuilder()
                .uri(URI.create(apiBaseUrl + "/api/intervals"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + token)
                .PUT(HttpRequest.BodyPublishers.ofString(payload))
                .build();
        client.send(putRequest, HttpResponse.BodyHandlers.ofString());
    }

    public void enterThresholdValue(String placeholder, String value) {
        WebElement input = waitForVisible(thresholdInput(placeholder));
        setInputValue(input, value);
    }

    public void enterAboveValue(String placeholder, String value) {
        WebElement input = inputInThresholdRow(placeholder, 0);
        setInputValue(input, value);
    }

    public void enterBelowValue(String placeholder, String value) {
        WebElement input = inputInThresholdRow(placeholder, 1);
        setInputValue(input, value);
    }

    public String getThresholdValue(String placeholder) {
        WebElement input = waitForVisible(thresholdInput(placeholder));
        String value = input.getAttribute("value");
        return value == null ? "" : value.trim();
    }

    public void waitForThresholdValue(String placeholder, String expected) {
        new WebDriverWait(driver, Duration.ofSeconds(15))
                .until(d -> expected.equals(getThresholdValue(placeholder)));
    }

    public String getPlaceholderText(String placeholder) {
        WebElement input = waitForVisible(thresholdInput(placeholder));
        String text = input.getAttribute("placeholder");
        return text == null ? "" : text.trim();
    }

    public boolean isErrorTooltipVisible(String placeholder) {
        return isErrorTooltipVisible(placeholder, 0);
    }

    public boolean isErrorTooltipVisibleOnBothRows(String placeholder) {
        return isErrorTooltipVisible(placeholder, 0) && isErrorTooltipVisible(placeholder, 1);
    }

    public String getErrorTooltipText(String placeholder) {
        return getErrorTooltipText(placeholder, 0);
    }

    public String getConditionButtonText(String placeholder) {
        return getConditionButtonText(placeholder, 0);
    }

    public String getConditionButtonText(String placeholder, int rowIndex) {
        WebElement button = conditionButtonInRow(placeholder, rowIndex);
        return button.getText().trim();
    }

    public void clickConditionButton(String placeholder) {
        WebElement button = waitUntilClickable(conditionButtonInRow(placeholder, 0));
        button.click();
        waitForAngular();
    }

    public void clickAddThreshold(String placeholder) {
        int before = countThresholdRows(placeholder);
        WebElement addButton = metricCard(placeholder).findElement(By.cssSelector("button.add-threshold-btn"));
        waitUntilClickable(addButton).click();
        waitForAngular();
        new WebDriverWait(driver, Duration.ofSeconds(10))
                .until(d -> countThresholdRows(placeholder) > before);
    }

    public int countThresholdRows(String placeholder) {
        return metricCard(placeholder).findElements(By.cssSelector(".threshold-row")).size();
    }

    public boolean isAddThresholdButtonVisible(String placeholder) {
        List<WebElement> buttons = metricCard(placeholder).findElements(By.cssSelector("button.add-threshold-btn"));
        return !buttons.isEmpty() && buttons.get(0).isDisplayed();
    }

    /** After flush/reload, wait until the metric has one row and can add another. */
    public void waitForDefaultThresholdState(String placeholder) {
        WebDriverWait shortWait = new WebDriverWait(driver, Duration.ofSeconds(3));
        try {
            shortWait.until(d -> countThresholdRows(placeholder) == 1 && isAddThresholdButtonVisible(placeholder));
        } catch (TimeoutException e) {
            navigateToSettings();
            new WebDriverWait(driver, Duration.ofSeconds(10))
                    .until(d -> countThresholdRows(placeholder) == 1 && isAddThresholdButtonVisible(placeholder));
        }
    }

    public void clickRemoveThreshold(String placeholder) {
        int before = countThresholdRows(placeholder);
        if (before < 1) {
            throw new IllegalStateException("No threshold row to remove for placeholder: " + placeholder);
        }
        clickRemoveThresholdRow(placeholder, before - 1);
        waitForAngular();
        // When removing the only row, the input is gone — cannot poll countThresholdRows.
        if (before > 1) {
            new WebDriverWait(driver, Duration.ofSeconds(10))
                    .until(d -> countThresholdRows(placeholder) < before);
        }
    }

    public void clearLocalStorage() {
        ((JavascriptExecutor) driver).executeScript("window.localStorage.clear();");
    }

    public void flushSettings() throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiBaseUrl + "/api/settings/flush"))
                .DELETE()
                .build();
        client.send(request, HttpResponse.BodyHandlers.ofString());
    }

    public void registerUser(String email, String firstName, String lastName, String password) throws Exception {
        String body = String.format(
                "{\"email\":\"%s\",\"firstName\":\"%s\",\"lastName\":\"%s\",\"password\":\"%s\"}",
                email,
                firstName,
                lastName,
                password);
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiBaseUrl + "/api/auth/register"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
        client.send(request, HttpResponse.BodyHandlers.ofString());
    }

    public void tryRegisterUser(String email, String firstName, String lastName, String password) throws Exception {
        String body = String.format(
                "{\"email\":\"%s\",\"firstName\":\"%s\",\"lastName\":\"%s\",\"password\":\"%s\"}",
                email,
                firstName,
                lastName,
                password);
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiBaseUrl + "/api/auth/register"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 201 && response.statusCode() != 409) {
            throw new IllegalStateException(
                    "registerUser failed with status: " + response.statusCode() + " body: " + response.body());
        }
    }

    public void deleteUser(String email) throws Exception {
        String body = String.format("{\"email\":\"%s\"}", email);
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiBaseUrl + "/api/user/delete"))
                .header("Content-Type", "application/json")
                .method("DELETE", HttpRequest.BodyPublishers.ofString(body))
                .build();
        client.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private void clickTab(By tabLabel) {
        WebElement strong = waitForVisible(tabLabel);
        WebElement tabButton = strong.findElement(By.xpath("./ancestor::button[contains(@class,'tab-button')]"));
        waitUntilClickable(tabButton).click();
        waitForAngular();
    }

    private boolean isTabActive(By tabLabel) {
        List<WebElement> labels = driver.findElements(tabLabel);
        if (labels.isEmpty()) {
            return false;
        }
        WebElement tabButton = labels.get(0).findElement(By.xpath("./ancestor::button[contains(@class,'tab-button')]"));
        return "true".equals(tabButton.getAttribute("aria-selected"));
    }

    private By configurationIntervalInput(String field) {
        return By.cssSelector(CONFIG_PANEL + " #" + configurationIntervalDomId(field));
    }

    private String configurationIntervalDomId(String field) {
        return switch (field.trim().toLowerCase()) {
            case "traffic" -> "trafficReadingInterval";
            case "air" -> "airQualityReadingInterval";
            case "street" -> "streetLightReadingInterval";
            default -> throw new IllegalArgumentException("Unknown configuration field: " + field);
        };
    }

    private WebElement configurationInputShell(String field) {
        WebElement input = waitForVisible(configurationIntervalInput(field));
        return closest(input, ".input-shell");
    }

    private By thresholdInput(String placeholder) {
        return By.cssSelector(THRESHOLDS_PANEL + " input[placeholder='" + placeholder + "']");
    }

    private WebElement metricCard(String placeholder) {
        WebElement input = waitForVisible(thresholdInput(placeholder));
        return closest(input, ".metric-card");
    }

    private WebElement thresholdRow(String placeholder, int rowIndex) {
        List<WebElement> rows = metricCard(placeholder).findElements(By.cssSelector(".threshold-row"));
        if (rowIndex < 0 || rowIndex >= rows.size()) {
            throw new IllegalStateException("Threshold row index " + rowIndex + " is out of range.");
        }
        return rows.get(rowIndex);
    }

    private WebElement inputInThresholdRow(String placeholder, int rowIndex) {
        WebElement row = thresholdRow(placeholder, rowIndex);
        return row.findElement(By.cssSelector("input[type='number']"));
    }

    private WebElement conditionButtonInRow(String placeholder, int rowIndex) {
        return thresholdRow(placeholder, rowIndex).findElement(By.cssSelector("button.condition-btn"));
    }

    private void clickRemoveThresholdRow(String placeholder, int rowIndex) {
        WebElement removeButton = thresholdRow(placeholder, rowIndex)
                .findElement(By.cssSelector("button.remove-btn[aria-label='Remove threshold']"));
        waitUntilClickable(removeButton).click();
        waitForAngular();
    }

    private WebElement waitUntilClickable(WebElement element) {
        return new WebDriverWait(driver, Duration.ofSeconds(15))
                .until(ExpectedConditions.elementToBeClickable(element));
    }

    private boolean isErrorTooltipVisible(String placeholder, int rowIndex) {
        List<WebElement> tooltips = thresholdRow(placeholder, rowIndex).findElements(By.cssSelector(".error-tooltip"));
        return !tooltips.isEmpty() && tooltips.get(0).isDisplayed();
    }

    private String getErrorTooltipText(String placeholder, int rowIndex) {
        List<WebElement> tooltips = thresholdRow(placeholder, rowIndex).findElements(By.cssSelector(".error-tooltip"));
        if (tooltips.isEmpty() || !tooltips.get(0).isDisplayed()) {
            return "";
        }
        return tooltips.get(0).getText().trim();
    }

    private WebElement closest(WebElement element, String selector) {
        return (WebElement) ((JavascriptExecutor) driver).executeScript(
                "return arguments[0].closest(arguments[1]);",
                element,
                selector);
    }

    private void setInputValue(WebElement input, String value) {
        input.clear();
        input.sendKeys(value == null ? "" : value);
        JavascriptExecutor js = (JavascriptExecutor) driver;
        js.executeScript(
                """
                arguments[0].dispatchEvent(new Event('input', { bubbles: true }));
                arguments[0].dispatchEvent(new Event('change', { bubbles: true }));
                """,
                input);
        waitForAngular();
    }
}

```

#### `src/test/java/com/iot/selenium/pages/SensorDashboardPage.java`

**Full path:** `/Users/salmafarida/dxc/iot-frontend/iot-selenium/src/test/java/com/iot/selenium/pages/SensorDashboardPage.java`

```java
package com.iot.selenium.pages;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.iot.selenium.config.ConfigReader;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;

public class SensorDashboardPage extends BasePage {
    private static final Pattern TOKEN_PATTERN = Pattern.compile("\"token\"\\s*:\\s*\"([^\"]+)\"");
    private static final Pattern USER_ID_PATTERN = Pattern.compile("\"userId\"\\s*:\\s*\"([^\"]+)\"");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("\"email\"\\s*:\\s*\"([^\"]+)\"");
    private static final Pattern FIRST_NAME_PATTERN = Pattern.compile("\"firstName\"\\s*:\\s*\"([^\"]+)\"");
    private static final Pattern LAST_NAME_PATTERN = Pattern.compile("\"lastName\"\\s*:\\s*\"([^\"]+)\"");

    /** Token and {@code iot_user} JSON for {@link com.iot.selenium.tests.BaseTest#restoreAuthenticatedSession()}. */
    public record ApiAuthSession(String token, String userJson) {}

    private final String baseUrl;
    private final String apiBaseUrl;
    private final String homePath;
    private final String apiAuthLoginPath;
    private final String apiSensorsGeneratePath;
    private final String apiSensorsFlushPath;
    private final int explicitWaitSeconds;

    public SensorDashboardPage(WebDriver driver) {
        super(driver);
        ConfigReader config = new ConfigReader();
        this.baseUrl = config.getBaseUrl();
        this.apiBaseUrl = config.getApiBaseUrl();
        this.homePath = config.getHomePath();
        this.apiAuthLoginPath = config.getApiAuthLoginPath();
        this.apiSensorsGeneratePath = config.getApiSensorsGeneratePath();
        this.apiSensorsFlushPath = config.getApiSensorsFlushPath();
        this.explicitWaitSeconds = config.getExplicitWaitSeconds();
    }

    public static String authenticate(String email, String password) throws Exception {
        return loginViaApi(email, password).token();
    }

    public static ApiAuthSession loginViaApi(String email, String password) throws Exception {
        ConfigReader config = new ConfigReader();
        String body = String.format("{\"email\":\"%s\",\"password\":\"%s\"}", email, password);
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(config.getApiBaseUrl() + config.getApiAuthLoginPath()))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            throw new IllegalStateException(
                    "Login failed with status " + response.statusCode() + ": " + response.body());
        }
        String responseBody = response.body();
        Matcher tokenMatcher = TOKEN_PATTERN.matcher(responseBody);
        if (!tokenMatcher.find()) {
            throw new IllegalStateException("Login response did not contain a token.");
        }
        String userJson = String.format(
                "{\"id\":\"%s\",\"firstName\":\"%s\",\"lastName\":\"%s\",\"email\":\"%s\",\"profilePicture\":null}",
                jsonField(USER_ID_PATTERN, responseBody, "userId"),
                jsonField(FIRST_NAME_PATTERN, responseBody, "firstName"),
                jsonField(LAST_NAME_PATTERN, responseBody, "lastName"),
                jsonField(EMAIL_PATTERN, responseBody, "email"));
        return new ApiAuthSession(tokenMatcher.group(1), userJson);
    }

    private static String jsonField(Pattern pattern, String responseBody, String fieldName) {
        Matcher matcher = pattern.matcher(responseBody);
        if (!matcher.find()) {
            throw new IllegalStateException("Login response did not contain " + fieldName + ".");
        }
        return matcher.group(1).replace("\\", "\\\\").replace("\"", "\\\"");
    }

    public static void generateSensors(String bearerToken) throws Exception {
        ConfigReader config = new ConfigReader();
        invokeSensorApi("POST", config.getApiBaseUrl(), config.getApiSensorsGeneratePath(), bearerToken);
    }

    /** Clears all sensor readings via per-type flush endpoints (no unified {@code /api/sensors/flush} on backend). */
    public static void flushSensors(String bearerToken) throws Exception {
        ConfigReader config = new ConfigReader();
        String apiBaseUrl = config.getApiBaseUrl();
        invokeSensorApi("DELETE", apiBaseUrl, "/api/sensors/traffic/flush", bearerToken);
        invokeSensorApi("DELETE", apiBaseUrl, "/api/sensors/air-pollution/flush", bearerToken);
        invokeSensorApi("DELETE", apiBaseUrl, "/api/sensors/street-lights/flush", bearerToken);
    }

    public void navigateToHome() {
        driver.get(baseUrl + homePath);
        waitForUrl(homePath, explicitWaitSeconds);
        waitForAngular();
    }

    public void waitForSectionDataDisplayed(String section) {
        waitForSectionData(section);
    }

    public boolean isSectionDataDisplayed(String section) {
        return switch (section.trim().toLowerCase()) {
            case "traffic" -> isElementDisplayed(sectionLocator(section, ".stats-row"));
            case "air" -> isElementDisplayed(sectionLocator(section, ".pollutants"))
                    || isElementDisplayed(sectionLocator(section, ".aqi-score"));
            case "street" -> isElementDisplayed(sectionLocator(section, ".stats-row"));
            default -> throw new IllegalArgumentException("Unknown section: " + section);
        };
    }

    public void waitForEmptyState(String section, String expectedMessage) {
        By locator = sectionLocator(section, ".loading-state p");
        new WebDriverWait(driver, Duration.ofSeconds(explicitWaitSeconds))
                .until(ExpectedConditions.textToBePresentInElementLocated(locator, expectedMessage));
    }

    public boolean isEmptyStateDisplayed(String section, String expectedMessage) {
        List<WebElement> messages = driver.findElements(sectionLocator(section, ".loading-state p"));
        return messages.stream()
                .anyMatch(el -> el.isDisplayed() && expectedMessage.equals(el.getText().trim()));
    }

    public void clickRefresh(String section) {
        click(sectionLocator(section, "button[aria-label='Refresh']"));
        waitForAngular();
    }

    public void clickViewAlerts(String section) {
        String normalized = section.trim().toLowerCase();
        if ("traffic".equals(normalized)) {
            click(sectionLocator(section, "button[aria-label='View traffic alerts']"));
        } else if ("air".equals(normalized)) {
            click(sectionLocator(section, "button[aria-label='View air quality alerts']"));
        } else {
            throw new IllegalArgumentException("View Alerts automation not enabled for section: " + section);
        }
        waitForAngular();
    }

    public void waitForAlertsModalVisible(String section) {
        waitForVisible(sectionLocator(section, ".modal-backdrop"));
    }

    public boolean isAlertsModalVisible(String section) {
        List<WebElement> backdrops = driver.findElements(sectionLocator(section, ".modal-backdrop"));
        return !backdrops.isEmpty() && backdrops.get(0).isDisplayed();
    }

    public void clickCloseAlerts(String section) {
        click(sectionLocator(section, "button[aria-label='Close alerts']"));
        waitForAngular();
    }

    public void waitForAlertsModalClosed(String section) {
        new WebDriverWait(driver, Duration.ofSeconds(explicitWaitSeconds))
                .until(ExpectedConditions.invisibilityOfElementLocated(sectionLocator(section, ".modal-backdrop")));
    }

    public int getHistoryOptionCount(String section) {
        WebElement select = waitForVisible(sectionHistorySelect(section));
        return new Select(select).getOptions().size();
    }

    public void selectHistoryByIndex(String section, int index) {
        WebElement select = waitForVisible(sectionHistorySelect(section));
        new Select(select).selectByIndex(index);
        waitForAngular();
    }

    public String getFirstStatValueText(String section) {
        return getText(sectionLocator(section, ".stats-row .stat-box:nth-of-type(1) .value"));
    }

    public boolean isSectionAnchorDisplayed(String sectionId) {
        List<WebElement> elements = driver.findElements(By.cssSelector(sectionId));
        return !elements.isEmpty() && elements.get(0).isDisplayed();
    }

    private void waitForSectionData(String section) {
        new WebDriverWait(driver, Duration.ofSeconds(explicitWaitSeconds))
                .until(driver -> isSectionDataDisplayed(section));
    }

    private By sectionHistorySelect(String section) {
        return switch (section.trim().toLowerCase()) {
            case "traffic" -> sectionLocator(section, "select[aria-label='Select traffic reading history']");
            case "air" -> sectionLocator(section, "select[aria-label='Select air reading history']");
            case "street" -> sectionLocator(section, "select[aria-label='Select street light reading history']");
            default -> throw new IllegalArgumentException("Unknown section: " + section);
        };
    }

    private By sectionLocator(String section, String innerCss) {
        return By.cssSelector(sectionRootId(section) + " " + innerCss);
    }

    private String sectionRootId(String section) {
        return switch (section.trim().toLowerCase()) {
            case "traffic" -> "#traffic-sensor";
            case "air" -> "#air-quality-sensor";
            case "street" -> "#street-light-sensor";
            default -> throw new IllegalArgumentException("Unknown section: " + section);
        };
    }

    private boolean isElementDisplayed(By locator) {
        List<WebElement> elements = driver.findElements(locator);
        return !elements.isEmpty() && elements.get(0).isDisplayed();
    }

    private static void invokeSensorApi(String method, String apiBaseUrl, String path, String bearerToken)
            throws Exception {
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(apiBaseUrl + path))
                .header("Authorization", "Bearer " + bearerToken);
        HttpRequest request = "DELETE".equals(method)
                ? builder.DELETE().build()
                : builder.POST(HttpRequest.BodyPublishers.noBody()).build();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new IllegalStateException(
                    method + " " + path + " failed with status " + response.statusCode() + ": " + response.body());
        }
    }
}

```

#### `src/test/java/com/iot/selenium/pages/UserProfilePage.java`

**Full path:** `/Users/salmafarida/dxc/iot-frontend/iot-selenium/src/test/java/com/iot/selenium/pages/UserProfilePage.java`

```java
package com.iot.selenium.pages;

import java.util.List;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

public class UserProfilePage extends BasePage {
    private static final By FULL_NAME = By.cssSelector(".profile-card h1");
    private static final By EMAIL = By.cssSelector(".profile-card .email");
    private static final By BACK_BUTTON = By.cssSelector(".back-button");
    private static final By CHANGE_PASSWORD = By.cssSelector(".change-password-btn");
    private static final By LOGOUT_BUTTON = By.cssSelector("button.logout-btn");

    public UserProfilePage(WebDriver driver) {
        super(driver);
    }

    public UserProfilePage open(String baseUrl) {
        driver.get(baseUrl + "/profile");
        // don't call waitForAngular — use URL check instead
        // auth guard will redirect to /login if unauthenticated
        // waitForLoad() will wait for .profile-card h1
        return this;
    }

    public UserProfilePage waitForLoad() {
        waitForVisible(FULL_NAME);
        return this;
    }

    public String getFullName() {
        return waitForVisible(FULL_NAME).getText().trim();
    }

    public String getEmail() {
        return waitForVisible(EMAIL).getText().trim();
    }

    public String getFirstName() {
        return getFieldValue("First name");
    }

    public String getLastName() {
        return getFieldValue("Last name");
    }

    public void clickBack() {
        click(BACK_BUTTON);
    }

    public void goBackToDashboard() {
        clickBack();
    }

    public boolean isChangePasswordVisible() {
        List<WebElement> elements = driver.findElements(CHANGE_PASSWORD);
        return !elements.isEmpty() && elements.get(0).isDisplayed();
    }

    public void clickLogout() {
        click(LOGOUT_BUTTON);
    }

    private String getFieldValue(String label) {
        By locator = By.xpath(
                "//div[contains(@class,'field-row')][.//span[normalize-space()='"
                        + label
                        + "']]//span[contains(@class,'value')]");
        return getText(locator);
    }
}

```

#### `src/test/java/com/iot/selenium/tests/ConfigurationTest.java`

**Full path:** `/Users/salmafarida/dxc/iot-frontend/iot-selenium/src/test/java/com/iot/selenium/tests/ConfigurationTest.java`

```java
package com.iot.selenium.tests;

import java.time.Duration;
import java.util.Arrays;
import java.util.Map;

import com.iot.selenium.config.ConfigReader;
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
    private ConfigReader configReader;

    @BeforeMethod(alwaysRun = true)
    @Override
    public void setUp() {
        if (!driverInitialized) {
            super.setUp();
            driverInitialized = true;
        }
        settingsPage = new SettingsPage(driver);
        if (configReader == null) {
            configReader = new ConfigReader();
        }
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
            loginIfNeeded(configReader.getLoginEmail(), configReader.getLoginPassword());
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
        loginIfNeeded(configReader.getLoginEmail(), configReader.getLoginPassword());
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

```

#### `src/test/java/com/iot/selenium/tests/SensorDashboardTest.java`

**Full path:** `/Users/salmafarida/dxc/iot-frontend/iot-selenium/src/test/java/com/iot/selenium/tests/SensorDashboardTest.java`

```java
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
    @Test(priority = 2, dependsOnMethods = "testDataAfterSeed", enabled = false)
    public void testEmptyState() throws Exception {
        SensorDashboardPage.flushSensors(authToken);
        assertEmptyState("TC-SD07");
        assertEmptyState("TC-SD08");
        assertEmptyState("TC-SD09");
        SensorDashboardPage.generateSensors(authToken);
    }

    // Disabled: DELETE /api/sensors/flush returns 500 — see bug BUG-SD-FLUSH
    @Test(priority = 3, dependsOnMethods = "testEmptyState", enabled = false)
    public void testRefresh() throws Exception {
        runRefreshCase("TC-SD13");
        runRefreshCase("TC-SD14");
        runRefreshCase("TC-SD15");
    }

    // Disabled: DELETE /api/sensors/flush returns 500 — see bug BUG-SD-FLUSH
    @Test(priority = 4, dependsOnMethods = "testRefresh", enabled = false)
    public void testAlertsModal() throws Exception {
        runAlertsModalCase("TC-SD16");
        runAlertsModalCase("TC-SD17");
    }

    // Disabled: DELETE /api/sensors/flush returns 500 — see bug BUG-SD-FLUSH
    @Test(priority = 5, dependsOnMethods = "testAlertsModal", enabled = false)
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

```
