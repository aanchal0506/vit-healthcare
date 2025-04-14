const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/vit_health", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("MongoDB Connected"))
.catch(err => console.error(err));

// SCHEMAS & MODELS
const studentSchema = new mongoose.Schema({
    name: String,
    registrationNumber: String,
    mobile: String,
    hostelBlock: String,
    gender: String,
    email: String,
    age: Number,
    password: String
});
const Student = mongoose.model("Student", studentSchema);

const doctorSchema = new mongoose.Schema({
    name: String,
    employeeId: String,
    age: Number,
    experience: Number,
    specialization: String,
    workingDays: [String],
    timeSlot: String,
    maxLimit: Number,
    bookings: { type: Number, default: 0 }
});
const Doctor = mongoose.model("Doctor", doctorSchema);

const ambulanceSchema = new mongoose.Schema({
    rtoNumber: String,
    driverName: String,
    timeOfBooking: Date,
    pickupAddress: String,
    studentName: String
});
const Ambulance = mongoose.model("Ambulance", ambulanceSchema);

// ROUTES

// Serve Pages
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "login.html"));
});

app.get("/signup", (req, res) => {
    res.sendFile(path.join(__dirname, "signuppage.html"));
});

// Student Signup
app.post("/students/signup", async (req, res) => {
    try {
        const { registrationNumber } = req.body;
        const existingStudent = await Student.findOne({ registrationNumber });
        if (existingStudent) {
            return res.status(400).json({ message: "Student already exists" });
        }

        const newStudent = new Student(req.body);
        await newStudent.save();
        res.status(201).json({ message: "Student registered successfully", student: newStudent });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Student Login
app.post("/students/login", async (req, res) => {
    try {
        const { registrationNumber, password } = req.body;
        const student = await Student.findOne({ registrationNumber });

        if (!student) return res.status(404).json({ message: "Student not found" });
        if (student.password !== password) return res.status(401).json({ message: "Invalid password" });

        res.status(200).json({ message: "Login successful", student });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Student Details
app.put("/students/update/:regNo", async (req, res) => {
    try {
        const updatedStudent = await Student.findOneAndUpdate(
            { registrationNumber: req.params.regNo },
            req.body,
            { new: true }
        );

        if (!updatedStudent) return res.status(404).json({ message: "Student not found" });

        res.status(200).json({ message: "Student details updated", student: updatedStudent });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Book a Doctor Session
app.post("/doctors/book", async (req, res) => {
    try {
        const { employeeId } = req.body;
        const doctor = await Doctor.findOne({ employeeId });

        if (!doctor) return res.status(404).json({ message: "Doctor not found" });

        if (doctor.bookings >= doctor.maxLimit) {
            return res.status(400).json({ message: "Doctor is not available for the selected time slot" });
        }

        doctor.bookings += 1;
        await doctor.save();
        res.status(200).json({ message: "Session booked successfully", doctor });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Book an Ambulance with 20-min Time Check
app.post("/ambulances/book", async (req, res) => {
    try {
        const { studentName, pickupAddress } = req.body;
        const currentTime = new Date();

        const availableAmbulance = await Ambulance.findOne({
            $or: [
                { timeOfBooking: null },
                { timeOfBooking: { $lt: new Date(currentTime - 20 * 60000) } }
            ]
        });

        if (!availableAmbulance) {
            return res.status(400).json({ message: "No ambulances available at this time." });
        }

        availableAmbulance.timeOfBooking = currentTime;
        availableAmbulance.studentName = studentName;
        availableAmbulance.pickupAddress = pickupAddress;
        await availableAmbulance.save();

        res.status(200).json({ message: "Ambulance booked successfully", ambulance: availableAmbulance });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Server Start
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
