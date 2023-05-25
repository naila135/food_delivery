const express = require('express');
const session = require('express-session');
const app = express();
const mysql = require('mysql');
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const connection = mysql.createConnection({
    host: '65.109.21.161',
    port: '3306',
    user: 'u51_12guc8l87B',
    password: '67XnsO@WJZKdgk!bU.UNG4+8',
  });
  app.use(session({
    secret: 'some_secret_key',
    resave: false,
    saveUninitialized: true
  }));
  connection.connect((err) => {
    if (err) {
      console.error('Error connecting to the database:', err);
    } else {
      console.log('Connected to the database');
  
      
      connection.query('CREATE DATABASE IF NOT EXISTS food_delivery', (err) => {
        if (err) throw err;
        console.log('Database created');
        connection.query('USE food_delivery'); 
        connection.query(
          `CREATE TABLE IF NOT EXISTS cards (
            id INT PRIMARY KEY AUTO_INCREMENT,
            title VARCHAR(255),
            description TEXT,
            price DECIMAL(10,2),
            type VARCHAR(255))
          `,
          (err) => {
            if (err) throw err;
            console.log('Table created');

          }
        );
        connection.query(
          `  CREATE TABLE IF NOT EXISTS coupons(
            id INT PRIMARY KEY AUTO_INCREMENT,
            title VARCHAR(255),
            value VARCHAR(255),
            discount DECIMAL(10,2)
          )`,
          (err) => {
            if (err) throw err;
            console.log('Table coupons created');

          }
        )
      });
    }
  });
  connection.query('USE food_delivery', (err) => {
    if (err) throw err;
  
    // Define the coupons variable outside the query callback
    let coupons = [];
  
    // Continue with your code here, including the query to retrieve the coupons
    connection.query('SELECT * FROM coupons', (err, results) => {
      if (err) throw err;
  
      // Extract the coupon data from the query results
      coupons = results.map((row) => ({
        id: row.id,
        title: row.title,
        value: row.value,
        discount: row.discount*100,
      }));
  
      console.log('List of coupons:', coupons);
      app.get('/coupons', (req, res) => {
        res.render('coupons', { coupons: coupons }); // Передача переменной coupons в шаблон
      });
      app.locals.coupons = coupons;
      // Pass the coupons to the '/cart' route
      app.get('/cart', (req, res) => {
        const cart = req.session.cart || [];
        const total = (cart.reduce((total, item) => total + parseFloat(item.price.replace('$', '')), 0)).toFixed(2);
        res.render('cart', { cartItems: cart, totalAmount: total, coupons: coupons, Title: 'Cart' });
      });
    });
  
    // Move the '/apply-coupon' route outside the query callback
    app.post('/apply-coupon', (req, res) => {
      const couponValue = req.body.coupon;
  
      // Find the coupon in the coupons array
      const matchingCoupon = coupons.find(coupon => coupon.value === couponValue);
  
      if (matchingCoupon) {
        // Calculate the discounted total
        const total = parseFloat(req.session.totalAmount);
        const discount = parseFloat(matchingCoupon.discount);
        const discountedTotal = (total * (1 - discount)).toFixed(2);
  
        // Update the session with the discounted total
        req.session.totalAmount = discountedTotal;
  
        // Send the updated total amount as a response
        res.json({ totalAmount: discountedTotal });
      } else {
        // If the coupon is not found, send an error response
        res.status(400).json({ error: 'Invalid coupon' });
      }
    });
  
    app.set('view engine', 'pug');
    app.use(express.static(__dirname + '/public'));
    app.use(bodyParser.urlencoded({ extended: true }));
  
    app.get('/', (req, res) => {
      connection.query('SELECT * FROM cards', (error, cardsResults) => {
        if (error) {
          console.error('Error retrieving cards data from the database:', error);
          res.render('error');
        } else {
          connection.query('SELECT DISTINCT type FROM cards', (error, typesResults) => {
            if (error) {
              console.error('Error retrieving types data from the database:', error);
              res.render('error');
            } else {
              const cardTypes = typesResults.map(result => result.type);
              res.render('index', { cards: cardsResults, cardTypes: cardTypes, Title: "delivery" });
            }
          });
        }
      });
    });
    app.post('/add-to-cart', (req, res) => {
      const cart = req.body.cart;
      req.session.cart = cart;
      res.json(cart);
    });
    
    const server = app.listen(25597, () => {
      console.log(`Express running → PORT ${server.address().port}`);
    });
  });
