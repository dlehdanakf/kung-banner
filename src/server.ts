// import path from "path";
// import fs from "fs";
// import express from "express";
// import multer from "multer";
// import * as uuid from "uuid";

const path = require("path");
const fs = require("fs");
const express = require("express");
const multer = require("multer");
const uuid = require("uuid");

type BannerRecord = Record<string, Banner>;
type Banner = {
  id: string;
  customer: string;
  title: string;
  startDate: string;
  endDate: string;
  url: string;
  pcMain: string;
  pcAside: string;
  mobile: string;
  backgroundColor: string;
};

class BannerManager {
  static FILE_PATH = path.resolve(process.cwd(), "./banners.json");

  static LOAD() {
    return JSON.parse(fs.readFileSync(this.FILE_PATH, "utf-8"));
  }

  static SAVE(bannerList: BannerRecord) {
    fs.writeFileSync(this.FILE_PATH, JSON.stringify(bannerList));
  }

  protected store: BannerRecord = {};

  constructor() {
    if (!fs.existsSync(BannerManager.FILE_PATH)) {
      BannerManager.SAVE({});
    }

    this.store = BannerManager.LOAD();
  }

  getAll(): Banner[] {
    return [...Object.values(this.store)].reverse();
  }

  getOnAir() {
    return this.getAll()
      .filter(({ startDate }) => {
        const today = new Date().getTime();
        const compare = new Date(`${startDate} 00:00:00`).getTime();

        return compare <= today;
      })
      .filter(({ endDate }) => {
        const today = new Date().getTime();
        const compare = new Date(`${endDate} 00:00:00`).getTime();

        return today <= compare;
      });
  }

  create(banner: Banner) {
    const id = uuid.v4();
    const draft = { ...this.store };

    draft[id] = {
      ...banner,
      id,
    };

    this.store = draft;
    BannerManager.SAVE(draft);
  }

  modify(banner: Banner) {
    const draft = { ...this.store };

    draft[banner.id] = {
      ...banner,
    };

    this.store = draft;
    BannerManager.SAVE(draft);
  }

  remove(bannerId: string) {
    const draft = { ...this.store };

    delete draft[bannerId];

    this.store = draft;
    BannerManager.SAVE(draft);
  }
}

const pickBannerRandomly = (banners: Banner[]): Banner | undefined => {
  const start = 0;
  const end = banners.length;

  if (end === 0) {
    return undefined;
  }

  const index = Math.floor(Math.random() * (end - start + 1) + start) % end;

  return banners[index];
};
const renderBannerInstance = (banner: Banner, image: string, height: number): string => {
  const htmlFile = fs.readFileSync(path.resolve("src/views/banner.xml"), "utf-8");
  const { url, backgroundColor, title } = banner;

  return htmlFile
    .replace("{{url}}", url)
    .replace("{{backgroundColor}}", backgroundColor)
    .replace("{{image}}", image)
    .replace("{{title}}", title)
    .replace("{{height}}", `${height}`);
};

const DEFAULTS: Record<"main" | "aside" | "mobile", Banner> = {
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
    backgroundColor: "#fffef8",
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
    backgroundColor: "#f9fdff",
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
    backgroundColor: "#fefdff",
  },
};

(() => {
  const bannerManager = new BannerManager();
  const app = express();
  const upload = multer({
    storage: multer.diskStorage({
      destination: (_, __, cb) => cb(null, "attachments"),
      filename: (_, { originalname: name }, cb) => cb(null, `${uuid.v4()}.${name.split(".").reduce((_, c) => c, "")}`),
    }),
    fileFilter: (_, { mimetype }, cb) => (mimetype.startsWith("image/") ? cb(null, true) : cb(null, false)),
  });

  app.use(express.urlencoded());
  app.use(express.json());
  app.use("/manage", express.static("src/views"));
  app.use("/image", express.static("attachments"));
  app.use("/asset", express.static("assets"));

  app.get("/", (req, res) => {
    res.redirect("https://kung.kr");
  });

  app.get("/instance", (req, res) => {
    res.redirect("https://kung.kr");
  });
  app.get("/instance/main", (req, res) => {
    const banners = bannerManager.getOnAir().filter(({ pcMain }) => !!pcMain);
    const banner = pickBannerRandomly(banners) || DEFAULTS.main;
    const image = banner.pcMain ? `/image/${banner.pcMain}` : "/asset/roadmap.png";
    const html = renderBannerInstance(banner, image, 100);

    res.send(html);
  });
  app.get("/instance/aside", (req, res) => {
    const banners = bannerManager.getOnAir().filter(({ pcAside }) => !!pcAside);
    const banner = pickBannerRandomly(banners) || DEFAULTS.aside;
    const image = banner.pcAside ? `/image/${banner.pcAside}` : "/asset/facebook.png";
    const html = renderBannerInstance(banner, image, 120);

    res.send(html);
  });
  app.get("/instance/mobile", (req, res) => {
    const banners = bannerManager.getOnAir().filter(({ mobile }) => !!mobile);
    const banner = pickBannerRandomly(banners) || DEFAULTS.mobile;
    const image = banner.mobile ? `/image/${banner.mobile}` : "/asset/instagram.png";
    const html = renderBannerInstance(banner, image, 100);

    res.send(html);
  });

  app.get("/manage/list", (req, res) => {
    res.json(bannerManager.getAll());
  });
  app.get("/manage/onair", (req, res) => {
    res.json(bannerManager.getOnAir());
  });

  app.post("/manage/upload", upload.single("banner_image"), (req, res) => {
    const { file } = req;
    const { filename, originalname } = file || {};

    res.json({
      error: null,
      filename,
      originalname,
    });
  });
  app.post("/manage/edit", (req, res) => {
    const banner = req.body as Banner;
    const { id } = banner;

    if (id === "create") {
      bannerManager.create(banner);

      res.redirect("/manage");
    } else {
      bannerManager.modify(banner);

      res.redirect(`/manage?id=${id}`);
    }
  });
  app.post("/manage/delete", (req, res) => {
    const { body } = req;

    bannerManager.remove(body.id || "");

    res.redirect("/manage");
  });

  app.listen(3000, () => {
    const attachmentDir = path.resolve("attachments");

    if (!fs.existsSync(attachmentDir)) {
      fs.mkdirSync(attachmentDir);
    }

    console.log("server start");
  });
})();
