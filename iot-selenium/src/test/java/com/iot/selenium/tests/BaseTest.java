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
