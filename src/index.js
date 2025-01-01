import { app } from "./app.js";
import dotenv from "dotenv";
import 'dotenv/config';
import connectDB from "./db/index.js";

dotenv.config({
    path: './.env'
});
//Server setup
const PORT=process.env.PORT||3000;
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch((error) => {
    console.error('Error connecting to database:', error);
    process.exit(1);
});
