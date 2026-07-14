import express from "express";
import cors from "cors";
import multer from "multer";

type UploadFile = { id: string; fileName: string };

const app = express();

app.use(cors());
app.use(express.json());

const port = 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const records: { id: string; fileName: string }[] = [];
const upload = multer({ storage: multer.memoryStorage() });
const idempotencyStore = new Map<
  string,
  { status: "pending" | "completed"; record?: UploadFile }
>(); // 임시 멱등키 테이블

app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ msg: "file is not exist" });
    return;
  }
  const idempotencyKey = req.headers["idempotency-key"];
  // key 유뮤 판단
  if (typeof idempotencyKey !== "string") { // type 좁히기
    res.status(400).json({ msg: "idempotencyKey is not exist" });
    return;
  }
  // 멱등키 비교
  const entry = idempotencyStore.get(idempotencyKey);
  if (entry) {
    if (entry.status === "completed") {
      res.json({
        msg: "success",
        record: idempotencyStore.get(idempotencyKey)?.record,
        records,
      });
    } else { // 등록 조회 처리중에 요청시
      res
        .status(409)
        .json({ msg: "같은 요청이 처리 중입니다. 잠시 후 다시 시도하세요." });
    }
  } else {
    idempotencyStore.set(idempotencyKey, { status: "pending" }); // 등록된적 없는 키라면 즉시 등록
    await new Promise((r) => setTimeout(r, 1500));
    const uploadData = {
      id: crypto.randomUUID(),
      fileName: req.file.originalname,
    };
    records.push(uploadData);
    idempotencyStore.set(idempotencyKey, { status: "completed", record: uploadData });
    res.json({
      msg: "success",
      record: idempotencyStore.get(idempotencyKey)?.record,
      records,
    });
  }
});

app.get("/records", (req, res) => {
  res.json(records);
});

app.listen(port, () => {
  console.log(`this app listening at port ${port}`);
});
