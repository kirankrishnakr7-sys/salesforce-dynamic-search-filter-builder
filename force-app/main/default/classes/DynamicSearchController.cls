public with sharing class DynamicSearchController {



    // =====================================================

    // 1. OBJECT OPTION WRAPPER

    // =====================================================

    public class ObjectOption {



        @AuraEnabled

        public String label { get; set; }



        @AuraEnabled

        public String value { get; set; }



        public ObjectOption(String label, String value) {

            this.label = label;

            this.value = value;

        }

    }





    // =====================================================

    // 2. FIELD OPTION WRAPPER

    // =====================================================

    public class FieldOption {



        @AuraEnabled

        public String label { get; set; }



        @AuraEnabled

        public String value { get; set; }



        @AuraEnabled

        public String dataType { get; set; }



        public FieldOption(

            String label,

            String value,

            String dataType

        ) {

            this.label = label;

            this.value = value;

            this.dataType = dataType;

        }

    }

public class PicklistOption {

    @AuraEnabled public String label { get; set; }

    @AuraEnabled public String value { get; set; }



    public PicklistOption(String label, String value) {

        this.label = label;

        this.value = value;

    }

}



    // =====================================================

    // 3. RETRIEVE AVAILABLE OBJECTS

    // =====================================================

    @AuraEnabled(cacheable=true)

    public static List<ObjectOption> getAvailableObjects() {



        Map<String, Schema.SObjectType> globalDescribe =

            Schema.getGlobalDescribe();



        List<ObjectOption> objectOptions =

            new List<ObjectOption>();



        for (String objectApiName : globalDescribe.keySet()) {



            Schema.DescribeSObjectResult objectDescribe =

                globalDescribe.get(objectApiName).getDescribe();



            if (objectDescribe.isQueryable()

                && objectDescribe.isAccessible()

                && !objectDescribe.isCustomSetting()) {



                objectOptions.add(

                    new ObjectOption(

                        objectDescribe.getLabel(),

                        objectDescribe.getName()

                    )

                );

            }

        }



        return objectOptions;

    }





    // =====================================================

    // 4. RETRIEVE FIELDS FOR SELECTED OBJECT

    // =====================================================

    @AuraEnabled(cacheable=true)

    public static List<FieldOption> getObjectFields(

        String objectApiName

    ) {



        Map<String, Schema.SObjectType> globalDescribe =

            Schema.getGlobalDescribe();



        if (String.isBlank(objectApiName)

            || !globalDescribe.containsKey(objectApiName)) {



            throw new AuraHandledException(

                'Invalid object selected.'

            );

        }



        Schema.DescribeSObjectResult objectDescribe =

            globalDescribe.get(objectApiName).getDescribe();



        if (!objectDescribe.isAccessible()

            || !objectDescribe.isQueryable()) {



            throw new AuraHandledException(

                'You do not have permission to access this object.'

            );

        }



        Map<String, Schema.SObjectField> fieldMap =

            objectDescribe.fields.getMap();



        List<FieldOption> fieldOptions =

            new List<FieldOption>();



        for (String fieldApiName : fieldMap.keySet()) {



            Schema.DescribeFieldResult fieldDescribe =

                fieldMap.get(fieldApiName).getDescribe();



            if (fieldDescribe.isAccessible()) {



                fieldOptions.add(

                    new FieldOption(

                        fieldDescribe.getLabel(),

                        fieldDescribe.getName(),

                        String.valueOf(fieldDescribe.getType())

                    )

                );

            }

        }



        return fieldOptions;

    }

@AuraEnabled(cacheable=true)

public static List<PicklistOption> getPicklistValues(

    String objectApiName,

    String fieldApiName

) {

    Map<String, Schema.SObjectType> globalDescribe =

        Schema.getGlobalDescribe();



    if (String.isBlank(objectApiName) ||

        !globalDescribe.containsKey(objectApiName)) {

        throw new AuraHandledException('Invalid object selected.');

    }



    Schema.DescribeSObjectResult objectDescribe =

        globalDescribe.get(objectApiName).getDescribe();



    Map<String, Schema.SObjectField> fieldMap =

        objectDescribe.fields.getMap();



    if (String.isBlank(fieldApiName) ||

        !fieldMap.containsKey(fieldApiName)) {

        throw new AuraHandledException('Invalid field selected.');

    }



    Schema.DescribeFieldResult fieldDescribe =

        fieldMap.get(fieldApiName).getDescribe();



    if (!objectDescribe.isAccessible() ||

        !fieldDescribe.isAccessible() ||

        fieldDescribe.getType() != Schema.DisplayType.PICKLIST) {

        throw new AuraHandledException(

            'Selected field is not an accessible picklist.'

        );

    }


    List<PicklistOption> options = new List<PicklistOption>();



    for (Schema.PicklistEntry entry :

         fieldDescribe.getPicklistValues()) {



        if (entry.isActive()) {

            options.add(

                new PicklistOption(

                    entry.getLabel(),

                    entry.getValue()

                )

            );

        }

    }



    return options;

}



    // =====================================================

    // 5. SEARCH RECORDS USING DYNAMIC SOQL

    // =====================================================

    @AuraEnabled

    public static List<SObject> searchRecords(

    String objectApiName,

    String fieldApiName,

    String operator,

    String filterValue,

    List<String> selectedFieldApiNames

) {



        // STEP 1: Validate object API name



        Map<String, Schema.SObjectType> globalDescribe =

            Schema.getGlobalDescribe();



        if (String.isBlank(objectApiName)

            || !globalDescribe.containsKey(objectApiName)) {



            throw new AuraHandledException(

                'Invalid object selected.'

            );

        }





        // STEP 2: Retrieve object metadata



        Schema.DescribeSObjectResult objectDescribe =

            globalDescribe.get(objectApiName).getDescribe();



        if (!objectDescribe.isQueryable()

            || !objectDescribe.isAccessible()) {



            throw new AuraHandledException(

                'You do not have permission to access this object.'

            );

        }





        // STEP 3: Validate field API name



        Map<String, Schema.SObjectField> fieldMap =

            objectDescribe.fields.getMap();



        if (String.isBlank(fieldApiName)

            || !fieldMap.containsKey(fieldApiName)) {



            throw new AuraHandledException(

                'Invalid field selected.'

            );

        }





        // STEP 4: Retrieve field metadata



        Schema.DescribeFieldResult fieldDescribe =

            fieldMap.get(fieldApiName).getDescribe();



        if (!fieldDescribe.isAccessible()

            || !fieldDescribe.isFilterable()) {



            throw new AuraHandledException(

                'Selected field cannot be used for searching.'

            );

        }



        Schema.DisplayType fieldType = fieldDescribe.getType();





        // STEP 5: Validate supported operators



        Set<String> allowedOperators = new Set<String>{

            '=', '!='

        };



        if (fieldType == Schema.DisplayType.STRING

            || fieldType == Schema.DisplayType.EMAIL

            || fieldType == Schema.DisplayType.PHONE

            || fieldType == Schema.DisplayType.URL) {



            allowedOperators.add('LIKE');

            allowedOperators.add('NOT LIKE');

        }



        if (fieldType == Schema.DisplayType.INTEGER

            || fieldType == Schema.DisplayType.DOUBLE

            || fieldType == Schema.DisplayType.CURRENCY

            || fieldType == Schema.DisplayType.PERCENT

            || fieldType == Schema.DisplayType.DATE

            || fieldType == Schema.DisplayType.DATETIME) {



            allowedOperators.add('>');

            allowedOperators.add('<');

            allowedOperators.add('>=');

            allowedOperators.add('<=');

        }



        if (fieldType == Schema.DisplayType.MULTIPICKLIST) {

            allowedOperators.add('INCLUDES');

            allowedOperators.add('EXCLUDES');

        }



        if (String.isBlank(operator)

            || !allowedOperators.contains(operator)) {



            throw new AuraHandledException(

                'Invalid operator for the selected field.'

            );

        }





        // STEP 6: Validate filter value



        if (filterValue == null || filterValue == '') {



            throw new AuraHandledException(

                'Please enter a filter value.'

            );

        }





        // STEP 7: Convert value to appropriate data type



        Object typedValue;



        try {



            if (fieldType == Schema.DisplayType.DATE) {



                typedValue = Date.valueOf(filterValue);



            } else if (fieldType == Schema.DisplayType.DATETIME) {



    String dateTimeValue =

        filterValue.substring(0, 19).replace('T', ' ');



    typedValue = DateTime.valueOfGmt(dateTimeValue);

} else if (

                fieldType == Schema.DisplayType.INTEGER

            ) {



                typedValue = Integer.valueOf(filterValue);



            } else if (

                fieldType == Schema.DisplayType.DOUBLE

                || fieldType == Schema.DisplayType.CURRENCY

                || fieldType == Schema.DisplayType.PERCENT

            ) {



                typedValue = Decimal.valueOf(filterValue);



            } else if (

                fieldType == Schema.DisplayType.BOOLEAN

            ) {



                if (filterValue != 'true'

                    && filterValue != 'false') {



                    throw new AuraHandledException(

                        'Invalid Boolean value.'

                    );

                }



                typedValue = Boolean.valueOf(filterValue);



            } else {



                typedValue = filterValue;

            }



            // Add wildcards for text searches



            if (operator == 'LIKE'

                || operator == 'NOT LIKE') {



                typedValue =

                    '%' + String.valueOf(typedValue) + '%';

            }



        } catch (Exception e) {



            throw new AuraHandledException(

                'Invalid filter value for the selected field.'

            );

        }





        // STEP 8: Construct SELECT fields



        if (selectedFieldApiNames == null ||

    selectedFieldApiNames.isEmpty() ||

    selectedFieldApiNames.size() > 5) {

    throw new AuraHandledException(

        'Please select between 1 and 5 result fields.'

    );

}



Set<String> fieldsToQuery = new Set<String>{ 'Id' };



for (String selectedApiName : selectedFieldApiNames) {



    if (String.isBlank(selectedApiName) ||

        !fieldMap.containsKey(selectedApiName)) {

        throw new AuraHandledException(

            'Invalid result field selected.'

        );

    }



    Schema.DescribeFieldResult resultField =

        fieldMap.get(selectedApiName).getDescribe();



    if (!resultField.isAccessible()) {

        throw new AuraHandledException(

            'You do not have permission to access a result field.'

        );

    }



    fieldsToQuery.add(selectedApiName);

}



String selectFields = String.join(

    new List<String>(fieldsToQuery),

    ', '

);





        // STEP 9: Construct dynamic SOQL



        String query =

            'SELECT ' + selectFields +

            ' FROM ' + objectApiName +

            ' WHERE ' + fieldApiName +

            ' ' + operator +

            ' :filterValue LIMIT 50';





        // STEP 10: Prepare bind variables



        Map<String, Object> bindValues =

            new Map<String, Object>{

                'filterValue' => typedValue

            };





        // STEP 11: Execute query with user permissions



        try {



            return Database.queryWithBinds(

                query,

                bindValues,

                AccessLevel.USER_MODE

            );



        } catch (Exception e) {



            throw new AuraHandledException(

                'Search failed. Please verify your filter.'

            );

        }

    }

}
