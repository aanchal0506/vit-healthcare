// schema.js
const mongoose = require("mongoose");

// Student Schema
const studentSchema = new mongoose.Schema({
    name: String,
    registrationNumber: { type: String, unique: true },
    mobile: String,
    hostelBlock: String,
    gender: String,
    email: String,
    age: Number,
    password: String
}, { collection: 'students' });
const Student = mongoose.model("Student", studentSchema);

// Doctor Schema
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
}, { collection: 'doctors' });
const Doctor = mongoose.model("Doctor", doctorSchema);

// Ambulance Schema
const ambulanceSchema = new mongoose.Schema({
    rtoNumber: String,
    driverName: String,
    timeOfBooking: Date,
    pickupAddress: String,
    studentName: String
}, { collection: 'ambulances' });
const Ambulance = mongoose.model("Ambulance", ambulanceSchema);
const sessionSchema = new mongoose.Schema({
    name: String,
    registerNumber: String,
    mobile: String,
    hostelBlock: String,
    doctor_sel:String,
    gender: String,
    age: Number,
    timeslot: String,
    email: String
  });
  const Session = mongoose.model('Session', sessionSchema);
  
// Export all models
module.exports = { Student, Doctor, Ambulance,Session };
