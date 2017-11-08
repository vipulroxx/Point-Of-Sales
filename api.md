# API Documentation
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
