const multer = require("multer")
const { v4 } = require("uuid")

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, "uploads/feed/") 
    },
    filename: (req, file, callback) => {
        callback(null, v4() + "." + file.mimetype.split("/")[1])
    }
})

const fileFilter = (req, file, callback) => {
    if (file.mimetype === "image/png" || file.mimetype === "image/jpg" || file.mimetype === "image/jpeg") { 
        callback(null, true) 
    } else {
        req.fileValidationError = "jpg, jpeg, png 파일만 업로드 가능합니다.";
        callback(null, false);
    }
}

const upload = multer({
    "storage": storage,
    "fileFilter": fileFilter,
    "limits": { 
        "fileSize": 30 * 1024 * 1024 
    }
})

module.exports = upload