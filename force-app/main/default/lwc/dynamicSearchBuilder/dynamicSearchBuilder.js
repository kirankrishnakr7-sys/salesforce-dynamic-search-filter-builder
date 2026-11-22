import { LightningElement, wire } from 'lwc';

import getAvailableObjects from '@salesforce/apex/DynamicSearchController.getAvailableObjects';

import getObjectFields from '@salesforce/apex/DynamicSearchController.getObjectFields';

import searchRecords from '@salesforce/apex/DynamicSearchController.searchRecords';

import getPicklistValues from '@salesforce/apex/DynamicSearchController.getPicklistValues';



export default class DynamicSearchBuilder extends LightningElement {



    // Object properties

    objectOptions = [];

    selectedObject;



    // Field properties

    fieldOptions = [];

    selectedField;

    selectedFieldType;



    // Operator properties

    operatorOptions = [];

    selectedOperator;



    // UI properties

    isLoading = false;

    errorMessage;

    objectError;



    filterValue;

    picklistOptions = [];

    searchResults = [];

    hasSearched = false;

columns = [

    {

        label: 'Record ID',

        fieldName: 'Id',

        type: 'text'

    },

    {

        label: 'Selected Field',

        fieldName: 'selectedFieldValue',

        type: 'text'

    }

];

// Result field selection

selectedDisplayFields = [];



// Pagination

currentPage = 1;

pageSize = 5;



    // Prevent an older request overwriting a newer selection

    requestId = 0;



    // Retrieve available Salesforce objects

    @wire(getAvailableObjects)

    wiredObjects({ data, error }) {



        if (data) {

            this.objectOptions = data.map(obj => ({

                label: obj.label,

                value: obj.value

            }));



            this.objectError = undefined;



            console.log(

                'Available Objects:',

                JSON.stringify(this.objectOptions)

            );



        } else if (error) {



            this.objectError =

                error?.body?.message ||

                'Unable to retrieve Salesforce objects.';



            console.error('Object Retrieval Error:', error);

        }

    }



    // Retrieve fields when the selected object changes

    handleObjectChange(event) {



        this.selectedObject = event.detail.value;



        // Reset previous selections

        this.selectedField = undefined;

        this.filterValue = undefined;

        this.selectedFieldType = undefined;

        this.selectedOperator = undefined;

        this.selectedDisplayFields = [];

        this.searchResults = [];

        this.columns = [];

        this.currentPage = 1;

        this.picklistOptions = [];



        this.fieldOptions = [];

        this.operatorOptions = [];



        this.errorMessage = undefined;



        const currentRequestId = ++this.requestId;



        console.log('Selected Object:', this.selectedObject);



        this.isLoading = true;



        getObjectFields({

            objectApiName: this.selectedObject

        })

            .then(result => {



                // Ignore an outdated response

                if (currentRequestId !== this.requestId) {

                    return;

                }



                console.log(

                    'Raw Apex Result:',

                    JSON.stringify(result)

                );



                // Preserve label, API name and data type

                this.fieldOptions = result.map(field => ({

                    label: field.label,

                    value: field.value,

                    dataType: field.dataType

                }));



                console.log(

                    'Retrieved Fields:',

                    JSON.stringify(this.fieldOptions)

                );



            })

            .catch(error => {



                if (currentRequestId !== this.requestId) {

                    return;

                }



                console.error(

                    'Field Retrieval Error:',

                    JSON.stringify(error)

                );



                this.errorMessage =

                    error?.body?.message ||

                    'Unable to retrieve object fields.';



            })

            .finally(() => {



                if (currentRequestId === this.requestId) {

                    this.isLoading = false;

                }

            });

    }



    // Retrieve operators according to field data type

    getOperatorsByType(dataType) {



        const operatorMap = {



            // Text

            STRING: [

                { label: 'Equals', value: '=' },

                { label: 'Not Equals', value: '!=' },

                { label: 'Contains', value: 'LIKE' },

                { label: 'Does Not Contain', value: 'NOT LIKE' }

            ],



            EMAIL: [

                { label: 'Equals', value: '=' },

                { label: 'Not Equals', value: '!=' }

            ],



            PHONE: [

                { label: 'Equals', value: '=' },

                { label: 'Not Equals', value: '!=' }

            ],



            URL: [

                { label: 'Equals', value: '=' },

                { label: 'Not Equals', value: '!=' }

            ],



            // Numeric

            INTEGER: [

                { label: 'Equals', value: '=' },

                { label: 'Not Equals', value: '!=' },

                { label: 'Greater Than', value: '>' },

                { label: 'Less Than', value: '<' },

                { label: 'Greater Than or Equal', value: '>=' },

                { label: 'Less Than or Equal', value: '<=' }

            ],



            DOUBLE: [

                { label: 'Equals', value: '=' },

                { label: 'Not Equals', value: '!=' },

                { label: 'Greater Than', value: '>' },

                { label: 'Less Than', value: '<' },
                { label: 'Greater Than or Equal', value: '>=' },

                { label: 'Less Than or Equal', value: '<=' }

            ],



            CURRENCY: [

                { label: 'Equals', value: '=' },

                { label: 'Not Equals', value: '!=' },

                { label: 'Greater Than', value: '>' },

                { label: 'Less Than', value: '<' }

            ],



            PERCENT: [

                { label: 'Equals', value: '=' },

                { label: 'Not Equals', value: '!=' },

                { label: 'Greater Than', value: '>' },

                { label: 'Less Than', value: '<' }

            ],



            // Date and DateTime

            DATE: [

                { label: 'Equals', value: '=' },

                { label: 'Not Equals', value: '!=' },

                { label: 'Before', value: '<' },

                { label: 'After', value: '>' },

                { label: 'On or Before', value: '<=' },

                { label: 'On or After', value: '>=' }

            ],



            DATETIME: [

                { label: 'Equals', value: '=' },

                { label: 'Not Equals', value: '!=' },

                { label: 'Before', value: '<' },

                { label: 'After', value: '>' },

                { label: 'On or Before', value: '<=' },

                { label: 'On or After', value: '>=' }

            ],



            // Boolean

            BOOLEAN: [

                { label: 'Equals', value: '=' }

            ],



            // Picklist

            PICKLIST: [

                { label: 'Equals', value: '=' },

                { label: 'Not Equals', value: '!=' }

            ],



            MULTIPICKLIST: [

                { label: 'Includes', value: 'INCLUDES' },

                { label: 'Excludes', value: 'EXCLUDES' }

            ],



            // Lookup / Relationship

            REFERENCE: [

                { label: 'Equals', value: '=' },

                { label: 'Not Equals', value: '!=' }

            ],



            ID: [

                { label: 'Equals', value: '=' },

                { label: 'Not Equals', value: '!=' }

            ]

        };



        const normalizedType = (dataType || '').toUpperCase();



        // Unsupported types return an empty array

        return operatorMap[normalizedType] || [];

    }



    // Handle field selection

    handleFieldChange(event) {



    this.selectedField = event.detail.value;

    this.filterValue = undefined;

    this.picklistOptions = [];

    this.errorMessage = undefined;



    const selectedField = this.fieldOptions.find(

        field => field.value === this.selectedField

    );



    if (!selectedField) {

        this.selectedFieldType = undefined;

        this.operatorOptions = [];

        this.selectedOperator = undefined;

        return;

    }



    this.selectedFieldType = selectedField.dataType;



    this.operatorOptions = this.getOperatorsByType(

        this.selectedFieldType

    );



    this.selectedOperator = undefined;



    console.log('Selected Field:', this.selectedField);

    console.log('Selected Field Type:', this.selectedFieldType);



    // Retrieve picklist values dynamically

    if (this.selectedFieldType === 'PICKLIST') {



        getPicklistValues({

            objectApiName: this.selectedObject,

            fieldApiName: this.selectedField

        })

        .then(result => {

            this.picklistOptions = result.map(option => ({

                label: option.label,

                value: option.value

            }));



            console.log('Picklist Options:', this.picklistOptions);

        })

        .catch(error => {

            console.error('Picklist Retrieval Error:', error);



            this.errorMessage =

                error?.body?.message ||

                'Unable to retrieve picklist values.';

        });

    }

}



    // Template getters

        get valueInputType() {

    const inputMap = {

        STRING: 'text',

        EMAIL: 'email',

        PHONE: 'tel',

        URL: 'url',

        INTEGER: 'number',

        DOUBLE: 'number',

        CURRENCY: 'number',

        PERCENT: 'number',

        DATE: 'date',

        DATETIME: 'datetime'

    };



    return inputMap[this.selectedFieldType] || 'text';

}

    get hasFields() {

        return this.fieldOptions.length > 0;

    }



    get hasSelectedField() {

        return Boolean(this.selectedField);

    }



    get hasOperators() {

        return this.operatorOptions.length > 0;

    }



    get hasNoOperators() {

        return this.hasSelectedField && !this.hasOperators;

    }

    get isBooleanField() {

    return this.selectedFieldType === 'BOOLEAN';

}



get isPicklistField() {

    return this.selectedFieldType === 'PICKLIST';

}



get isStandardValueField() {

    return !this.isBooleanField && !this.isPicklistField;

}

handleValueChange(event) {

    this.filterValue =

        event.target.type === 'checkbox'

            ? event.target.checked

            : event.target.value;



    console.log('Filter Value:', this.filterValue);

}

async handleSearch() {



    if (

        !this.selectedObject ||

        !this.selectedField ||

        !this.selectedOperator ||

        !this.selectedDisplayFields.length ||

        this.selectedDisplayFields.length > 5 ||

        this.filterValue === undefined ||

        this.filterValue === null ||

        this.filterValue === ''

    ) {

        this.errorMessage = 'Please complete all filter selections.';

        return;

    }



    try {

        this.errorMessage = undefined;

        this.hasSearched = true;

        this.isLoading = true;

        this.searchResults = [];

        this.currentPage = 1;



        const result = await searchRecords({

    objectApiName: this.selectedObject,

    fieldApiName: this.selectedField,

    operator: this.selectedOperator,

    filterValue: String(this.filterValue),

    selectedFieldApiNames: this.selectedDisplayFields

});



this.searchResults = result;

this.currentPage = 1;

this.buildResultColumns();



console.log('Search Results:', this.searchResults);

console.log('Result Columns:', this.columns); } catch (error) {



        console.error('SEARCH ERROR:', JSON.stringify(error));



        this.errorMessage =

            error?.body?.message ||

            error?.message ||

            'Search failed.';



    } finally {

        this.isLoading = false;

    }

}

buildResultColumns() {



    const typeMap = {

        EMAIL: 'email',

        PHONE: 'phone',

        URL: 'url',

        INTEGER: 'number',

        DOUBLE: 'number',

        CURRENCY: 'currency',

        PERCENT: 'percent',

        DATE: 'date-local',

        DATETIME: 'date',

        BOOLEAN: 'boolean'

    };



    this.columns = this.selectedDisplayFields.map(fieldApiName => {



        const field = this.fieldOptions.find(

            option => option.value === fieldApiName

        );



        return {

            label: field.label,

            fieldName: fieldApiName,

            type: typeMap[field.dataType] || 'text'

        };

    });

}



// Pagination getters

get paginatedResults() {

    const start = (this.currentPage - 1) * this.pageSize;



    return this.searchResults.slice(

        start,

        start + this.pageSize

    );

}



get totalPages() {

    return Math.ceil(this.searchResults.length / this.pageSize);

}



get hasPreviousPage() {

    return this.currentPage > 1;

}



get hasNextPage() {

    return this.currentPage < this.totalPages;

}

get isPreviousDisabled() {

    return !this.hasPreviousPage;

}



get isNextDisabled() {

    return !this.hasNextPage;

}



handlePreviousPage() {

    if (this.hasPreviousPage) {

        this.currentPage--;

    }

}



handleNextPage() {

    if (this.hasNextPage) {

        this.currentPage++;

    }

}

handleDisplayFieldsChange(event) {

    this.selectedDisplayFields = event.detail.value;

}





get hasNoResults() {

    return this.hasSearched &&

           this.searchResults.length === 0 &&

           !this.isLoading;

}

handleOperatorChange(event) {

    this.selectedOperator = event.detail.value;



    console.log('Selected Operator:', this.selectedOperator);

    console.log('Selected Field Type:', this.selectedFieldType);

    console.log('Is Boolean:', this.isBooleanField);

    console.log('Is Picklist:', this.isPicklistField);

    console.log('Is Standard:', this.isStandardValueField);

}

}



public with sharing class DynamicSearchController {
