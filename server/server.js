// Updated Node.js Server-Side Code (e.g., server.js)

const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
app.use(express.json());

// Enable CORS for development (adjust for production as needed)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.post('/update-data-file', (req, res) => {
  const { filePath, content } = req.body;
  const fullPath = path.join(__dirname, '..', filePath); // Adjust path

  fs.writeFile(fullPath, content, 'utf8', (err) => {
    if (err) {
      console.error('Failed to write data file:', err);
      return res.status(500).send('Failed to write data file');
    }
    res.send('Data file updated successfully');
  });
});

// endpoint to get data/entities.json
app.get('/data/entities', (req, res) => {
  const filePath = path.join(__dirname, '..', 'data', 'entities.json');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Failed to read entities data file:', err);
      return res.status(500).send('Failed to read entities data file');
    }
    res.json(JSON.parse(data));
  });
});

// endpoint to get data/state.json
app.get('/data/state', (req, res) => {
  const filePath = path.join(__dirname, '..', 'data', 'state.json');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Failed to read state data file:', err);
      return res.status(500).send('Failed to read state data file');
    }
    res.json(JSON.parse(data));
  });
});

// endpoint to get data/maps.json
app.get('/data/maps', (req, res) => {
  const filePath = path.join(__dirname, '..', 'data', 'maps.json');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Failed to read maps data file:', err);
      return res.status(500).send('Failed to read maps data file');
    }
    res.json(JSON.parse(data));
  });
});

app.listen(3000, () => console.log('Server running on port 3000'));