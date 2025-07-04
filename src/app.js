import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"


const app = express()


// middlewares and configuration.....
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

// data json form me accept ho rha hai....
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))

// use for stroing images,pdf on our server
app.use(express.static("public"))
app.use(cookieParser())


// routes import
import userRouter from './routes/user.routes.js'


// routes declaration....use of middlewares
app.use("/api/v1/users",userRouter);

// http://localhost:8000/api/v1/users/register

export {app}