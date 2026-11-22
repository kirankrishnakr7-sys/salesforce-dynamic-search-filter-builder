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
