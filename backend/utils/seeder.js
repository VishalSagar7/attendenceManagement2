import mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import Student from "../models/student.model.js";
import dotenv from "dotenv";

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

export const seedStudents = async () => {
    const generateRandomStudents = async () => {
        try {
            const className = "7A";
            const students = [];
            const password = "123456"; // Common password for all students
            const hashedPassword = await bcrypt.hash(password, 10); // Hash the password

            for (let i = 1; i <= 40; i++) {
                students.push({
                    name: faker.name.fullName(), // Generate a random full name
                    email: faker.internet.email(), // Generate a random email
                    password: hashedPassword, // Use hashed password
                    className,
                    rollNumber: i, // Use rollNumber
                    phoneNumber: faker.phone.number("98########"), // Generate a random phone number in a valid format
                });
            }

            await Student.insertMany(students);
            console.log("40 students inserted successfully!");
        } catch (error) {
            console.error("Error inserting students:", error.message);
        }
    };

    await generateRandomStudents();
};
