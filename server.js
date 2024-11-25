const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
// Serve files in the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Connect to MongoDB Atlas
mongoose.connect('mongodb+srv://tagadgharshailesh:Shailex1234@cluster0.bdcw4yt.mongodb.net/GpROBO?retryWrites=true&w=majority&appName=Cluster0', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Define a schema for form data
const applicationSchema = new mongoose.Schema({
    name: String,
    exceptionalWork: String,
    email: String,
    contactNo: String,
    collegeName: String,
    
    roleCategory: [String], // Define roleCategory as an array of strings
    yearOfPassing: String,
    resume: String // Store resume file path
});

const Application = mongoose.model('Enquiry-Application', applicationSchema);

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Preserve the original filename
    }
});

const upload = multer({ storage: storage });

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'about.html'));
});

app.get('/careers', (req, res) => {
    res.sendFile(path.join(__dirname, 'careers.html'));
});

app.get('/certificate', (req, res) => {
    res.sendFile(path.join(__dirname, 'certificate.html'));
});

app.get('/image', (req, res) => {
    res.sendFile(path.join(__dirname, 'image.html'));
});

app.get('/portfolio', (req, res) => {
    res.sendFile(path.join(__dirname, 'portfolio-details.html'));
});

app.get('/product', (req, res) => {
    res.sendFile(path.join(__dirname, 'product.html'));
});

app.get('/starterpage', (req, res) => {
    res.sendFile(path.join(__dirname, 'starter-page.html'));
});

app.get('/video', (req, res) => {
    res.sendFile(path.join(__dirname, 'video.html'));
});

// app.get('/admin_login', (req, res) => {
//     res.sendFile(path.join(__dirname, 'admin_login.html'));
// });

// app.get('/admin-dashboard', (req, res) => {
//     res.sendFile(path.join(__dirname, 'admin_dashboard.html'));
// });


// Form submission endpoint
app.post('/submitForm', upload.single('resume'), async (req, res) => {
    try {
        // Check if the application already exists based on email address
        const existingApplication = await Application.findOne({ email: req.body.email });
        if (existingApplication) {
            // If application exists, send a success response with a custom message
            return res.status(400).json({ message: 'Application already exists for this email address' });
        }

        // Create a new application instance
        const newApplication = new Application({
            name: req.body.name,
            exceptionalWork: req.body.exceptionalWork,
            email: req.body.email,
            contactNo: req.body.contactNo,
            collegeName: req.body.collegeName,
            roleCategory: req.body.roleCategory, // Accepts an array of role categories
            yearOfPassing: req.body.yearOfPassing,
            resume: req.file.originalname // Save the original filename
        });

        // Save the application to MongoDB
        await newApplication.save();

        // Send email
        await sendEmail(req.body.email, newApplication);

        // Send a success response to the client
        return res.status(200).json({ message: 'Form submitted successfully!' });
    } catch (error) {
        console.error('Error submitting form:', error);
        // Send an error response to the client
        return res.status(500).json({ error: 'Error submitting form: ' + error.message });
    }
});


// Function to send email
async function sendEmail(senderEmail, application) {
    let transporter = nodemailer.createTransport({
        // Configure your email service
        service: 'Gmail',
        auth: {
            user: 'bhoyeaditya143@gmail.com', // Your email address
            pass: 'ehwb yjsu vqac mdik' // Your email password
        }
    });

    // Setup email data
    let mailOptions = {
        from: senderEmail, // Use a fixed sender email
        to: 'bhoyeaditya143@gmail.com', // Your email address as recipient
        subject: 'New Career Application',
        text: 'New career application received!',
        html: `<p>New career application received!</p>
               <table border="1">
                 <tr><th>Name</th><td>${application.name}</td></tr>
                 <tr><th>Email</th><td>${application.email}</td></tr>
                 <tr><th>Contact No.</th><td>${application.contactNo}</td></tr>
                 <tr><th>College Name</th><td>${application.collegeName}</td></tr>
                 <tr><th>Year of Passing</th><td>${application.yearOfPassing}</td></tr>
                 <tr><th>Role Category</th><td>${application.roleCategory.join(', ')}</td></tr>
                 <tr><th>Exceptional Work</th><td>${application.exceptionalWork}</td></tr>
               </table>`,
        attachments: [
            {
                path: path.join(__dirname, 'uploads', application.resume), // Use the resume file path saved in uploads directory
                filename: application.resume // Use the original filename
            }
        ]
    };

    // Send email
    return transporter.sendMail(mailOptions);
}

// Admin login endpoint
app.post('/adminLogin', (req, res) => {
    const { username, password } = req.body;
    // Validate admin credentials (Replace with your authentication logic)
    if (username === 'admin' && password === 'Shailesh@1') {
        // Redirect to admin dashboard upon successful authentication
        res.redirect('/admin-dashboard');
    } else {
        // Authentication failed
        res.status(401).send('Invalid credentials');
    }
});

// Admin dashboard endpoint
app.get('/admin-dashboard', async (req, res) => {
    try {
        // Fetch all form data from the database
        const formData = await Application.find();
        // Render admin dashboard page with form data
        res.render('admin_dashboard', { formData });
    } catch (error) {
        console.error('Error fetching form data:', error);
        res.status(500).send('Error fetching form data');
    }
});

// Delete record endpoint
// app.delete('/deleteRecord/:email', async (req, res) => {
//     try {
//         const email = req.params.email;
//         // Find the application by email and delete it
//         await Application.findOneAndDelete({ email: email });
//         // Send a success response
//         res.status(200).json({ message: 'Record deleted successfully' });
//     } catch (error) {
//         console.error('Error deleting record:', error);
//         // Send an error response
//         res.status(500).json({ error: 'Error deleting record: ' + error.message });
//     }
// });


app.listen(PORT, () => 
    console.log(`Server is running on port ${PORT}`)
);
