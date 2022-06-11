// import path from "path";
// import fs from "fs";
// import express from "express";
// import multer from "multer";
// import * as uuid from "uuid";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var path = require("path");
var fs = require("fs");
var express = require("express");
var multer = require("multer");
var uuid = require("uuid");
var BannerManager = /** @class */ (function () {
    function BannerManager() {
        this.store = {};
        if (!fs.existsSync(BannerManager.FILE_PATH)) {
            BannerManager.SAVE({});
        }
        this.store = BannerManager.LOAD();
    }
    BannerManager.LOAD = function () {
        return JSON.parse(fs.readFileSync(this.FILE_PATH, "utf-8"));
    };
    BannerManager.SAVE = function (bannerList) {
        fs.writeFileSync(this.FILE_PATH, JSON.stringify(bannerList));
    };
    BannerManager.prototype.getAll = function () {
        return __spreadArray([], Object.values(this.store), true).reverse();
    };
    BannerManager.prototype.getOnAir = function () {
        return this.getAll()
            .filter(function (_a) {
            var startDate = _a.startDate;
            var today = new Date().getTime();
            var compare = new Date("".concat(startDate, " 00:00:00")).getTime();
            return compare <= today;
        })
            .filter(function (_a) {
            var endDate = _a.endDate;
            var today = new Date().getTime();
            var compare = new Date("".concat(endDate, " 00:00:00")).getTime();
            return today <= compare;
        });
    };
    BannerManager.prototype.create = function (banner) {
        var id = uuid.v4();
        var draft = __assign({}, this.store);
        draft[id] = __assign(__assign({}, banner), { id: id });
        this.store = draft;
        BannerManager.SAVE(draft);
    };
    BannerManager.prototype.modify = function (banner) {
        var draft = __assign({}, this.store);
        draft[banner.id] = __assign({}, banner);
        this.store = draft;
        BannerManager.SAVE(draft);
    };
    BannerManager.prototype.remove = function (bannerId) {
        var draft = __assign({}, this.store);
        delete draft[bannerId];
        this.store = draft;
        BannerManager.SAVE(draft);
    };
    BannerManager.FILE_PATH = path.resolve(process.cwd(), "./banners.json");
    return BannerManager;
}());
var pickBannerRandomly = function (banners) {
    var start = 0;
    var end = banners.length;
    if (end === 0) {
        return undefined;
    }
    var index = Math.floor(Math.random() * (end - start + 1) + start) % end;
    return banners[index];
};
var renderBannerInstance = function (banner, image, height) {
    var htmlFile = fs.readFileSync(path.resolve("src/views/banner.xml"), "utf-8");
    var url = banner.url, backgroundColor = banner.backgroundColor, title = banner.title;
    return htmlFile
        .replace("{{url}}", url)
        .replace("{{backgroundColor}}", backgroundColor)
        .replace("{{image}}", image)
        .replace("{{title}}", title)
        .replace("{{height}}", "".concat(height));
};
var DEFAULTS = {
    main: {
        id: "main",
        customer: "kung",
        title: "KUNG 포인트 획득 로드맵",
        startDate: "2000-01-01",
        endDate: "2049-12-31",
        url: "https://kung.kr/ku_honeytip/4297772",
        pcMain: "",
        pcAside: "",
        mobile: "",
        backgroundColor: "#fffef8"
    },
    aside: {
        id: "aside",
        customer: "kung",
        title: "KUNG 페이스북",
        startDate: "2000-01-01",
        endDate: "2049-12-31",
        url: "https://www.facebook.com/ducky.kon.1",
        pcMain: "",
        pcAside: "",
        mobile: "",
        backgroundColor: "#f9fdff"
    },
    mobile: {
        id: "aside",
        customer: "kung",
        title: "KUNG 인스타그램",
        startDate: "2000-01-01",
        endDate: "2049-12-31",
        url: "https://www.instagram.com/ku_ducky/",
        pcMain: "",
        pcAside: "",
        mobile: "",
        backgroundColor: "#fefdff"
    }
};
(function () {
    var bannerManager = new BannerManager();
    var app = express();
    var upload = multer({
        storage: multer.diskStorage({
            destination: function (_, __, cb) { return cb(null, "attachments"); },
            filename: function (_, _a, cb) {
                var name = _a.originalname;
                return cb(null, "".concat(uuid.v4(), ".").concat(name.split(".").reduce(function (_, c) { return c; }, "")));
            }
        }),
        fileFilter: function (_, _a, cb) {
            var mimetype = _a.mimetype;
            return (mimetype.startsWith("image/") ? cb(null, true) : cb(null, false));
        }
    });
    app.use(express.urlencoded());
    app.use(express.json());
    app.use("/manage", express.static("src/views"));
    app.use("/image", express.static("attachments"));
    app.use("/asset", express.static("assets"));
    app.get("/instance/main", function (req, res) {
        var banners = bannerManager.getOnAir().filter(function (_a) {
            var pcMain = _a.pcMain;
            return !!pcMain;
        });
        var banner = pickBannerRandomly(banners) || DEFAULTS.main;
        var image = banner.pcMain ? "/image/".concat(banner.pcMain) : "/asset/roadmap.png";
        var html = renderBannerInstance(banner, image, 100);
        res.send(html);
    });
    app.get("/instance/aside", function (req, res) {
        var banners = bannerManager.getOnAir().filter(function (_a) {
            var pcAside = _a.pcAside;
            return !!pcAside;
        });
        var banner = pickBannerRandomly(banners) || DEFAULTS.aside;
        var image = banner.pcAside ? "/image/".concat(banner.pcAside) : "/asset/facebook.png";
        var html = renderBannerInstance(banner, image, 120);
        res.send(html);
    });
    app.get("/instance/mobile", function (req, res) {
        var banners = bannerManager.getOnAir().filter(function (_a) {
            var mobile = _a.mobile;
            return !!mobile;
        });
        var banner = pickBannerRandomly(banners) || DEFAULTS.mobile;
        var image = banner.mobile ? "/image/".concat(banner.mobile) : "/asset/instagram.png";
        var html = renderBannerInstance(banner, image, 100);
        res.send(html);
    });
    app.get("/manage/list", function (req, res) {
        res.json(bannerManager.getAll());
    });
    app.get("/manage/onair", function (req, res) {
        res.json(bannerManager.getOnAir());
    });
    app.post("/manage/upload", upload.single("banner_image"), function (req, res) {
        var file = req.file;
        var _a = file || {}, filename = _a.filename, originalname = _a.originalname;
        res.json({
            error: null,
            filename: filename,
            originalname: originalname
        });
    });
    app.post("/manage/edit", function (req, res) {
        var banner = req.body;
        var id = banner.id;
        if (id === "create") {
            bannerManager.create(banner);
            res.redirect("/manage");
        }
        else {
            bannerManager.modify(banner);
            res.redirect("/manage?id=".concat(id));
        }
    });
    app.post("/manage/delete", function (req, res) {
        var body = req.body;
        bannerManager.remove(body.id || "");
        res.redirect("/manage");
    });
    app.listen(3000, function () {
        var attachmentDir = path.resolve("attachments");
        if (!fs.existsSync(attachmentDir)) {
            fs.mkdirSync(attachmentDir);
        }
        console.log("server start");
    });
})();
