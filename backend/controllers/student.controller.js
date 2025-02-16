import bcrypt from 'bcryptjs';
import Student from '../models/student.model.js';
import jwt from 'jsonwebtoken';
import { generateTokenForStudent } from '../utils/generateStudenttoken.js';
import Announcement from '../models/announcement.model.js';
import Classname from '../models/classname.model.js';

export const studentSignup = async (req, res) => {
    try {

        const { name, email, className, password, rollNumber, phoneNumber } = req.body;


        // Validate required fields
        if (!name || !email || !password || !className || !rollNumber || !phoneNumber) {
            return res.status(400).json({
                message: "All required fields must be filled.",
                success: false
            });
        }

        const classInfo = await Classname.findOne({ className: className });


        if (!classInfo) {
            return res.status(404)
                .json({
                    success: true,
                    message: "Enter valid classname"
                })
        }

        // Check if the email is already registered
        const existingEmail = await Student.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({
                message: "Email already registered.",
                success: false
            });
        }

        // Check if the roll number is already registered for the specific class
        const existingRollNo = await Student.findOne({ className, rollNumber });
        if (existingRollNo) {
            return res
                .status(400)
                .json({
                    message: `Roll number ${rollNumber} is already registered in class ${className}.`,
                    success: false
                });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new student document
        const newStudent = new Student({
            name,
            email,
            password: hashedPassword,
            className,
            rollNumber,
            phoneNumber
        });


        await newStudent.save();

        res.status(201).json({
            message: "Student registered successfully.",
            success: true,
            student: {
                id: newStudent._id,
                name: newStudent.name,
                email: newStudent.email,
                class: newStudent.class,
                rollNumber: newStudent.rollNumber
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Error during student registration.",
            success: false,
            error: error.message
        });
    }
};

export const studentLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required.",
                success: false,
            });
        }

        // Check if the student exists
        const student = await Student.findOne({ email });
        if (!student) {
            return res
                .status(404)
                .json({
                    message: "Student not found. Please sign up first.",
                    success: false,
                });
        }

        // Compare the password
        const isPasswordValid = await bcrypt.compare(password, student.password);
        if (!isPasswordValid) {
            return res
                .status(401)
                .json({
                    message: "Invalid email or password.",
                    success: false,
                });
        }

        // Generate a token
        generateTokenForStudent(student, res);

        // Respond with the token and student details
        res.status(200).json({
            message: "Login successful.",
            success: true,
            student: {
                id: student._id,
                name: student.name,
                phoneNumber: student.phoneNumber,
                email: student.email,
                className: student.className,
                rollNumber: student.rollNumber,
                createdAt: student.createdAt
            },
        });
    } catch (error) {
        res.status(500).json({
            message: "Error during student login.",
            success: false,
            error: error.message,
        });
    }
};


export const studentLogout = async (req, res) => {
    try {
        // Clear the cookie containing the JWT token
        res.clearCookie("student-token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Use secure flag only in production
            sameSite: "none", // Adjust as per frontend/backend setup
        });

        res.status(200).json({
            message: "Logout successful.",
            success: true,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error during logout.",
            success: false,
            error: error.message,
        });
    }
};


export const studentVerification = async (req, res) => {
    try {
        const student = req.student;

        return res
            .status(200)
            .json({
                success: true,
                message: "student verified successfully.",
                student
            });

    } catch (error) {
        res.status(401).json({
            message: "Error in studentVerification middleware.",
            error: error.message,
            success: false
        });
    }
};



export const getAttendancePercentage = async (req, res) => {
    try {
        const { studentId } = req.params;


        const student = await Student.findById(studentId).select('-password');

        if (!student) {
            return res.status(404).json({
                message: "Student not found",
                success: false,
            });
        }

        // Group attendance by subject
        const attendanceBySubject = student.attendance.reduce((acc, record) => {
            const { subject, present } = record;

            if (!acc[subject]) {
                acc[subject] = { totalLectures: 0, attendedLectures: 0 };
            }

            acc[subject].totalLectures += 1; // Increment total lectures taken
            if (present) acc[subject].attendedLectures += 1; // Increment attended lectures

            return acc;
        }, {});




        const subjectAttendance = Object.keys(attendanceBySubject).map(subject => {
            const { totalLectures, attendedLectures } = attendanceBySubject[subject];
            const percentage = (attendedLectures / totalLectures) * 100;

            return {
                subject,
                totalLectures,
                attendedLectures,
                attendancePercentage: `${percentage.toFixed(2)}%`,
            };
        });

        // Calculate overall attendance
        const totalLectures = student.attendance.length;
        const attendedLectures = student.attendance.filter(record => record.present).length;
        const overallPercentage = totalLectures ? (attendedLectures / totalLectures) * 100 : 0;

        // Return the results
        return res.status(200).json({
            success: true,
            student,
            subjectWiseAttendance: subjectAttendance,
            overallAttendance: {
                totalLectures,
                attendedLectures,
                percentage: `${overallPercentage.toFixed(2)}%`
            }
        });
    } catch (error) {
        console.error("Error calculating attendance:", error.message);
        return res.status(500).json({
            message: "Internal server error",
            success: false,
        });
    }
};


export const getStudentAnnouncement = async (req, res) => {
    try {
        const { className } = req.body;

        if (!className) {
            return res
                .status(401)
                .json({
                    success: false,
                    message: "Please provide a classname."
                });
        }
        const announcements = await Announcement.find({ createdForClass: className }).populate({ path: 'createdBy', select: '-password' });

        if (announcements.length === 0) {
            return res
                .status(401)
                .json({
                    success: false,
                    message: "No announcements for your class."
                });
        }

        return res
            .status(200)
            .json({
                success: true,
                message: "Announcements fetched.",
                announcements: announcements
            })


    } catch (error) {
        console.error("Error in getStudentAnnouncement controller", error.message);
        return res.status(500).json({
            message: "Internal server error",
            success: false,
        });
    }
};

