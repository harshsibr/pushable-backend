
require('dotenv').config({ path: require('find-config')('.env') });
const express = require('express');
require('express-async-errors');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser')
const fileUpload = require('express-fileupload');

const connectDB = require('../config/db');
const productRoutes = require('../routes/productRoutes');
const userRoutes = require('../routes/userRoutes');
const adminRoutes = require('../routes/adminRoutes');
const orderRoutes = require('../routes/orderRoutes');
const userOrderRoutes = require('../routes/userOrderRoutes');
const categoryRoutes = require('../routes/categoryRoutes');
const couponRoutes = require('../routes/couponRoutes');
const { isAuth, isAdmin } = require('../config/auth');
const IQCategoriesRoutes = require('../routes/IQCategoriesRoutes');
const paymentRouter = require('../routes/paymentRouter');

connectDB();
const app = express();

// // We are using this for the express-rate-limit middleware
// // See: https://github.com/nfriedly/express-rate-limit
app.enable('trust proxy');
app.set('trust proxy', 1);
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }))
app.use(bodyParser.json({ limit: "50mb" }));
// app.use(express.json({ limit: '4mb' }));
// app.use(helmet());
const whitelist = ["https://testuity.com", "https://www.testuity.com", "https://admin.testuity.com", "http://localhost:3000", "http://localhost:3001", "http://localhost:5173" , "https://gpay-stripe.ibrcloud.com" , "https://iq-management-admin.ibrcloud.com", "https://iq-api.ibrcloud.com/api", "http://iq-api.ibrcloud.com", "https://iq-management.ibrcloud.com", "https://iq-testing.ibrcloud.com", "https://testuity.ibrcloud.com", "https://admin.testuity.ibrcloud.com", "https://pushable-animated.vercel.app"]
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error("Not allowed by CORS"))
    }
  },
  credentials: true,
}
app.use(cors(corsOptions))
// app.use(cors());

app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline'; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src *; font-src *; img-src * data:; media-src *; object-src *; worker-src * blob:;");
  next();
});

app.use((req, res, next) => {
  res.header('X-Frame-Options', 'ALLOW-FROM https://testuity.com/');
  next();
});

app.use(express.static('/var/www/html/iq-backend-nodejs/public'));
// app.use(express.static('./public'));
app.use(express.static(__dirname));
app.use(fileUpload());

app.use(function (req, res, next) {
  res.setHeader(
    'Content-Security-Policy-Report-Only', 
    "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self'; frame-src 'self' https://api.testuity.com;"
  );
  
  next();
});

// //root route
app.get('/', (req, res) => {
  res.send('App works properly!');
});

app.get('/getNumber', (req, res) => {
  res.json({ number: 123456 });
});

//this for route will need for store front, also for admin dashboard
app.use('/api/products/', productRoutes);
app.use('/api/category/', categoryRoutes);
app.use('/api/coupon/', couponRoutes);
app.use('/api/user/', userRoutes);
app.use('/api/order/', isAuth, userOrderRoutes);
app.use('/api/IQCategories', IQCategoriesRoutes);
app.use('/api/payment', paymentRouter);

//if you not use admin dashboard then these two route will not needed.
app.use('/api/admin/', adminRoutes);
app.use('/api/orders/', isAuth, orderRoutes);

// Use express's default error handling middleware
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  res.status(400).json({ message: err.message });
});

const PORT = process.env.PORT || 5000;

// // app.listen(PORT, () => console.log(`server running on port ${PORT}`));

app.listen(PORT, () => console.log(`server running on port ${PORT}`));
