const express = require('express');
//const mongoose = require('mongoose');
//const seedUser = require('./seed');
const path = require('path');

const app = express();
const PORT = 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // For form data

app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
// mongoose.connect("mongodb://127.0.0.1:27017/FreshStart")
//   .then(() => console.log("Connected to MongoDB"))
//   .catch((error) => console.log("MongoDB connection error:", error));

app.get('/', function(req, res){
    res.sendFile(path.join(__dirname, 'login.html'));
})

// Serve HTML Form on /sign-in
app.get('/signup', function(req, res) {
  res.sendFile(path.join(__dirname,'signuppage.html'));
});



// app.get('/login', function(req, res) {
//   res.sendFile(path.join(__dirname, 'seniorlogin.html'));
// })

// Handle Form Submission
// app.post('/sign-in', async (req, res) => {
//   const { email, password } = req.body;

//   if (!email || !password) {
//     return res.status(400).json({ error: 'Email and password are required' });
//   }

//   try {
//     const result = await seedUser('New User', email, password);
    
//     if (result.message === 'User created successfully!') {
//       return res.redirect('/senior-portal'); // Redirect on success
//     } else {
//       return res.send(`
//         <script>
//           alert('${result.message}');
//           window.location.href = '/login';
//         </script>
//       `);
//     }
//   } catch (error) {
//     res.status(500).send(`
//       <script>
//         alert('Error: ${error.message}');
//         window.location.href = '/sign-in';
//       </script>
//     `);
//   }
// });

// // Serve the senior portal page
// app.get('/senior-portal', function(req, res) {
//   res.sendFile(path.join(__dirname, 'senior-portal.html'));
// });


app.listen(PORT, () => {
  console.log('Server is running on http://localhost:5000');
});