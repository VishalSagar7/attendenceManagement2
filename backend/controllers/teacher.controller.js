import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import Teacher from '../models/teacher.model.js';
import { generateToken } from '../utils/generateTeacherToken.js';
import Student from '../models/student.model.js';
import Attendance from '../models/attendence.model.js';
import Announcement from '../models/announcement.model.js';
import Classname from '../models/classname.model.js';

dotenv.config();

export const teacherSignup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: 'Fill all the fields.'
                });
        }

        const existingUser = await Teacher.findOne({ email });
        if (existingUser) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: 'Email already in use'
                });
        }

        if (password.length < 6) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: 'password length must be atleast 6 characters.'
                });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newTeacher = new Teacher({
            name,
            email,
            password: hashedPassword,
            role: 'teacher',
        });

        await newTeacher.save();

        res
            .status(201)
            .json({
                success: true,
                message: 'Teacher registered successfully',
                teacher: {
                    id: newTeacher._id,
                    name: newTeacher.name,
                    email: newTeacher.email,
                    role: newTeacher.role,
                },
            });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};




// Teacher login function
export const teacherLogin = async (req, res) => {
    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: 'Fill all the fields.'
                });
        };
        // Check if teacher exists
        const teacher = await Teacher.findOne({ email, role: 'teacher' });
        if (!teacher) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: 'Invalid email or password.'
                });
        }

        // Validate password
        const isPasswordValid = await bcrypt.compare(password, teacher.password);
        if (!isPasswordValid) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: 'Invalid email or password.'
                });
        }

        // Generate JWT token
        generateToken(teacher, res)


        res
            .status(200)
            .json({
                success: true,
                message: 'Login successful.',
                teacher
            });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};


export const teacherLogout = (req, res) => {
    try {

        res.cookie('teacher-token', '', {
            httpOnly: true,
            expires: new Date(0),
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        });

        res.status(200).json({
            message: "Logout successful",
            success: true
        });
    } catch (error) {
        res.status(500).json({
            message: "Logout failed",
            error: error.message
        });
    }
};


export const teacherVerification = async (req, res) => {
    try {
        const teacher = req.teacher;

        return res
            .status(200)
            .json({
                success: true,
                message: "Teacher verified successfully.",
                teacher
            });

    } catch (error) {
        res.status(401).json({
            message: "Error in teacherVerification middleware.",
            error: error.message,
            success: false
        });
    }
};


export const insertAttendance = async (req, res) => {
    try {

        const { subject, date, studentsData, teacherId } = req.body;



        // Loop through the students and update their attendance records
        for (const studentDetail of studentsData) {
            const { studentId, present } = studentDetail;

            // Update the attendance in the Student model
            const student = await Student.findById(studentId);
            if (!student) {
                return res.status(404).json({
                    message: `Student with ID ${studentId} not found.`,
                    success: false
                });
            }

            // Add attendance record to the student's attendance array
            student.attendance.push({
                subject,
                date,
                present
            });

            await student.save();
        }

        // const existingAttendence = await Attendance.findOne({ subject, date })

        // if (existingAttendence) {
        //     return res.status(404).json({
        //         message: `.`,
        //         success: false
        //     });
        // }

        const attendance = new Attendance({
            teacherId,
            subject,
            date,
            studentsData
        });

        await attendance.save();

        res.status(200).json({
            message: "Attendance recorded successfully.",
            success: true
        });



    } catch (error) {
        res.status(500).json({
            message: "Error recording attendance.",
            error: error.message,
            success: false
        });
    }
};


export const getAllStudentsList = async (req, res) => {
    try {

        const { className } = req.body;

        

        if (!className) {
            return res
                .status(500)
                .json({
                    success: false,
                    message: "please provide a className."
                });
        }

        const classSubjects = await Classname.find({ className }).select('subjects');
        // const subjectOfThatClass = classInfo.subjects;
        

        const allStudents = await Student.find({ className }).select('-password -attendance').sort({ rollNumber: 1 });

        if (allStudents.length === 0) {
            return res
                .status(500)
                .json({
                    success: false,
                    message: "Enter valid classname."
                });
        }

        res
            .status(200)
            .json({
                success: true,
                allStudents,
                classSubjects
            });

    } catch (error) {
        res.status(500).json({
            message: "Error getAllStudentsList attendance.",
            error: error.message,
            success: false
        });
    }
}




export const getDefaulterList = async (req, res) => {
    try {
        const { className } = req.body;

        if (!className) {
            return res.status(400).json({
                message: "Class name is required",
                success: false,
            });
        }

        // Fetch students of the given class
        const students = await Student.find({ className }).select("-password");

        if (students.length === 0) {
            return res.status(404).json({
                message: "No students found for this class",
                success: false,
            });
        }

        // Filter students with attendance < 75%
        const defaulters = students
            .map(student => {
                const totalLectures = student.attendance.length;
                const attendedLectures = student.attendance.filter(record => record.present).length;
                const percentage = totalLectures ? (attendedLectures / totalLectures) * 100 : 0;

                return {
                    name: student.name,
                    phoneNumber: student.phoneNumber,
                    email: student.email,
                    rollNumber: student.rollNumber,
                    className: student.className,
                    _id : student._id,
                    totalLectures,
                    attendedLectures,
                    percentage: `${percentage.toFixed(2)}%`
                };
            })
            .filter(student => parseFloat(student.percentage) < 75);

        return res.status(200).json({
            success: true,
            totalDefaulters: defaulters.length,
            defaulters
        });

    } catch (error) {
        console.error("Error fetching defaulter list:", error.message);
        return res.status(500).json({
            message: "Internal server error",
            success: false,
        });
    }
};



export const createAnnouncement = async (req, res) => {
    try {
        // Extract data from the request body
        const { teacherId, content, className } = req.body;

        // Validate required fields
        if (!teacherId || !content || !className) {
            return res.status(400).json({
                message: "All fields (teacherId, content, className) are required",
                success: false,
            });
        }

        const classInfo = await Classname.findOne({ className: className });

        if (!classInfo) {
            return res.status(400).json({
                message: "Enter valid classname",
                success: false,
            });
        }

        
        const newAnnouncement = new Announcement({
            createdBy: teacherId,
            createdForClass: className,
            content: content,
        });

       
        const savedAnnouncement = await newAnnouncement.save();
        
        res.status(201).json({
            message: "Announcement created successfully",
            success: true,
            data: savedAnnouncement,
        });

    } catch (error) {
        console.error("Error in createAnnouncement controller:", error.message);
        res.status(500).json({
            message: "Internal server error",
            success: false,
        });
    }
};




