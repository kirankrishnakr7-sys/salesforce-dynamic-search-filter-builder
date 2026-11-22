@IsTest
private class DynamicSearchControllerTest {
    @TestSetup
    static void createTestData() {
        insert new Account(
            Name = 'Dynamic Search Builder Test Account',
            Phone = '555-0100'
        );
    }

    @IsTest
    static void testGetAvailableObjectsIncludesAccount() {
        Test.startTest();
        List<DynamicSearchController.ObjectOption> options =
            DynamicSearchController.getAvailableObjects();
        Test.stopTest();

        Boolean foundAccount = false;
        for (DynamicSearchController.ObjectOption option : options) {
            if (option.value == 'Account') {
                foundAccount = true;
                break;
            }
        }
        System.assert(foundAccount, 'Account should be available to the running user.');
    }

    @IsTest
    static void testGetObjectFieldsIncludesName() {
        Test.startTest();
        List<DynamicSearchController.FieldOption> fields =
            DynamicSearchController.getObjectFields('Account');
        Test.stopTest();

        Boolean foundName = false;
        for (DynamicSearchController.FieldOption field : fields) {
            if (field.value == 'Name') {
                foundName = true;
                System.assertEquals('STRING', field.dataType);
                break;
            }
        }
        System.assert(foundName, 'Account.Name should be returned as an available field.');
    }

    @IsTest
    static void testGetPicklistValuesForAccountType() {
        Test.startTest();
        List<DynamicSearchController.PicklistOption> values =
            DynamicSearchController.getPicklistValues('Account', 'Type');
        Test.stopTest();

        System.assertNotEquals(null, values, 'Picklist options should be returned.');
    }

    @IsTest
    static void testSearchRecordsByAccountName() {
        Test.startTest();
        List<SObject> results = DynamicSearchController.searchRecords(
            'Account',
            'Name',
            '=',
            'Dynamic Search Builder Test Account',
            new List<String>{ 'Name', 'Phone' }
        );
        Test.stopTest();

        System.assertEquals(1, results.size(), 'The matching account should be returned.');
        System.assertEquals(
            'Dynamic Search Builder Test Account',
            (String) results[0].get('Name')
        );
    }

    @IsTest
    static void testInvalidObjectIsRejected() {
        Boolean exceptionThrown = false;
        try {
            DynamicSearchController.getObjectFields('NotARealObject__c');
        } catch (AuraHandledException ex) {
            exceptionThrown = true;
        }
        System.assert(exceptionThrown, 'An invalid object API name must be rejected.');
    }

    @IsTest
    static void testInvalidOperatorIsRejected() {
        Boolean exceptionThrown = false;
        try {
            DynamicSearchController.searchRecords(
                'Account',
                'Name',
                '>',
                'Test',
                new List<String>{ 'Name' }
            );
        } catch (AuraHandledException ex) {
            exceptionThrown = true;
        }
        System.assert(exceptionThrown, 'An unsupported operator must be rejected.');
    }

    @IsTest
    static void testEmptyResultFieldSelectionIsRejected() {
        Boolean exceptionThrown = false;
        try {
            DynamicSearchController.searchRecords(
                'Account',
                'Name',
                '=',
                'Test',
                new List<String>()
            );
        } catch (AuraHandledException ex) {
            exceptionThrown = true;
        }
        System.assert(exceptionThrown, 'At least one result field must be selected.');
    }
}
