import express from 'express';
import dotenv from 'dotenv';
import teacherRoute from './routes/teacher.route.js';
import studentRoute from './routes/student.route.js';
import schoolRoute from './routes/school.route.js';
import { connectToDB } from './utils/db.js';
import cors from 'cors';
import cookieParser from 'cookie-parser'; 
import path from 'path';


const app = express();
dotenv.config();
app.use(cors({
    origin: "https://attendencemanagement2-1.onrender.com",
    credentials: true,  
}));
app.use(express.json());
app.use(cookieParser());

const PORT = process.env.PORT;
const __dirname = path.resolve();


app.use('/api/teacher', teacherRoute);
app.use('/api/student', studentRoute);
app.use('/api/school', schoolRoute);
app.use(express.static(path.join(__dirname, "/frontend/dist")));
app.get("*", (req,res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
})

app.listen(process.env.PORT, () => {
    console.log(`server is started listening on ${PORT}`);
    connectToDB();
    
});