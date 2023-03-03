const express = require("express")
const router = require("express").Router()
const path = require("path")

router.get("/home", (req, res) => {
    console.log("호출")
    res.sendFile(path.join(__dirname, "../stepplace_front/build/index.html"))
})

router.get("/admin", (req, res) => {
    console.log("호출")
    res.sendFile(path.join(__dirname, "../stepplace_admin/build/index.html"))
})

module.exports = router