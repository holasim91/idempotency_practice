import { useState } from "react";
import "./App.css";

type UploadFile = { id: string; fileName: string };

function App() {
  const [file, setFiles] = useState<File | null>();
  const [uploadList, setUploadList] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const handleChangeFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(event.target.files?.[0] ?? null);
  };
  const handleUpload = async () => {
    if (!file) return; 

    const id = crypto.randomUUID();
    const fileName = file.name;
    const newRecord = { id, fileName };
    setIsUploading(true);
    try {
      await new Promise((r) => setTimeout(r, 1500));
      setUploadList((prev) => [...prev, newRecord]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="upload-page">
      <header className="page-header">
        <span className="badge">Idempotency 실습</span>
        <h1>중복 업로드 문제 재현</h1>
        <p>파일을 선택하고 업로드 버튼을 빠르게 여러 번 눌러보세요.</p>
      </header>

      <section className="upload-card">
        <label className="file-field">
          <input type="file" onChange={handleChangeFile} />
        </label>
        <button
          className="upload-button"
          onClick={handleUpload}
          disabled={isUploading}
        >
          {isUploading ? `업로드중..` : `업로드`}
        </button>
      </section>

      <section className="records-card">
        <h2>
          서버에 저장된 레코드
          <span className="record-count">{uploadList.length}</span>
        </h2>
        {uploadList.length === 0 ? (
          <p className="records-empty">아직 저장된 레코드가 없습니다.</p>
        ) : (
          <ul className="record-list">
            {uploadList.map((record) => (
              <li className="record-item" key={record.id}>
                {record.fileName}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default App;
