// server.js - Updated Node.js Server for Shmuel Marketplace

// Import necessary modules
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Initialize Express app
const app = express();

// Use CORS middleware to allow requests from the client
app.use(cors());
app.use(express.json());

// Set up static folder for serving uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// In-memory data store (for demonstration purposes)
let products = [];
let viewCount = 0;

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Multer storage configuration for handling file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Routes for the API

// GET route to retrieve all products
app.get('/products', (req, res) => {
    res.json(products);
});

// POST route to add a new product
app.post('/products', upload.single('productImage'), (req, res) => {
    const { productName, productDescription, productPrice } = req.body;
    const imagePath = `/uploads/${req.file.filename}`;
    
    const newProduct = {
        id: products.length + 1,
        name: productName,
        description: productDescription,
        price: productPrice,
        image: imagePath
    };
    
    products.push(newProduct);
    res.status(201).json(newProduct);
});

// DELETE route to remove a product
app.delete('/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const initialLength = products.length;
    products = products.filter(p => p.id !== productId);
    
    if (products.length < initialLength) {
        res.status(200).send({ message: 'Product deleted successfully.' });
    } else {
        res.status(404).send({ error: 'Product not found.' });
    }
});

// GET route for view count
app.get('/view-count', (req, res) => {
    viewCount++;
    res.json({ count: viewCount });
});

// Define the port for the server to listen on.
// Use the PORT environment variable provided by Render, or default to 3000 for local development.
const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
