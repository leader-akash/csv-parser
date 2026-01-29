import { Readable } from 'stream';
import csvParser from 'csv-parser';
import { validateRow } from '../utils/validators.js';

export const processCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const results = await parseAndValidateCSV(req.file.buffer);
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('CSV Processing Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error processing CSV file'
    });
  }
};

const parseAndValidateCSV = (buffer) => {
  return new Promise((resolve, reject) => {
    const validRecords = [];
    const failedRecords = [];
    let rowNumber = 0;
    let headers = [];

    const readable = Readable.from(buffer);

    readable
      .pipe(csvParser({
        mapHeaders: ({ header }) => header.trim().toLowerCase()
      }))
      .on('headers', (hdrs) => {
        headers = hdrs;
      })
      .on('data', (row) => {
        rowNumber++;
        
        const normalizedRow = {
          name: row.name || row.Name || '',
          email: row.email || row.Email || '',
          phone: row.phone || row.Phone || row.mobile || row.Mobile || ''
        };

        const validation = validateRow(normalizedRow);

        if (validation.isValid) {
          validRecords.push({
            rowNumber,
            ...normalizedRow
          });
        } else {
          failedRecords.push({
            rowNumber,
            name: normalizedRow.name,
            email: normalizedRow.email,
            phone: normalizedRow.phone,
            errors: validation.errors
          });
        }
      })
      .on('end', () => {
        resolve({
          totalRecords: rowNumber,
          validCount: validRecords.length,
          invalidCount: failedRecords.length,
          failedRecords
        });
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};
