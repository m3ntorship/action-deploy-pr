const express = require('express');
express().get('/health', (req, res)=>{res.json({ok: true})}).listen(3030, () => {
  console.log('listening to port 3030')
})