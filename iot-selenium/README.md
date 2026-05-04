# IoT Selenium Test Suite

This project is a Maven-based Selenium Java test suite for the IoT Angular frontend in `iot-frontend`.

## Purpose

The goal of this project is to keep Selenium tests clean, data-driven, and separated from the UI details of the Angular app.

- Test data comes from Excel files in `src/test/resources/testdata/`.
- Browser setup and teardown live in a shared base class.
- UI selectors live only in page objects, never in test classes.
- Test classes focus on behavior and assertions, not DOM details.

## What is included

- TestNG test execution with a fixed run order
- Page Object Model with separate page classes
- Excel-driven test data via Apache POI
- WebDriver setup and teardown through WebDriverManager
- A BasePage with explicit waits and an Angular-aware wait helper
- Config-driven browser, base URL, and implicit wait settings

## Project layout

```text
src/test/java/com/iot/selenium/
├── config/
│   └── ConfigReader.java
├── pages/
│   ├── BasePage.java
│   ├── DashboardPage.java
│   ├── SigninPage.java
│   ├── SignupPage.java
│   └── UserProfilePage.java
├── tests/
│   ├── BaseTest.java
│   ├── DashboardTest.java
│   ├── SigninTest.java
│   ├── SignupTest.java
│   └── UserProfileTest.java
└── utils/
	└── ExcelReader.java

src/test/resources/
├── config.properties
├── testng.xml
└── testdata/
	└── frontend-testing.xlsx
```

### Where to write new tests

Put new Selenium test classes in `src/test/java/com/iot/selenium/tests/`.

- Create a new class that extends `BaseTest`.
- Add one or more `@DataProvider` methods if the test needs Excel data.
- Keep assertions in the test class and keep locators out of it.

If you add a new UI area, add a matching page object in `src/test/java/com/iot/selenium/pages/` first, then write the test against that page object.

### What each package does

- `config`: loads runtime settings like browser and base URL from `config.properties`.
- `pages`: contains the Page Object Model classes.
- `tests`: contains the actual TestNG test cases.
- `utils`: contains helpers like the Excel reader.

## Prerequisites

- Java 17 or newer
- Maven 3.9+
- The Angular app running locally at `http://localhost:4200`
- A browser installed for the selected WebDriver

## Install and setup

Run these once before executing the Selenium suite.

### 1. Frontend dependencies (`npm`)

From the `iot-frontend` folder:

```bash
npm install
npm start
```

This installs Angular dependencies and starts the app at `http://localhost:4200`.

### 2. Java/Maven toolchain check

From any terminal:

```bash
java -version
mvn -version
```

If these commands fail, install Java 17+ and Maven 3.9+ first.

### 3. Selenium project dependencies (Maven)

From the `iot-selenium` folder:

```bash
mvn -q -DskipTests test-compile
```

This resolves Selenium/TestNG/POI/WebDriverManager dependencies and compiles tests.

### 4. Optional Python `.venv` for workbook scripting

Only needed if you want to edit or inspect `frontend-testing.xlsx` with Python scripts.

From the workspace root (`Frontend`):

```bash
python -m venv .venv
.venv\Scripts\activate
pip install openpyxl
```

This is optional for test execution. The Selenium suite itself runs with Java + Maven.

## Configure test data

The workbook already exists at `src/test/resources/testdata/frontend-testing.xlsx` and keeps the original QA traceability sheets:

- `Sign Up`
- `Sign In`
- `Profile Page`


The Selenium suite reads the existing QA sheets directly:

- `SigninTest` and `DashboardTest` read from `Sign In`
- `UserProfileTest` reads from `Profile Page`

The rows the suite uses are the ones whose `Test Case Name` starts with `Selenium`.

For those rows, the runtime values come from the existing `Test Data Used` column as `key=value` pairs separated by semicolons. That lets the suite keep using your current workbook structure without extra helper sheets.

## TestNG annotations used

The suite uses a small, standard set of TestNG annotations:

- `@Test` marks a method as a test case.
- `@DataProvider` supplies Excel rows to a test method.
- `@BeforeMethod` in `BaseTest` creates a fresh browser before each test method.
- `@AfterMethod` in `BaseTest` closes the browser after each test method.

The important idea is that the `@DataProvider` methods read the Excel file and return `Object[][]`, while the actual `@Test` method receives a `Map<String, String>` for each row.

## Page Object Model

Page Object Model means each screen gets its own class that owns the locators and the low-level actions for that screen.

In this project:

- [BasePage.java](src/test/java/com/iot/selenium/pages/BasePage.java) contains the shared Selenium helpers and waits.
- [SigninPage.java](src/test/java/com/iot/selenium/pages/SigninPage.java) owns the login form locators and actions.
- [SignupPage.java](src/test/java/com/iot/selenium/pages/SignupPage.java) owns the signup form locators and actions.
- [DashboardPage.java](src/test/java/com/iot/selenium/pages/DashboardPage.java) owns the home/dashboard locators and actions.
- [UserProfilePage.java](src/test/java/com/iot/selenium/pages/UserProfilePage.java) owns the profile screen locators and actions.

The tests call methods like `login()`, `openProfile()`, and `goBackToDashboard()` instead of interacting with raw Selenium selectors.

## Locators and frontend mapping

Locators are the Selenium selectors that point to HTML elements on the Angular frontend. In this project they are stored as private `By` fields inside the page objects.

Examples from the current implementation:

- `SigninPage` maps to the login form on `/login`.
	- `By.id("email")` targets the email input.
	- `By.id("password")` targets the password input.
	- `By.cssSelector("button[type='submit']")` targets the sign-in button.
	- `By.cssSelector(".error-message")` targets the login error message.

- `SignupPage` maps to the signup form on `/signup`.
	- `By.id("email")` targets the email input.
	- `By.id("firstName")` targets the first name input.
	- `By.id("lastName")` targets the last name input.
	- `By.id("password")` targets the password input.
	- `By.id("confirmPassword")` targets the confirm password input.
	- `By.cssSelector(".error-message")` targets the signup error message.

- `DashboardPage` maps to the home page on `/home`.
	- `By.cssSelector(".hero h1")` targets the greeting title.
	- `By.cssSelector(".avatar-button")` targets the profile/avatar button.
	- `By.cssSelector(".refresh-notice")` targets any refresh warning shown on the dashboard.

- `UserProfilePage` maps to the profile screen on `/profile`.
	- `By.cssSelector(".profile-card h1")` targets the user’s full name.
	- `By.cssSelector(".profile-card .email")` targets the email display.
	- `By.cssSelector(".back-button")` targets the back button.
	- `By.cssSelector(".change-password-btn")` targets the change-password action.

These locators are the exact parts that tie the Selenium suite to the frontend DOM. If the Angular markup changes, update the locator in the page object, not in the tests.

The tests themselves never touch Selenium locators. They only call page-object methods such as `login()`, `openProfile()`, `getGreetingText()`, and `goBackToDashboard()`.

## Existing test classes

The current suite includes these test classes:

- `SignupTest`: verifies successful registration.
- `SigninTest`: verifies successful login and invalid credential handling.
- `DashboardTest`: verifies the dashboard greeting and navigation to profile.
- `UserProfileTest`: verifies profile data and back-navigation to the dashboard.

These tests read the workbook rows through `@DataProvider` methods in each class.

If you need to add another page later, follow the same pattern: create a page object first, then create a test class that uses it.

## Configure the app connection

Update `src/test/resources/config.properties` if needed:

```properties
browser=chrome
baseUrl=http://localhost:4200
implicitWait=10
```

Supported browsers:

- `chrome`
- `edge`
- `firefox`

## Run the suite

From the `iot-selenium` folder:

```bash
mvn test
```

This runs the TestNG suite defined in `src/test/resources/testng.xml` in this order:

1. `SignupTest`
2. `SigninTest`
3. `DashboardTest`
4. `UserProfileTest`

## Run a single suite file

You can also run TestNG directly from Maven by editing `src/test/resources/testng.xml` or by invoking Surefire with a different suite file if you add one later.

## Notes

- No locators are defined in the test classes.
- Credentials and other row-specific data must come from the Excel workbook.
- The suite uses explicit waits plus an Angular stability check before interacting with pages.
- If the frontend DOM changes, update the locators only in the page object classes.