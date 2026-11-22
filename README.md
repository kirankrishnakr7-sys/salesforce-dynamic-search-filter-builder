# Salesforce Dynamic Search & Filter Builder

A configurable Lightning Web Component (LWC) that lets users select a Salesforce object, choose a field and operator, enter a filter value, and display matching records in a configurable results table.

## Features

- Dynamically retrieves queryable and accessible Salesforce objects.
- Retrieves accessible fields for the selected object.
- Offers operators based on field data type, including text, numeric, date/time, Boolean, picklist, multipicklist, and reference field categories.
- Retrieves active picklist values for standard picklist fields.
- Allows users to select up to five result columns.
- Displays results in a Lightning Datatable.
- Provides client-side pagination (five records per page).
- Uses Apex describe information to validate object and field selections.
- Uses bind variables with dynamic SOQL and executes the query in user mode.
- Limits each search response to 50 records.

## Project structure

```text
force-app/
  main/
    default/
      classes/
        DynamicSearchController.cls
        DynamicSearchController.cls-meta.xml
        DynamicSearchControllerTest.cls
        DynamicSearchControllerTest.cls-meta.xml
      lwc/
        dynamicSearchBuilder/
          dynamicSearchBuilder.html
          dynamicSearchBuilder.js
          dynamicSearchBuilder.css
          dynamicSearchBuilder.js-meta.xml
          __tests__/
            dynamicSearchBuilder.test.js
manifest/
  package.xml
sfdx-project.json
jsconfig.json
.gitignore
README.md
```

## Requirements

- A Salesforce org that supports Metadata API version **68.0**.
- Salesforce CLI (the `sf` command).
- Visual Studio Code with the Salesforce Extension Pack (recommended).
- A user with appropriate object and field permissions to use the component.

## Deploy to a Salesforce org

1. Clone this repository:

   ```bash
   git clone https://github.com/kirankrishnakr7-sys/salesforce-dynamic-search-filter-builder.git
   cd salesforce-dynamic-search-filter-builder
   ```

2. Authenticate to your Salesforce org:

   ```bash
   sf org login web --alias DynamicSearchOrg
   ```

   For a sandbox, use:

   ```bash
   sf org login web --instance-url https://test.salesforce.com --alias DynamicSearchSandbox
   ```

3. Validate deployment:

   ```bash
   sf project deploy validate --manifest manifest/package.xml --target-org DynamicSearchOrg
   ```

4. Deploy the component and Apex classes:

   ```bash
   sf project deploy start --manifest manifest/package.xml --target-org DynamicSearchOrg
   ```

5. Open the org:

   ```bash
   sf org open --target-org DynamicSearchOrg
   ```

6. In Lightning App Builder, add **Dynamic Search & Filter Builder** to an App Page, Home Page, or Record Page, then save and activate the page.

## Run Apex tests

Run the included Apex test class:

```bash
sf apex run test --class-names DynamicSearchControllerTest --result-format human --target-org DynamicSearchOrg
```

The test class covers object discovery, field discovery, picklist retrieval, a matching record search, and invalid-input validation. Execute the tests in a Salesforce org before deploying to production.

## LWC Jest test

The Jest test is included under the component's `__tests__` directory. To run it, configure the project with the Salesforce LWC Jest tooling and its matching dependencies. The supplied test uses `@lwc/engine-dom`; verify that this import is supported by the Jest setup/version you install.

## Usage

1. Open a Lightning page containing the component.
2. Select a Salesforce object.
3. Select a filter field.
4. Select an operator.
5. Enter or choose a filter value.
6. Choose up to five result fields.
7. Click **Search Records**.
8. Navigate the returned records using Previous and Next.

## Security notes

- The Apex controller uses `with sharing`.
- Object and field access are checked using Schema describe information.
- Dynamic SOQL values are passed as bind variables.
- Queries execute with `AccessLevel.USER_MODE`, enforcing user-level data access.
- Do not commit Salesforce credentials, access tokens, session IDs, private keys, or real customer data to this public repository.

## Current implementation notes

- The result query is capped at 50 records.
- Pagination is performed in the browser over the returned result set.
- The UI currently retrieves picklist values for fields identified as `PICKLIST`. Multipicklist operators are present in the operator map, but a dedicated multipicklist value selector is not included in the supplied UI.
- Review the component in a development org and run the Apex tests before treating the project as production-ready.

## Contributing

Issues and pull requests are welcome. Please include reproduction steps and relevant Salesforce API/version details when reporting a problem.

## License

No license has been added yet. Unless a license is added to this repository, others may view the source but do not automatically receive permission to reuse, modify, or distribute it.
