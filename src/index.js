import { connectDb } from "./db/index.js";
import { app } from "./app.js";


connectDb()
  .then(() => {
    const port = process.env.PORT;
    app.listen(port, ()=>{
        console.log(`Server running at: http://localhost:${port}`)
    })
  })
  .catch((error) => {
    console.log("Error connecting to Database:\n", error);
  });
