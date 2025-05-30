// Import necessary modules
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Define input and output file paths
const inputFilePath = path.join(__dirname, 'may-2025.csv');
const outputFilePath = path.join(__dirname, 'output.csv');

/**
 * Transposes the input CSV data from a wide format (tickets as rows, dates as columns)
 * to a long format (Date, Ticket, Time Spent).
 *
 * @param {Array<Object>} data - The parsed CSV data, where each object is a row.
 * @returns {Array<Object>} The transposed data in the desired format.
 */
async function transposeData(data) {
    const transposed = [];

    // The first row (headers) from the input CSV will be used to identify dates.
    // csv-parser by default uses the first row as keys for the objects.
    // So, we need to extract the date keys from the first data object.
    if (data.length === 0) {
        console.log('No data found in the input CSV.');
        return transposed;
    }

    // Get all keys from the first row (which are the headers)
    const allHeaders = Object.keys(data[0]);

    // Identify the 'Ticket' column header
    const ticketHeader = 'Ticket'; // Assuming 'Ticket' is the exact header name

    // Filter out date headers. Dates are assumed to be any header that is NOT 'Ticket'.
    const dateHeaders = allHeaders.filter(header => header !== ticketHeader);

    // Iterate over each row (ticket entry) in the input data
    for (const row of data) {
        const ticketName = row[ticketHeader];

        // Iterate over each date column for the current ticket
        for (const date of dateHeaders) {
            const timeSpent = row[date];

            // Only add to the transposed data if 'Time Spent' is a non-empty, non-zero value
            // Convert to number for proper comparison, handling potential string values
            const parsedTimeSpent = parseFloat(timeSpent);
            if (!isNaN(parsedTimeSpent) && parsedTimeSpent > 0) {
                transposed.push({
                    Date: date,
                    Ticket: ticketName,
                    'Time Spent': parsedTimeSpent
                });
            }
        }
    }
    return transposed;
}

/**
 * Main function to read, transpose, and write the CSV data.
 */
async function processCsv() {
    const records = [];

    // Read the input CSV file
    fs.createReadStream(inputFilePath)
        .pipe(csv()) // Pipe the stream through csv-parser
        .on('data', (row) => {
            // Each row is an object where keys are column headers
            records.push(row);
        })
        .on('end', async () => {
            console.log('Finished reading input CSV.');
            console.log(`Found ${records.length} records.`);

            // Transpose the collected data
            const transposedData = await transposeData(records);
            console.log(`Transposed into ${transposedData.length} billing entries.`);

            // Define the CSV writer for the output file
            const csvWriter = createCsvWriter({
                path: outputFilePath,
                header: [
                    { id: 'Date', title: 'Date' },
                    { id: 'Ticket', title: 'Ticket' },
                    { id: 'Time Spent', title: 'Time Spent' }
                ]
            });

            // Write the transposed data to the output CSV file
            csvWriter.writeRecords(transposedData)
                .then(() => {
                    console.log(`Transposed CSV successfully written to ${outputFilePath}`);
                })
                .catch(err => {
                    console.error('Error writing output CSV:', err);
                });
        })
        .on('error', (err) => {
            console.error('Error reading input CSV:', err);
        });
}

// Execute the main function
processCsv();
