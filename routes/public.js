const express = require('express');
const router = express.Router();


// render home page - index.pug
router.get('/', (req, res) => {
    res.render('index');
})

module.exports = router;