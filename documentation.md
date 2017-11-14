# User Manual

This document describes how to use the web interface for our point-of-sale system.

Two general notes:
1. None of the actions prompt for confirmation.
2. If things don't seem to be going as expected, check the bottom of the screen, which
   is where errors are displayed.

## Setup

To get the server up and running run:

```
$ npm install
$ node express
```


You'll also need to setup `credentials.json` with the following contents
```
{
  "user": "your username",
  "password": "your password"
}
```

## Login

When (re)-loaded, the page will always display the login screen. Enter your assigned
username and password. All sales will be attributed to you until you refresh the page. 

## Manipulating Transaction

- To clear _all_ items in the transaction, click the `VOID` button.
- To add items to the transaction, click on the buttons at the top of the screen. 
- To remove items, click on the entry in the list of current items in the transaction.

## Selling Transaction

To complete the transaction, click the SELL button. You will then be prompted to print
the receipt. Note that the transaction is completed by the time the prompt is displayed, 
so clicking the `X` or `Skip` will not cancel the transaction. After the prompt is 
closed, the webpage will display a fresh, empty transaction.



# Appendix: API Documentation
Our API provides endpoints for fetching buttons and manipulating the transaction

## Buttons

Buttons can be fetched with a GET request to '/buttons'. The response body
will contain a JSON array. Each element of the array is a JSON object having
at least the following keys. 

- invId: The id of the associated item in the inventory
- label: The label to be displayed on the item

Fetching is the only supported operation.

## Transaction

### GET /transaction

Returns all the current items in the transaction. The response will 
contain a JSON array. Each element is an object containing at least
the following keys.

- itemId: (number) The id of the associated item in the inventory
- item: (string) The label to be displayed on the item
- price: (number) The price of a single unit of this item
- count: (number) How many times this item is in the transaction

### DELETE /transaction

Removes all items from the transaction.  The posted body is ignored 
and the response code will be 200 when the operation succeeds.

### POST /transaction/{itemId}

Increments the count of the item with the itemId in the transaction.
The posted body is ignored and the response code will be 200 when the 
operation succeeds.

### DELETE /transaction/{itemId}

Completely removes the item with itemId from the transaction.
The posted body is ignored and the response code will be 200 when the 
operation succeeds.
