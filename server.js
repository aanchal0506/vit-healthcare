const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const ses = require("express-session");

const { Student, Doctor, Ambulance,Session } = require("./schema");

const app = express();
const PORT = 5000;


app.use(ses({
    secret: 'your-secret-key', // change this to a strong random string
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 1000 * 60 * 15 } 
}));
// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
mongoose.connect("mongodb://127.0.0.1:27017/vit_health", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("MongoDB Connected"))
.catch(err => console.error("MongoDB Connection Error:", err));

// ROUTES

// Serve Pages
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "landing.html"));
});

app.get("/signup", (req, res) => {
    res.sendFile(path.join(__dirname, "signuppage.html"));
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "login.html"));
});
app.get("/service", (req, res) => {
    res.sendFile(path.join(__dirname, "service.html"));
});

app.get("/doctor-info", (req, res) => {
    res.sendFile(path.join(__dirname, "doctorinfo.html"));
});
app.get("/callambulance", (req, res) => {
    res.sendFile(path.join(__dirname, "callambulance.html"));
});
app.get("/booksession", (req, res) => {
    res.sendFile(path.join(__dirname, "book-session.html"));
});

// ====================== API ROUTES ====================== //

// Get doctor by name
app.get('/getDoctor', async (req, res) => {
    const { name } = req.query;
    try {
        const doctor = await Doctor.findOne({ name: new RegExp(name, 'i') });
        res.json(doctor || {});
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Live Doctor Suggestions (AJAX)
app.get('/suggestDoctors', async (req, res) => {
    const query = req.query.name;
    if (!query || query.length < 3) {
        return res.json([]);
    }

    try {
        const regex = new RegExp(query, 'i');
        const doctors = await Doctor.find({ name: regex }).limit(5);
        const names = doctors.map(doc => doc.name);
        console.log("Suggestions for:", query, "=>", names);
        res.json(names);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
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
function isLoggedIn(req, res, next) {
    if (req.session.student) {
        next();
    } else {
        res.redirect("/login");
    }
}
app.get("/service", isLoggedIn, (req, res) => {
    res.sendFile(path.join(__dirname, "public", "service.html"));
});

app.post('/students/login', async (req, res) => {
    const { registrationNumber, password } = req.body;

    try {
        const student = await Student.findOne({ registrationNumber });

        if (!student) {
            return res.status(404).json({ message: "Student not found. Please sign in." });
        }

        if (student.password !== password) {
            return res.status(401).json({ message: "Invalid password. Try again." });
        }
        req.session.student = {
            id: student._id,
            registrationNumber: student.registrationNumber,
            name: student.name
        };

        res.status(200).json({ message: "Login successful" });

    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});


/* Update Student Details
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
*/


// Book a Doctor Session
// app.post("/doctors/book", async (req, res) => {
//     try {
//         const { employeeId } = req.body;
//         const doctor = await Doctor.findOne({ employeeId });

//         if (!doctor) return res.status(404).json({ message: "Doctor not found" });

//         if (doctor.bookings >= doctor.maxLimit) {
//             return res.status(400).json({ message: "Doctor is not available for the selected time slot" });
//         }

//         doctor.bookings += 1;
//         await doctor.save();
//         res.status(200).json({ message: "Session booked successfully", doctor });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });
app.post("/sessions/booksession", async (req, res) => {
    try {
        const { name, registrationNumber, mobile, hostelBlock, doctor_sel, timeslot } = req.body;
        console.log("Booking data:", req.body);

        // 1. Check if the student already booked
        const alreadyBooked = await Session.findOne({ registrationNumber });
        if (alreadyBooked) {
            return res.status(400).json({ message: "Student has already booked a session" });
        }

        // 2. Get doctor info from Doctor collection
        const doctor = await Doctor.findOne({ name: doctor_sel });

        if (!doctor) {
            return res.status(404).json({ message: "Doctor not found" });
        }

        if (doctor.bookings >= doctor.maxLimit) {
            return res.status(400).json({ message: "Doctor is not available" });
        }

        // 3. Save the session
        const newSession = new Session(req.body);
        await newSession.save();

        // 4. Increment doctor bookings
        doctor.bookings += 1;
        await doctor.save();

        res.status(201).json({ message: "Session booked successfully", session: newSession, doctor });
    } catch (error) {
        console.error("Booking error:", error);
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

        res.status(200).json({ message: "Ambulance booked successfully", driver: {
            driverName: driver.driverName,
            timeOfBooking: driver.timeOfBooking,
            rtoNumber: driver.rtoNumber
        }, ambulance: availableAmbulance });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ====================== Start Server ====================== //
app.listen(PORT, () => {
    console.log(`🚀 Server running at: http://localhost:${PORT}`);
});
