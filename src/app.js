import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import errorHandler from './utils/errorHandler.js';

const app = express();


//Middlewares
app.use(cors(
    {
        origin: process.env.CORS_ORIGIN,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
}));
//common middleware
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.json({limit: "16kb"}));
app.use(express.static('public'));
app.use(cookieParser());

//import routes
import healthcheckRouter from './routes/healthcheck.routes.js';
import userRouter from './routes/user.routes.js';
//routes
app.use('/api/v1/healthcheck', healthcheckRouter);
app.use('/api/v1/user', userRouter);

app.use(errorHandler);
export {app};