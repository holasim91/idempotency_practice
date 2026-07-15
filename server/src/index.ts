import express from "express";
import cors from "cors";
import multer from "multer";
import { pool } from "./db";
import { DatabaseError } from "pg";

type UploadFile = { id: string; fileName: string };

const app = express();

app.use(cors());
app.use(express.json());

const port = 3000;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

console.log(await pool.query("SELECT now()"));

const records: { id: string; fileName: string }[] = [];
const upload = multer({ storage: multer.memoryStorage() });

app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ msg: "file is not exist" });
    return;
  }
  const idempotencyKey = req.headers["idempotency-key"];
  // key 유뮤 판단
  if (typeof idempotencyKey !== "string") {
    // type 좁히기
    res.status(400).json({ msg: "idempotencyKey is not exist" });
    return;
  }


// 멱등키 존재 케이스
// INSERT부터, setTime, 업데이트, 조회
try{
  // 일단 등록겸 중복 검사(idempotency_keys가 PK이므로 중복이라면 오류 발생)
   await pool.query(
        `INSERT INTO idempotency_keys (idempotency_key, status) VALUES ($1, 'pending')`,
        [idempotencyKey],
      );
    await new Promise((r) => setTimeout(r, 1500));
    const uploadData = {
        id: crypto.randomUUID(),
        fileName: req.file.originalname,
      };
   await pool.query(
        `UPDATE idempotency_keys SET status='completed', record= $1 WHERE idempotency_key= $2`,
        [uploadData, idempotencyKey],
      );
  // 새 데이터 등록    
  records.push(uploadData);
  res.json({ msg: "success", record: uploadData, records });
}catch(err){
  // 등록하는 도중에 에러가 난다면 여기로
  if(err instanceof DatabaseError && err.code === "23505"){
  // 중복된 멱등키 체크
  const data = await pool.query(
    `SELECT * FROM idempotency_keys WHERE idempotency_key = $1`,
    [idempotencyKey],
  );
  const{status, record} = data.rows[0]
  // 처리중 리턴
  if(status === 'pending'){
    res.status(409).json({msg:'처리중입니다..'})
    return
  }else if (status==='completed'){
    // 기존 값 리턴
    res.json({msg:"success", record, records})
    return 
  } 
  }else{
    throw err
  }
}












});

app.get("/records", (req, res) => {
  res.json(records);
});

app.listen(port, () => {
  console.log(`this app listening at port ${port}`);
});
