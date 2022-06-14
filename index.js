const express = require("express");
const productRoutes = require("./routes/product");

const app = express();

app.use("/product", productRoutes);

console.log("Feature B");
console.log('Feature B2')

app.listen(8000, async () => {
  console.log("Listening on 8000");
});
