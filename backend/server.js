import "dotenv/config"; // loads .env before anything else reads process.env
import app from "./app.js";
import connectDb from "./database/db.js";

connectDb();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening at port ${PORT}`);
});
