const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello World!')
})

//middleware
app.use(cors());
app.use(express.json());








app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})