import express from 'express';
import 'dotenv/config'; // This works with ES modules

const app = express();
const PORT = process.env.PORT ?? 3000;

app.get('/', (req, res) => {
  res.json({ message: 'Hello World!' });
});

app.listen(PORT, () => {
  console.log(`Server runnxing on port ${PORT.toString()}`);
});
