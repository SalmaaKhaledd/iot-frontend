# Test Data Folder

The workbook already used by the suite is `frontend-testing.xlsx` in this folder.

The suite uses the existing workbook sheets:

- `Sign Up`
- `Sign In`
- `Profile Page`


The Selenium suite reads rows from these pages:

- `SignupTest` uses `Sign Up`
- `SigninTest` and `DashboardTest` use `Sign In`
- `UserProfileTest` uses `Profile Page`

The rows the suite uses are identified by `Test Case Name` values that begin with `Selenium`.

The runtime values are stored in the existing `Test Data Used` column as `key=value` pairs separated by semicolons, so the workbook does not need helper sheets.