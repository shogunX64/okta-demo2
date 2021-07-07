const express = require('express');
const router = express.Router();


// render dashboard - dasboard.pug
router.get('/', (req, res) => {
    res.render('dasboard');
});


module.exports = router;