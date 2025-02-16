import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true // Ensures each email is unique
    },
    password: {
        type: String,
        required: true
    },
    className: {
        type: String,
        required: true // Represents the class name (e.g., "6A")
    },
    rollNumber: {
        type: Number,
        required: true
    },
    phoneNumber: {
        type: String,
        required: false // Optional field for phone number
    },
    role: {
        type: String,
        requi: true,
        default: 'student'
    },
    attendance: [
        {
            subject: {
                type: String,
                required: true
            },
            date: {
                type: Date,
                required: true
            },
            present: {
                type: Boolean,
                required: true
            }
        }
    ]
}, { timestamps: true });


// Export the model
const Student = mongoose.model('Student', studentSchema);

export default Student;
