const express = require('express');
const app = express();
const port = 8080;

app.get('/hello', (req, res) => {
  res.status(200).json();
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
