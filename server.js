// Import necessary modules
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create Express app
const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Multer storage for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Load initial products from JSON file
let products = [];
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}
const productsFilePath = path.join(__dirname, 'products.json');
if (fs.existsSync(productsFilePath)) {
    try {
        const data = fs.readFileSync(productsFilePath, 'utf8');
        products = JSON.parse(data);
    } catch (err) {
        console.error("Failed to read or parse products.json:", err);
        products = [];
    }
}

// Function to save products to file
const saveProducts = () => {
    fs.writeFileSync(productsFilePath, JSON.stringify(products, null, 2), 'utf8');
};

// Handle view count with a local file
const viewsFilePath = path.join(__dirname, 'views.json');

const getAndUpdateViewCount = () => {
    let currentCount = 0;
    try {
        if (fs.existsSync(viewsFilePath)) {
            const data = fs.readFileSync(viewsFilePath, 'utf8');
            const viewsData = JSON.parse(data);
            currentCount = viewsData.count;
        }
    } catch (err) {
        console.error("Error reading views.json:", err);
    }
    const newCount = currentCount + 1;
    fs.writeFileSync(viewsFilePath, JSON.stringify({ count: newCount }), 'utf8');
    return newCount;
};

// Endpoints
app.get('/products', (req, res) => {
    res.json(products);
});

app.post('/products', upload.single('productImage'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image file uploaded' });
    }

    const newProduct = {
        id: Date.now().toString(),
        name: req.body.productName,
        description: req.body.productDescription,
        price: parseFloat(req.body.productPrice),
        image: `/uploads/${req.file.filename}`
    };

    products.push(newProduct);
    saveProducts();
    res.status(201).json(newProduct);
});

app.delete('/products/:id', (req, res) => {
    const productId = req.params.id;
    const initialLength = products.length;
    products = products.filter(product => product.id !== productId);

    if (products.length < initialLength) {
        saveProducts();
        res.status(200).json({ message: 'Product deleted successfully' });
    } else {
        res.status(404).json({ error: 'Product not found' });
    }
});

// New endpoint to get and increment view count
app.get('/view-count', (req, res) => {
    try {
        const newCount = getAndUpdateViewCount();
        res.json({ count: newCount });
    } catch (error) {
        console.error("Error updating view count:", error);
        res.status(500).json({ error: 'Failed to get or update view count' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
