## API Endpoints
### Public
#### `/api/status/:id` (GET)
polls the current status of a print job (see Status Code Sequencing)
### User
#### `/api/script/:script_name` (POST)
* `_key` => user key
* `<arg>` => value

creates a print job using the indicated postscript program

### Printer
#### `/api/printer/poll` (POST)
* `_key` => printer key

polls for all new print jobs

#### `/api/printer/update/:id` (POST)
* `_key` => printer key
* `status` => print job status code

updates a print job's status (see Status Code Sequencing)

## API Error Codes
* `MIB` [`400`] - Malformed Image Buffer
* `IAK` [`401`] - Invalid Auth Key
* `ISU` [`409`] - Invalid Status Update (see Status Code Sequencing)
* `NAU` [`403`] - Not A User
* `NAP` [`403`] - Not A Printer

## Print Job Status Codes
### Completed
* `CSP` - Successful Print
### Error
* `EPA` - Printer Aborted
* `EPC` - Printer Canceled
* `EPS` - Printer Stopped
* `ETO` - Timeout
### Pending
* `PIQ` - In Queue
* `PNR` - Not Recieved
* `PRP` - Recieved by Printer
### Rejected
* `RBA` - Bad Arguments
* `RUS` - Unimplemented Script

## Status Code Sequencing

1. `PNR` (Print Job Created)
2. `PRP` (Print Job Polled)
3. `R__` (Printer Rejected Print Job; Sequence Terminated) or `PIQ` (Printer Accepted Print Job)
4. `E__` (Error Occured During Printing; Sequence Terminated) or `C__` (Print Completed; Sequence Terminated)